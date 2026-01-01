import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/connection.js';
import authRoutes from './routes/auth.js';
import playersRoutes from './routes/players.js';
import eventsRoutes from './routes/events.js';
import qrRoutes from './routes/qr.js';
import attendanceRoutes from './routes/attendance.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Network access: http://0.0.0.0:${PORT}`);
});
