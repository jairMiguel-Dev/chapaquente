import { Router, Request, Response } from 'express';
import { pool } from '../server';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/products - Listar todos os produtos
router.get('/', async (req: Request, res: Response) => {
    try {
        const { category, active_only = 'true' } = req.query;

        let query = `
      SELECT p.*, COALESCE(s.quantity, 0) as stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
    `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (active_only === 'true') {
            conditions.push('p.is_active = TRUE');
        }

        if (category) {
            conditions.push(`p.category = $${params.length + 1}`);
            params.push(category);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY p.category, p.name';

        const result = await pool.query(query, params);

        const products = result.rows.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(p.price),
            image: p.image,
            category: p.category,
            tags: p.tags || [],
            stock: parseInt(p.stock),
            isActive: p.is_active
        }));

        res.json({ products });

    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/products/:id - Buscar produto específico
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT p.*, COALESCE(s.quantity, 0) as stock
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.id = $1
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const p = result.rows[0];

        res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(p.price),
            image: p.image,
            category: p.category,
            tags: p.tags || [],
            stock: parseInt(p.stock),
            isActive: p.is_active
        });

    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/products - Criar produto (admin)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { name, description, price, image, category, tags, stock = 50 } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Nome, preço e categoria são obrigatórios' });
        }

        await client.query('BEGIN');

        const result = await client.query(`
      INSERT INTO products (name, description, price, image, category, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, description, price, image, category, tags || []]);

        const product = result.rows[0];

        // Criar estoque inicial
        await client.query(`
      INSERT INTO stock (product_id, quantity)
      VALUES ($1, $2)
    `, [product.id, stock]);

        await client.query('COMMIT');

        res.status(201).json({
            id: product.id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            image: product.image,
            category: product.category,
            tags: product.tags,
            stock: stock
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// PUT /api/products/:id - Atualizar produto (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, image, category, tags, is_active } = req.body;

        const result = await pool.query(`
      UPDATE products 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          image = COALESCE($4, image),
          category = COALESCE($5, category),
          tags = COALESCE($6, tags),
          is_active = COALESCE($7, is_active)
      WHERE id = $8
      RETURNING *
    `, [name, description, price, image, category, tags, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const p = result.rows[0];

        res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            price: parseFloat(p.price),
            image: p.image,
            category: p.category,
            tags: p.tags,
            isActive: p.is_active
        });

    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// DELETE /api/products/:id - Remover produto (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Soft delete - apenas desativa
        const result = await pool.query(`
      UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({ message: 'Produto removido com sucesso' });

    } catch (error) {
        console.error('Erro ao remover produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
