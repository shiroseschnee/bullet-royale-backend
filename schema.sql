-- Bullet Royale Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lichess_id VARCHAR(255) UNIQUE NOT NULL,
    lichess_username VARCHAR(255) NOT NULL,
    discord_id VARCHAR(255) UNIQUE,
    discord_username VARCHAR(255),
    current_trophies INTEGER DEFAULT 0,
    current_rating INTEGER DEFAULT 1500,
    current_win_streak INTEGER DEFAULT 0,
    max_win_streak INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_draws INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync TIMESTAMP
);

-- Seasons table
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    season_number INTEGER UNIQUE NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Season rankings (archive of past seasons)
CREATE TABLE season_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id INTEGER REFERENCES seasons(id),
    user_id UUID REFERENCES users(id),
    final_rank INTEGER,
    final_trophies INTEGER,
    max_win_streak INTEGER,
    total_games INTEGER,
    total_wins INTEGER,
    total_draws INTEGER,
    total_losses INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Games table (track processed games to avoid duplicates)
CREATE TABLE games (
    id VARCHAR(255) PRIMARY KEY, -- Lichess game ID
    user_id UUID REFERENCES users(id),
    opponent_username VARCHAR(255),
    opponent_rating INTEGER,
    user_color VARCHAR(10),
    result VARCHAR(20), -- 'win', 'loss', 'draw'
    trophy_change INTEGER,
    played_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_trophies ON users(current_trophies DESC);
CREATE INDEX idx_users_lichess_id ON users(lichess_id);
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_played_at ON games(played_at DESC);
CREATE INDEX idx_season_rankings_season ON season_rankings(season_id);

-- Insert the first season
INSERT INTO seasons (season_number, start_date, is_active) 
VALUES (1, NOW(), TRUE);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- View for current leaderboard
CREATE VIEW leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY current_trophies DESC) as rank,
    id,
    lichess_username,
    discord_username,
    current_trophies,
    current_rating,
    current_win_streak,
    max_win_streak,
    total_games,
    total_wins,
    total_draws,
    total_losses
FROM users
ORDER BY current_trophies DESC;
