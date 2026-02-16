const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper functions for common queries
const db = {
  // Execute a query
  query: (text, params) => pool.query(text, params),

  // User operations
  async getUserByLichessId(lichessId) {
    const result = await pool.query(
      'SELECT * FROM users WHERE lichess_id = $1',
      [lichessId]
    );
    return result.rows[0];
  },

  async createUser(userData) {
    const result = await pool.query(
      `INSERT INTO users (lichess_id, lichess_username, discord_id, discord_username)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userData.lichessId, userData.lichessUsername, userData.discordId, userData.discordUsername]
    );
    return result.rows[0];
  },

  async updateUserTrophies(userId, trophyChange, newRating, newWinStreak) {
    const result = await pool.query(
      `UPDATE users 
       SET current_trophies = GREATEST(0, current_trophies + $2),
           current_rating = $3,
           current_win_streak = $4,
           max_win_streak = GREATEST(max_win_streak, $4),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, trophyChange, newRating, newWinStreak]
    );
    return result.rows[0];
  },

  async updateUserStats(userId, gamesPlayed, wins, draws, losses) {
    const result = await pool.query(
      `UPDATE users 
       SET total_games = total_games + $2,
           total_wins = total_wins + $3,
           total_draws = total_draws + $4,
           total_losses = total_losses + $5,
           last_sync = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, gamesPlayed, wins, draws, losses]
    );
    return result.rows[0];
  },

  // Leaderboard operations
  async getLeaderboard(limit = 100) {
    const query = 'SELECT * FROM leaderboard LIMIT $1';
    const result = await pool.query(query, [limit]);
    return result.rows;
  },

  async getUserRank(userId) {
    const result = await pool.query(
      'SELECT rank FROM leaderboard WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.rank || null;
  },

  // Game operations
  async gameExists(gameId) {
    const result = await pool.query(
      'SELECT id FROM games WHERE id = $1',
      [gameId]
    );
    return result.rows.length > 0;
  },

  async createGame(gameData) {
    const result = await pool.query(
      `INSERT INTO games (id, user_id, opponent_username, opponent_rating, user_color, result, trophy_change, played_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        gameData.id,
        gameData.userId,
        gameData.opponentUsername,
        gameData.opponentRating,
        gameData.userColor,
        gameData.result,
        gameData.trophyChange,
        gameData.playedAt
      ]
    );
    return result.rows[0];
  },

  async getRecentGames(userId, limit = 10) {
    const result = await pool.query(
      'SELECT * FROM games WHERE user_id = $1 ORDER BY played_at DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  },

  // Season operations
  async getCurrentSeason() {
    const result = await pool.query(
      'SELECT * FROM seasons WHERE is_active = TRUE ORDER BY season_number DESC LIMIT 1'
    );
    return result.rows[0];
  },

  async archiveCurrentSeasonAndReset() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current season
      const seasonResult = await client.query(
        'SELECT id FROM seasons WHERE is_active = TRUE LIMIT 1'
      );
      const currentSeasonId = seasonResult.rows[0]?.id;

      if (!currentSeasonId) {
        throw new Error('No active season found');
      }

      // Archive current rankings
      await client.query(
        `INSERT INTO season_rankings (season_id, user_id, final_rank, final_trophies, max_win_streak, total_games, total_wins, total_draws, total_losses)
         SELECT $1, id, 
                ROW_NUMBER() OVER (ORDER BY current_trophies DESC),
                current_trophies,
                max_win_streak,
                total_games,
                total_wins,
                total_draws,
                total_losses
         FROM users
         WHERE current_trophies > 0`,
        [currentSeasonId]
      );

      // Close current season
      await client.query(
        'UPDATE seasons SET is_active = FALSE, end_date = NOW() WHERE id = $1',
        [currentSeasonId]
      );

      // Get next season number
      const nextSeasonResult = await client.query(
        'SELECT COALESCE(MAX(season_number), 0) + 1 as next_number FROM seasons'
      );
      const nextSeasonNumber = nextSeasonResult.rows[0].next_number;

      // Create new season
      await client.query(
        'INSERT INTO seasons (season_number, start_date, is_active) VALUES ($1, NOW(), TRUE)',
        [nextSeasonNumber]
      );

      // Reset all user trophies and streaks
      await client.query('UPDATE users SET current_trophies = 0, current_win_streak = 0');

      await client.query('COMMIT');
      console.log(`✅ Season ${nextSeasonNumber - 1} archived, Season ${nextSeasonNumber} started`);
      
      return nextSeasonNumber;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error archiving season:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getSeasonRankings(seasonId) {
    const result = await pool.query(
      `SELECT sr.*, u.lichess_username, u.discord_username
       FROM season_rankings sr
       JOIN users u ON sr.user_id = u.id
       WHERE sr.season_id = $1
       ORDER BY sr.final_rank ASC`,
      [seasonId]
    );
    return result.rows;
  }
};

module.exports = db;
