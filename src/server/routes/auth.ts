import { Router } from 'express';
import db from '../db/connection.js';
import jwt from 'jsonwebtoken';


const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'team-attendance-secret-key-2024';

// Simple password hash (in production use bcrypt)
function simpleHash(password: string): string {
    return Buffer.from(password).toString('base64');
}

function verifyHash(password: string, hash: string): boolean {
    return simpleHash(password) === hash;
}

// Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        if (!verifyHash(password, user.password_hash)) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, team_id: user.team_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                team_id: user.team_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Register player
router.post('/register', (req, res) => {
    try {
        const { name, email, password, team_id } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const passwordHash = simpleHash(password);
        const result = db.prepare(
            'INSERT INTO users (name, email, password_hash, role, team_id) VALUES (?, ?, ?, ?, ?)'
        ).run(name, email, passwordHash, 'player', team_id || 1);

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, team_id: user.team_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                team_id: user.team_id
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Get current user
router.get('/me', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const user = db.prepare('SELECT id, name, email, role, team_id FROM users WHERE id = ?').get(decoded.id);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Auth me error:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
});

export default router;
