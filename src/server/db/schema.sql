-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table (admin, coach, player)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'player')) NOT NULL DEFAULT 'player',
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table (training, match)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('training', 'match')) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME,
    location TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily QR codes for players
CREATE TABLE IF NOT EXISTS daily_qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    valid_date DATE NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,
    is_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, valid_date)
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    qr_code_id INTEGER REFERENCES daily_qr_codes(id) ON DELETE SET NULL,
    validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_team_date ON events(team_id, event_date);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_date ON daily_qr_codes(user_id, valid_date);
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON daily_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);

-- Insert default team and admin user (password: admin123)
INSERT OR IGNORE INTO teams (id, name, description) VALUES (1, 'Mi Equipo', 'Equipo principal');
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, team_id) 
VALUES (1, 'Admin', 'admin@team.com', 'YWRtaW4xMjM=', 'admin', 1);
