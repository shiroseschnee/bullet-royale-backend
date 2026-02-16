const axios = require('axios');
require('dotenv').config();

const LICHESS_API_BASE = 'https://lichess.org';

class LichessService {
  constructor() {
    this.baseURL = LICHESS_API_BASE;
  }

  // Exchange OAuth code for access token (PKCE)
  async getAccessToken(code, codeVerifier) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: process.env.LICHESS_REDIRECT_URI,
          client_id: process.env.LICHESS_CLIENT_ID || 'bullet-royale'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Lichess access token:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user account info
  async getUserAccount(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/api/account`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting Lichess account:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get user's recent bullet games
  async getUserBulletGames(username, sinceTimestamp = null) {
    try {
      const params = {
        perfType: 'bullet',
        max: 50, // Get up to 50 recent games
        pgnInJson: false,
        clocks: false,
        evals: false,
        opening: false
      };

      if (sinceTimestamp) {
        params.since = sinceTimestamp;
      }

      const response = await axios.get(
        `${this.baseURL}/api/games/user/${username}`,
        {
          params,
          headers: {
            Accept: 'application/x-ndjson'
          },
          responseType: 'text'
        }
      );

      // Parse NDJSON (newline-delimited JSON)
      const games = response.data
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      return games;
    } catch (error) {
      console.error(`Error fetching games for ${username}:`, error.response?.data || error.message);
      return [];
    }
  }

  // Calculate trophy change based on game result
  calculateTrophyChange(game, username, currentWinStreak = 0) {
    const baseWin = parseInt(process.env.TROPHY_WIN_BASE) || 30;
    const baseLoss = parseInt(process.env.TROPHY_LOSS_BASE) || 20;
    const ratingBonusPer100 = parseInt(process.env.RATING_BONUS_PER_100) || 5;

    // Determine user's color
    const userColor = game.players.white.user?.name.toLowerCase() === username.toLowerCase() 
      ? 'white' 
      : 'black';
    
    const opponentColor = userColor === 'white' ? 'black' : 'white';
    
    // Get ratings
    const userRating = game.players[userColor].rating;
    const opponentRating = game.players[opponentColor].rating;
    
    // Determine result
    let result;
    if (!game.winner) {
      result = 'draw';
    } else if (game.winner === userColor) {
      result = 'win';
    } else {
      result = 'loss';
    }

    let trophyChange = 0;
    let newWinStreak = currentWinStreak;
    const ratingDiff = opponentRating - userRating;

    if (result === 'win') {
      // Win: Base + Rating Bonus + Streak Bonus
      newWinStreak = currentWinStreak + 1;
      
      // Base trophies
      trophyChange = baseWin;
      
      // Rating bonus: +5 per 100 rating difference (if opponent higher rated)
      if (ratingDiff > 0) {
        const ratingBonus = Math.floor(ratingDiff / 100) * ratingBonusPer100;
        trophyChange += ratingBonus;
      }
      
      // Streak bonuses
      if (newWinStreak >= 8) {
        trophyChange += 30; // 8+ win streak: +30 bonus
      } else if (newWinStreak >= 5) {
        trophyChange += 20; // 5-7 win streak: +20 bonus
      } else if (newWinStreak >= 3) {
        trophyChange += 10; // 3-4 win streak: +10 bonus
      }
      
    } else if (result === 'loss') {
      // Loss: Fixed amount (no scaling)
      trophyChange = -baseLoss;
      newWinStreak = 0; // Streak broken
      
    } else {
      // Draw: Usually 0, but trophies if on streak or opponent higher rated
      trophyChange = 0;
      
      // Streak preserved (not increased, not broken)
      if (currentWinStreak >= 3) {
        // Small bonus for maintaining streak on draw
        trophyChange += 5;
      }
      
      // Rating bonus on draw (smaller than win)
      if (ratingDiff > 0) {
        const drawRatingBonus = Math.floor(ratingDiff / 100) * 2; // +2 per 100 (smaller than win)
        trophyChange += drawRatingBonus;
      }
    }

    return {
      result,
      trophyChange,
      newWinStreak,
      streakBonus: result === 'win' && newWinStreak >= 3,
      userColor,
      userRating,
      opponentUsername: game.players[opponentColor].user?.name || 'Anonymous',
      opponentRating,
      gameId: game.id,
      playedAt: new Date(game.createdAt)
    };
  }

  // Process new games for a user
  async processNewGames(username, lastSyncTimestamp = null, currentWinStreak = 0) {
    try {
      const games = await this.getUserBulletGames(username, lastSyncTimestamp);
      
      const processedGames = games
        .filter(game => {
          // Only rated bullet games
          return game.rated && game.speed === 'bullet' && game.status !== 'aborted';
        })
        .sort((a, b) => a.createdAt - b.createdAt) // Sort by oldest first to maintain streak order
        .map(game => {
          const result = this.calculateTrophyChange(game, username, currentWinStreak);
          currentWinStreak = result.newWinStreak; // Update streak for next game
          return result;
        });

      return processedGames;
    } catch (error) {
      console.error(`Error processing games for ${username}:`, error);
      return [];
    }
  }
}

module.exports = new LichessService();
