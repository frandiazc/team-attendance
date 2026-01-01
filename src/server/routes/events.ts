import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

// Get all events for a team
router.get('/', (req, res) => {
    try {
        const teamId = req.query.team_id || 1;
        const { from, to } = req.query;

        let query = 'SELECT * FROM events WHERE team_id = ?';
        const params: any[] = [teamId];

        if (from) {
            query += ' AND event_date >= ?';
            params.push(from);
        }
        if (to) {
            query += ' AND event_date <= ?';
            params.push(to);
        }

        query += ' ORDER BY event_date DESC, start_time DESC';

        const events = db.prepare(query).all(...params);
        res.json(events);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
});

// Get today's event or create one
router.get('/today', (req, res) => {
    try {
        const teamId = req.query.team_id || 1;
        const today = new Date().toISOString().split('T')[0];

        let event = db.prepare(
            'SELECT * FROM events WHERE team_id = ? AND event_date = ? LIMIT 1'
        ).get(teamId, today);

        if (!event) {
            // Auto-create a training event for today
            const result = db.prepare(
                'INSERT INTO events (team_id, type, event_date, start_time) VALUES (?, ?, ?, ?)'
            ).run(teamId, 'training', today, '18:00');

            event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
        }

        res.json(event);
    } catch (error) {
        console.error('Get today event error:', error);
        res.status(500).json({ error: 'Error al obtener evento de hoy' });
    }
});

// Create event
router.post('/', (req, res) => {
    try {
        const { team_id, type, event_date, start_time, location, description } = req.body;

        if (!type || !event_date) {
            return res.status(400).json({ error: 'Tipo y fecha son requeridos' });
        }

        const result = db.prepare(
            'INSERT INTO events (team_id, type, event_date, start_time, location, description) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(team_id || 1, type, event_date, start_time, location, description);

        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
        res.json(event);
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

// Update event
router.put('/:id', (req, res) => {
    try {
        const { type, event_date, start_time, location, description } = req.body;

        db.prepare(
            'UPDATE events SET type = ?, event_date = ?, start_time = ?, location = ?, description = ? WHERE id = ?'
        ).run(type, event_date, start_time, location, description, req.params.id);

        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
        res.json(event);
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Error al actualizar evento' });
    }
});

// Delete event
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({ error: 'Error al eliminar evento' });
    }
});

export default router;
