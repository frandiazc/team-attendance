import { Router } from 'express';
import db from '../db/connection.js';
import { nanoid } from 'nanoid';

const router = Router();

// Get or generate today's QR code for a user
router.get('/daily', (req, res) => {
    try {
        const userId = req.query.user_id;

        if (!userId) {
            return res.status(400).json({ error: 'user_id es requerido' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Check if QR already exists for today
        let qrCode = db.prepare(
            'SELECT * FROM daily_qr_codes WHERE user_id = ? AND valid_date = ?'
        ).get(userId, today) as any;

        if (!qrCode) {
            // Generate new QR code
            const token = nanoid(32);

            const result = db.prepare(
                'INSERT INTO daily_qr_codes (user_id, valid_date, qr_token) VALUES (?, ?, ?)'
            ).run(userId, today, token);

            qrCode = db.prepare('SELECT * FROM daily_qr_codes WHERE id = ?').get(result.lastInsertRowid);
        }

        // Get user info
        const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId) as any;

        res.json({
            ...qrCode,
            user: user
        });
    } catch (error) {
        console.error('Get daily QR error:', error);
        res.status(500).json({ error: 'Error al obtener código QR' });
    }
});

// Verify QR code (used by scanner to check if valid)
router.get('/verify/:token', (req, res) => {
    try {
        const { token } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const qrCode = db.prepare(
            'SELECT qr.*, u.name as player_name, u.email as player_email FROM daily_qr_codes qr JOIN users u ON qr.user_id = u.id WHERE qr.qr_token = ? AND qr.valid_date = ?'
        ).get(token, today) as any;

        if (!qrCode) {
            return res.json({ valid: false, reason: 'Código QR inválido o expirado' });
        }

        if (qrCode.is_used) {
            return res.json({ valid: false, reason: 'Código QR ya utilizado', player_name: qrCode.player_name });
        }

        res.json({
            valid: true,
            qr_id: qrCode.id,
            user_id: qrCode.user_id,
            player_name: qrCode.player_name,
            player_email: qrCode.player_email
        });
    } catch (error) {
        console.error('Verify QR error:', error);
        res.status(500).json({ error: 'Error al verificar código QR' });
    }
});

export default router;
