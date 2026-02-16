const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cron = require('node-cron');
const crypto = require('crypto');
require('dotenv').config();

const db = require('./database');
const lichessService = require('./lichess');

const app = express();
const PORT = process.env.PORT || 3001;

// Store PKCE verifiers temporarily (in production, use Redis)
const pkceVerifiers = new Map();

// Middleware
app.use(cors({
  origin: [
    'https://shiroseschnee.github.io',
    'https://shiroseschnee.github.io/bullet-royale-frontend',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Helper functions for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== LICHESS OAUTH (PKCE) ====================

// Step 1: Redirect to Lichess OAuth with PKCE
app.get('/auth/lichess', (req, res) => {
  // Lichess PKCE doesn't require pre-registered apps!
  // Use your domain/localhost as the client_id
  const clientId = process.env.LICHESS_CLIENT_ID || req.get('host') || 'localhost:3001';
  const redirectUri = encodeURIComponent(process.env.LICHESS_REDIRECT_URI);
  
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store verifier temporarily (expires in 10 minutes)
  pkceVerifiers.set(state, codeVerifier);
  setTimeout(() => pkceVerifiers.delete(state), 10 * 60 * 1000);
  
  const authUrl = `https://lichess.org/oauth?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `code_challenge_method=S256&` +
    `code_challenge=${codeChallenge}&` +
    `state=${state}&` +
    `scope=preference:read`;
  
  res.redirect(authUrl);
});

// Step 2: Handle OAuth callback
app.get('/auth/lichess/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=no_code`);
  }

  // Retrieve code verifier
  const codeVerifier = pkceVerifiers.get(state);
  if (!codeVerifier) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
  }
  
  // Clean up verifier
  pkceVerifiers.delete(state);

  try {
    // Exchange code for access token with PKCE
    const accessToken = await lichessService.getAccessToken(code, codeVerifier);
    
    // Get user account info
    const lichessAccount = await lichessService.getUserAccount(accessToken);
    
    // Check if user exists
    let user = await db.getUserByLichessId(lichessAccount.id);
    
    if (!user) {
      // Create new user
      user = await db.createUser({
        lichessId: lichessAccount.id,
        lichessUsername: lichessAccount.username,
        discordId: null,
        discordUsername: null
      });
      console.log(`✅ New user created: ${lichessAccount.username}`);
    }

    // Store user in session
    req.session.userId = user.id;
    req.session.lichessUsername = user.lichess_username;
    
    // Trigger initial sync
    await syncUserGames(user);

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}?auth=success&username=${user.lichess_username}`);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
  }
});

// ==================== DISCORD OAUTH (Optional) ====================

app.get('/auth/discord', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
  const scope = 'identify';
  
  const authUrl = `https://discord.com/api/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  res.redirect(authUrl);
});

app.get('/auth/discord/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || !req.session.userId) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=discord_failed`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const discordUser = userResponse.data;

    // Update user with Discord info
    await db.query(
      'UPDATE users SET discord_id = $1, discord_username = $2 WHERE id = $3',
      [discordUser.id, discordUser.username, req.session.userId]
    );

    res.redirect(`${process.env.FRONTEND_URL}?discord=success`);
  } catch (error) {
    console.error('Discord OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}?error=discord_failed`);
  }
});

// ==================== API ENDPOINTS ====================

