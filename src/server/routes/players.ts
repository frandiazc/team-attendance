import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

// Get all players for a team
router.get('/', (req, res) => {
    try {
        const teamId = req.query.team_id || 1;
        const players = db.prepare(
            `SELECT id, name, email, created_at FROM users WHERE team_id = ? AND role = 'player' ORDER BY name`
        ).all(teamId);

        res.json(players);
    } catch (error) {
        console.error('Get players error:', error);
        res.status(500).json({ error: 'Error al obtener jugadores' });
    }
});

// Get single player
router.get('/:id', (req, res) => {
    try {
        const player = db.prepare(
            'SELECT id, name, email, team_id, created_at FROM users WHERE id = ? AND role = ?'
        ).get(req.params.id, 'player');

        if (!player) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        res.json(player);
    } catch (error) {
        console.error('Get player error:', error);
        res.status(500).json({ error: 'Error al obtener jugador' });
    }
});

// Create player
router.post('/', (req, res) => {
    try {
        const { name, email, team_id } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Default password is the email
        const passwordHash = Buffer.from(email).toString('base64');

        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash, role, team_id) VALUES (?, ?, ?, ?, ?)'
        ).run(name, email, passwordHash, 'player', team_id || 1);

        const player = db.prepare('SELECT id, name, email, team_id, created_at FROM users WHERE id = ?')
            .get(result.lastInsertRowid);

        res.json(player);
    } catch (error) {
        console.error('Create player error:', error);
        res.status(500).json({ error: 'Error al crear jugador' });
    }
});

// Update player
router.put('/:id', (req, res) => {
    try {
        const { name, email } = req.body;
        const playerId = req.params.id;

        // Check if player exists
        const player = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(playerId, 'player') as any;
        if (!player) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        // Check if new email is already taken by another user
        if (email && email !== player.email) {
            const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, playerId);
            if (existing) {
                return res.status(400).json({ error: 'El email ya está en uso' });
            }
        }

        // Update player
        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(
            name || player.name,
            email || player.email,
            playerId
        );

        // If email changed, update password to new email
        if (email && email !== player.email) {
            const newPasswordHash = Buffer.from(email).toString('base64');
            db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, playerId);
        }

        const updatedPlayer = db.prepare('SELECT id, name, email, team_id, created_at FROM users WHERE id = ?').get(playerId);
        res.json(updatedPlayer);
    } catch (error) {
        console.error('Update player error:', error);
        res.status(500).json({ error: 'Error al actualizar jugador' });
    }
});

// Reset player password (set to their email)
router.put('/:id/reset-password', (req, res) => {
    try {
        const playerId = req.params.id;

        const player = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(playerId, 'player') as any;
        if (!player) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        const newPasswordHash = Buffer.from(player.email).toString('base64');
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, playerId);

        res.json({ success: true, message: 'Contraseña reseteada al email del jugador' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Error al resetear contraseña' });
    }
});

// Get player statistics
router.get('/:id/stats', (req, res) => {
    try {
        const playerId = req.params.id;

        const player = db.prepare('SELECT id, name, email, team_id FROM users WHERE id = ? AND role = ?').get(playerId, 'player') as any;
        if (!player) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        // Total events for the team
        const totalEvents = (db.prepare(
            'SELECT COUNT(*) as count FROM events WHERE team_id = ?'
        ).get(player.team_id) as any).count;

        // Events with this player's attendance
        const attendedEvents = (db.prepare(
            'SELECT COUNT(*) as count FROM attendance WHERE user_id = ?'
        ).get(playerId) as any).count;

        // Breakdown by event type
        const matchesAttended = (db.prepare(
            `SELECT COUNT(*) as count FROM attendance a 
             JOIN events e ON a.event_id = e.id 
             WHERE a.user_id = ? AND e.type = 'match'`
        ).get(playerId) as any).count;

        const trainingsAttended = (db.prepare(
            `SELECT COUNT(*) as count FROM attendance a 
             JOIN events e ON a.event_id = e.id 
             WHERE a.user_id = ? AND e.type = 'training'`
        ).get(playerId) as any).count;

        // Total matches and trainings
        const totalMatches = (db.prepare(
            `SELECT COUNT(*) as count FROM events WHERE team_id = ? AND type = 'match'`
        ).get(player.team_id) as any).count;

        const totalTrainings = (db.prepare(
            `SELECT COUNT(*) as count FROM events WHERE team_id = ? AND type = 'training'`
        ).get(player.team_id) as any).count;

        // Recent attendance (last 10)
        const recentAttendance = db.prepare(
            `SELECT a.validated_at, e.event_date, e.type, e.location 
             FROM attendance a 
             JOIN events e ON a.event_id = e.id 
             WHERE a.user_id = ? 
             ORDER BY a.validated_at DESC 
             LIMIT 10`
        ).all(playerId);

        const attendancePercentage = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0;

        res.json({
            player,
            stats: {
                totalEvents,
                attendedEvents,
                attendancePercentage,
                matches: { attended: matchesAttended, total: totalMatches },
                trainings: { attended: trainingsAttended, total: totalTrainings }
            },
            recentAttendance
        });
    } catch (error) {
        console.error('Get player stats error:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Delete player
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(req.params.id, 'player');

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete player error:', error);
        res.status(500).json({ error: 'Error al eliminar jugador' });
    }
});

export default router;
