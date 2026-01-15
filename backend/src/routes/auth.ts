import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../server';
import { generateToken } from '../middleware/auth';
import { RegisterUserDTO, LoginDTO } from '../types';

const router = Router();

// POST /api/auth/register - Cadastrar novo usuário
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password }: RegisterUserDTO = req.body;

        // Validações
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Verificar se email já existe
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const password_hash = await bcrypt.hash(password, 10);

        // Inserir usuário
        const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, loyalty_points, loyalty_started_at)
      VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP)
      RETURNING id, name, email, loyalty_points, is_admin, created_at
    `, [name, email.toLowerCase(), password_hash]);

        const user = result.rows[0];

        // Gerar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin
        });

        res.status(201).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                loyaltyPoints: user.loyalty_points,
                isAdmin: user.is_admin
            },
            token
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/auth/login - Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password }: LoginDTO = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const user = result.rows[0];

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        // Gerar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin
        });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                loyaltyPoints: user.loyalty_points,
                loyaltyStartedAt: user.loyalty_started_at,
                isAdmin: user.is_admin
            },
            token
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/auth/guest - Login como visitante (sem cadastro)
router.post('/guest', async (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Retorna dados do visitante sem criar no banco
        res.json({
            user: {
                id: `guest_${Date.now()}`,
                name,
                email: null,
                loyaltyPoints: 0,
                isAdmin: false,
                isGuest: true
            },
            token: null // Visitantes não têm token
        });

    } catch (error) {
        console.error('Erro no guest login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
