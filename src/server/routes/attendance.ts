import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

// Validate attendance (mark QR as used and record attendance)
router.post('/validate', (req, res) => {
    try {
        const { qr_token, validated_by } = req.body;

        if (!qr_token) {
            return res.status(400).json({ error: 'qr_token es requerido' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Get QR code
        const qrCode = db.prepare(
            'SELECT qr.*, u.name as player_name FROM daily_qr_codes qr JOIN users u ON qr.user_id = u.id WHERE qr.qr_token = ? AND qr.valid_date = ?'
        ).get(qr_token, today) as any;

        if (!qrCode) {
            return res.status(400).json({ success: false, error: 'Código QR inválido o expirado' });
        }

        if (qrCode.is_used) {
            return res.json({
                success: true,
                player_name: qrCode.player_name,
                is_duplicate: true
            });
        }

        // Get today's event (or create one)
        let event = db.prepare(
            'SELECT * FROM events WHERE team_id = (SELECT team_id FROM users WHERE id = ?) AND event_date = ? LIMIT 1'
        ).get(qrCode.user_id, today) as any;

        if (!event) {
            // Auto-create training event
            const teamId = (db.prepare('SELECT team_id FROM users WHERE id = ?').get(qrCode.user_id) as any)?.team_id || 1;
            const result = db.prepare(
                'INSERT INTO events (team_id, type, event_date, start_time) VALUES (?, ?, ?, ?)'
            ).run(teamId, 'training', today, new Date().toTimeString().slice(0, 5));
            event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
        }

        // Mark QR as used
        db.prepare('UPDATE daily_qr_codes SET is_used = 1 WHERE id = ?').run(qrCode.id);

        // Record attendance
        db.prepare(
            'INSERT INTO attendance (user_id, event_id, qr_code_id, validated_by) VALUES (?, ?, ?, ?)'
        ).run(qrCode.user_id, event.id, qrCode.id, validated_by);

        res.json({
            success: true,
            player_name: qrCode.player_name,
            player_id: qrCode.user_id,
            event_type: event.type,
            validated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Validate attendance error:', error);
        res.status(500).json({ error: 'Error al validar asistencia' });
    }
});

// Get attendance for a specific date
router.get('/date/:date', (req, res) => {
    try {
        const { date } = req.params;
        const teamId = req.query.team_id || 1;

        // Get all players in team
        const players = db.prepare(
            `SELECT u.id, u.name, u.email FROM users u WHERE u.team_id = ? AND u.role = 'player'`
        ).all(teamId) as any[];

        // Get attendance for the date
        const attendance = db.prepare(
            `SELECT a.*, u.name as player_name, u.email as player_email 
       FROM attendance a 
       JOIN users u ON a.user_id = u.id 
       JOIN events e ON a.event_id = e.id
       WHERE e.event_date = ? AND e.team_id = ?`
        ).all(date, teamId) as any[];

        const attendedIds = new Set(attendance.map(a => a.user_id));

        // Get event info
        const event = db.prepare(
            'SELECT * FROM events WHERE event_date = ? AND team_id = ? LIMIT 1'
        ).get(date, teamId);

        res.json({
            date,
            event,
            players: players.map(p => ({
                ...p,
                attended: attendedIds.has(p.id),
                attendance: attendance.find(a => a.user_id === p.id)
            }))
        });
    } catch (error) {
        console.error('Get attendance by date error:', error);
        res.status(500).json({ error: 'Error al obtener asistencia' });
    }
});

// Get attendance calendar data (for month view)
router.get('/calendar', (req, res) => {
    try {
        const { year, month, team_id } = req.query;
        const teamId = team_id || 1;

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

        // Get all events in range
        const events = db.prepare(
            'SELECT * FROM events WHERE team_id = ? AND event_date BETWEEN ? AND ?'
        ).all(teamId, startDate, endDate) as any[];

        // Get attendance counts per day
        const attendanceCounts = db.prepare(
            `SELECT e.event_date, COUNT(a.id) as count 
       FROM events e 
       LEFT JOIN attendance a ON e.id = a.event_id 
       WHERE e.team_id = ? AND e.event_date BETWEEN ? AND ?
       GROUP BY e.event_date`
        ).all(teamId, startDate, endDate) as any[];

        // Get total players in team
        const totalPlayers = (db.prepare(
            `SELECT COUNT(*) as count FROM users WHERE team_id = ? AND role = 'player'`
        ).get(teamId) as any).count;

        res.json({
            events,
            attendanceCounts: attendanceCounts.reduce((acc, curr) => {
                acc[curr.event_date] = curr.count;
                return acc;
            }, {} as Record<string, number>),
            totalPlayers
        });
    } catch (error) {
        console.error('Get calendar data error:', error);
        res.status(500).json({ error: 'Error al obtener datos del calendario' });
    }
});

export default router;
