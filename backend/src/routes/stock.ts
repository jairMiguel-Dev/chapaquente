import { Router, Request, Response } from 'express';
import { pool } from '../server';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/stock - Listar estoque de todos os produtos
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
      SELECT p.id, p.name, p.category, COALESCE(s.quantity, 0) as quantity, s.updated_at
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.is_active = TRUE
      ORDER BY p.category, p.name
    `);

        const stock = result.rows.map(s => ({
            productId: s.id,
            productName: s.name,
            category: s.category,
            quantity: parseInt(s.quantity),
            updatedAt: s.updated_at
        }));

        res.json({ stock });

    } catch (error) {
        console.error('Erro ao listar estoque:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/stock/:productId - Buscar estoque de um produto
router.get('/:productId', async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;

        const result = await pool.query(`
      SELECT p.id, p.name, COALESCE(s.quantity, 0) as quantity, s.updated_at
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.id = $1
    `, [productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const s = result.rows[0];

        res.json({
            productId: s.id,
            productName: s.name,
            quantity: parseInt(s.quantity),
            updatedAt: s.updated_at
        });

    } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// PUT /api/stock/:productId - Atualizar estoque (admin)
router.put('/:productId', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: 'Quantidade inválida' });
        }

        // Upsert estoque
        const result = await pool.query(`
      INSERT INTO stock (product_id, quantity, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (product_id) 
      DO UPDATE SET quantity = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [productId, quantity]);

        res.json({
            productId: parseInt(result.rows[0].product_id),
            quantity: parseInt(result.rows[0].quantity),
            updatedAt: result.rows[0].updated_at
        });

    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/stock/batch - Atualizar estoque em lote (admin)
router.post('/batch', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { updates } = req.body; // [{ productId: 1, quantity: 50 }, ...]

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ error: 'Lista de atualizações inválida' });
        }

        await client.query('BEGIN');

        for (const update of updates) {
            await client.query(`
        INSERT INTO stock (product_id, quantity, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (product_id) 
        DO UPDATE SET quantity = $2, updated_at = CURRENT_TIMESTAMP
      `, [update.productId, update.quantity]);
        }

        await client.query('COMMIT');

        res.json({ message: 'Estoque atualizado com sucesso', count: updates.length });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar estoque em lote:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// GET /api/stock/low - Produtos com estoque baixo (admin)
router.get('/alerts/low', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { threshold = 10 } = req.query;

        const result = await pool.query(`
      SELECT p.id, p.name, p.category, COALESCE(s.quantity, 0) as quantity
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.is_active = TRUE AND COALESCE(s.quantity, 0) <= $1
      ORDER BY s.quantity ASC
    `, [threshold]);

        const lowStock = result.rows.map(s => ({
            productId: s.id,
            productName: s.name,
            category: s.category,
            quantity: parseInt(s.quantity)
        }));

        res.json({ lowStock, threshold: parseInt(threshold as string) });

    } catch (error) {
        console.error('Erro ao buscar estoque baixo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