// Get current user info
app.get('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rank = await db.getUserRank(req.session.userId);
    
    res.json({
      ...user.rows[0],
      rank
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = await db.getLeaderboard(parseInt(limit) || 100);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's recent games
app.get('/api/user/:username/games', async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id FROM users WHERE lichess_username = $1',
      [req.params.username]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const games = await db.getRecentGames(user.rows[0].id, parseInt(req.query.limit) || 10);
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual sync for a user
app.post('/api/sync', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await syncUserGames(user.rows[0]);
    res.json(result);
  } catch (error) {
    console.error('Error syncing games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current season info
app.get('/api/season/current', async (req, res) => {
  try {
    const season = await db.getCurrentSeason();
    res.json(season);
  } catch (error) {
    console.error('Error fetching season:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get past season rankings
app.get('/api/season/:seasonId/rankings', async (req, res) => {
  try {
    const rankings = await db.getSeasonRankings(parseInt(req.params.seasonId));
    res.json(rankings);
  } catch (error) {
    console.error('Error fetching season rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ==================== GAME SYNC LOGIC ====================

async function syncUserGames(user) {
  try {
    const lastSyncTimestamp = user.last_sync 
      ? new Date(user.last_sync).getTime() 
      : Date.now() - (30 * 24 * 60 * 60 * 1000); // Last 30 days if never synced

    const newGames = await lichessService.processNewGames(
      user.lichess_username,
      lastSyncTimestamp,
      user.current_win_streak || 0
    );

    let totalTrophyChange = 0;
    let gamesProcessed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let currentStreak = user.current_win_streak || 0;

    for (const gameData of newGames) {
      // Check if game already processed
      const exists = await db.gameExists(gameData.gameId);
      if (exists) continue;

      // Save game
      await db.createGame({
        id: gameData.gameId,
        userId: user.id,
        opponentUsername: gameData.opponentUsername,
        opponentRating: gameData.opponentRating,
        userColor: gameData.userColor,
        result: gameData.result,
        trophyChange: gameData.trophyChange,
        playedAt: gameData.playedAt
      });

      totalTrophyChange += gameData.trophyChange;
      currentStreak = gameData.newWinStreak;
      gamesProcessed++;
      
      if (gameData.result === 'win') wins++;
      else if (gameData.result === 'draw') draws++;
      else if (gameData.result === 'loss') losses++;
    }

    // Update user trophies and stats
    if (gamesProcessed > 0) {
      await db.updateUserTrophies(
        user.id, 
        totalTrophyChange, 
        newGames[0]?.userRating || user.current_rating,
        currentStreak
      );
      await db.updateUserStats(user.id, gamesProcessed, wins, draws, losses);
      
      const streakInfo = currentStreak > 0 ? ` 🔥 ${currentStreak} streak` : '';
      console.log(`✅ ${user.lichess_username}: ${gamesProcessed} games, ${totalTrophyChange > 0 ? '+' : ''}${totalTrophyChange} trophies${streakInfo}`);
    }

    return {
      gamesProcessed,
      totalTrophyChange,
      wins,
      draws,
      losses,
      currentStreak
    };
  } catch (error) {
    console.error(`Error syncing games for ${user.lichess_username}:`, error);
    throw error;
  }
}

// ==================== BACKGROUND SYNC ====================

// Sync all users periodically (every 5 minutes)
const syncInterval = parseInt(process.env.SYNC_INTERVAL_MINUTES) || 5;

cron.schedule(`*/${syncInterval} * * * *`, async () => {
  console.log('🔄 Starting periodic sync for all users...');
  
  try {
    const result = await db.query('SELECT * FROM users');
    const users = result.rows;

    for (const user of users) {
      try {
        await syncUserGames(user);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error syncing ${user.lichess_username}:`, error.message);
      }
    }

    console.log('✅ Periodic sync completed');
  } catch (error) {
    console.error('Error in periodic sync:', error);
  }
});

// ==================== MONTHLY RESET ====================

// Reset on the 1st of each month at midnight UTC
cron.schedule('0 0 1 * *', async () => {
  console.log('🔄 Starting monthly season reset...');
  
  try {
    await db.archiveCurrentSeasonAndReset();
    console.log('✅ Monthly reset completed successfully');
  } catch (error) {
    console.error('❌ Error during monthly reset:', error);
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║       🏆 BULLET ROYALE API SERVER 🏆            ║
╚═══════════════════════════════════════════════════╝

Server running on port ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}

API Endpoints:
  GET  /health                    - Health check
  GET  /auth/lichess              - Start Lichess OAuth
  GET  /auth/discord              - Start Discord OAuth
  GET  /api/user                  - Get current user
  GET  /api/leaderboard           - Get leaderboard
  POST /api/sync                  - Manual sync games
  GET  /api/season/current        - Current season info
  
Background Jobs:
  ⏰ Game sync: Every ${syncInterval} minutes
  📅 Season reset: 1st of each month at midnight UTC

Ready to accept connections! ⚡
  `);
});

module.exports = app;
