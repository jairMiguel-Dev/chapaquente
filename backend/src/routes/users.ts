import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../server';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/users/me - Dados do usuário logado
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
      SELECT id, name, email, loyalty_points, loyalty_started_at, is_admin, created_at
      FROM users WHERE id = $1
    `, [req.user!.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = result.rows[0];

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            loyaltyPoints: user.loyalty_points,
            loyaltyStartedAt: user.loyalty_started_at,
            isAdmin: user.is_admin,
            createdAt: user.created_at
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/users/me - Atualizar dados do usuário
router.put('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;

        // Se está mudando senha, verifica a senha atual
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Senha atual é obrigatória para alterar a senha' });
            }

            const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
            const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

            if (!validPassword) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }
        }

        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params: any[] = [];

        if (name) {
            params.push(name);
            updateQuery += `, name = $${params.length}`;
        }

        if (email) {
            // Verifica se email já está em uso
            const existingEmail = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email.toLowerCase(), req.user!.userId]
            );

            if (existingEmail.rows.length > 0) {
                return res.status(409).json({ error: 'Email já está em uso' });
            }

            params.push(email.toLowerCase());
            updateQuery += `, email = $${params.length}`;
        }

        if (newPassword) {
            const hash = await bcrypt.hash(newPassword, 10);
            params.push(hash);
            updateQuery += `, password_hash = $${params.length}`;
        }

        params.push(req.user!.userId);
        updateQuery += ` WHERE id = $${params.length} RETURNING id, name, email, loyalty_points, is_admin`;

        const result = await pool.query(updateQuery, params);
        const user = result.rows[0];

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            loyaltyPoints: user.loyalty_points,
            isAdmin: user.is_admin
        });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/users/loyalty/redeem - Resgatar prêmio fidelidade
router.post('/loyalty/redeem', authMiddleware, async (req: Request, res: Response) => {
    try {
        // Verifica se tem 10 selos
        const userResult = await pool.query(
            'SELECT loyalty_points FROM users WHERE id = $1',
            [req.user!.userId]
        );

        if (userResult.rows[0].loyalty_points < 10) {
            return res.status(400).json({ error: 'Você precisa de 10 selos para resgatar o prêmio' });
        }

        // Zera os pontos
        await pool.query(`
      UPDATE users SET loyalty_points = 0, loyalty_started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [req.user!.userId]);

        res.json({
            message: '🎉 Prêmio resgatado com sucesso! Você ganhou um Hot Dog grátis!',
            newPoints: 0
        });

    } catch (error) {
        console.error('Erro ao resgatar prêmio:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/users - Listar usuários (admin)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(`
      SELECT id, name, email, loyalty_points, is_admin, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

        const users = result.rows.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            loyaltyPoints: u.loyalty_points,
            isAdmin: u.is_admin,
            createdAt: u.created_at
        }));

        res.json({ users });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PATCH /api/users/:id/admin - Tornar usuário admin (admin)
router.patch('/:id/admin', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_admin } = req.body;

        const result = await pool.query(`
      UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, email, is_admin
    `, [is_admin, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao atualizar admin:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
