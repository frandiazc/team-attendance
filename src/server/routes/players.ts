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
