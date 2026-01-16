import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../server';
import { authMiddleware, adminMiddleware, optionalAuth } from '../middleware/auth';
import { CreateOrderDTO, OrderStatus } from '../types';

const router = Router();

// Gerar ID curto para o pedido (ex: A7XK9M2)
const generateOrderId = (): string => {
    return Math.random().toString(36).substr(2, 7).toUpperCase();
};

// GET /api/orders - Listar pedidos (admin: todos, user: apenas seus)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'custom_description', oi.custom_description
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;

        const params: any[] = [];
        const conditions: string[] = [];

        // Filtrar por usuário se não for admin
        if (req.user && !req.user.isAdmin) {
            conditions.push(`o.user_id = $${params.length + 1}`);
            params.push(req.user.userId);
        }

        // Filtrar por status
        if (status) {
            conditions.push(`o.status = $${params.length + 1}`);
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        // Formatar resposta
        const orders = result.rows.map(order => ({
            id: order.id,
            customerName: order.customer_name,
            status: order.status,
            total: parseFloat(order.total),
            deliveryMode: order.delivery_mode,
            deliveryAddress: order.delivery_address,
            deliveryFee: parseFloat(order.delivery_fee || 0),
            paymentMethod: order.payment_method,
            machineNeeded: order.machine_needed,
            queuePosition: order.queue_position,
            observation: order.observation || null, // Observação do cliente
            createdAt: order.created_at,
            items: order.items[0]?.id ? order.items.map((item: any) => ({
                id: item.id,
                productId: item.product_id,
                name: item.product_name,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
                customDescription: item.custom_description
            })) : []
        }));

        res.json({ orders, total: orders.length });

    } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/orders/:id - Buscar pedido específico
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'custom_description', oi.custom_description
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        const order = result.rows[0];

        res.json({
            id: order.id,
            customerName: order.customer_name,
            status: order.status,
            total: parseFloat(order.total),
            deliveryMode: order.delivery_mode,
            deliveryAddress: order.delivery_address,
            deliveryFee: parseFloat(order.delivery_fee || 0),
            paymentMethod: order.payment_method,
            machineNeeded: order.machine_needed,
            queuePosition: order.queue_position,
            createdAt: order.created_at,
            items: order.items[0]?.id ? order.items.map((item: any) => ({
                id: item.id,
                productId: item.product_id,
                name: item.product_name,
                quantity: item.quantity,
                price: parseFloat(item.unit_price),
                customDescription: item.custom_description
            })) : []
        });

    } catch (error) {
        console.error('Erro ao buscar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST /api/orders - Criar novo pedido
router.post('/', optionalAuth, async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const orderData: CreateOrderDTO = req.body;

        // Validações
        if (!orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ error: 'Pedido deve conter pelo menos um item' });
        }

        if (!orderData.customer_name) {
            return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
        }

        await client.query('BEGIN');

        // Calcular posição na fila
        const queueResult = await client.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status IN ('recebido', 'preparando')
    `);
        const queuePosition = parseInt(queueResult.rows[0].count) + 1;

        // Criar pedido
        const orderId = generateOrderId();
        const orderResult = await client.query(`
      INSERT INTO orders (
        id, user_id, customer_name, status, total, 
        delivery_mode, delivery_address, delivery_fee, 
        payment_method, machine_needed, queue_position, observation
      )
      VALUES ($1, $2, $3, 'recebido', $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
            orderId,
            req.user?.userId || null,
            orderData.customer_name,
            orderData.total,
            orderData.delivery_mode || 'pickup',
            orderData.delivery_address || null,
            orderData.delivery_fee || 0,
            orderData.payment_method || null,
            orderData.machine_needed || false,
            queuePosition,
            orderData.observation || null // Observação do cliente
        ]);

        // Inserir itens do pedido
        for (const item of orderData.items) {
            await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, custom_description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.custom_description || null]);

            // Decrementar estoque
            if (item.product_id) {
                await client.query(`
          UPDATE stock SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $2
        `, [item.quantity, item.product_id]);
            }
        }

        // Adicionar ponto de fidelidade se usuário logado
        if (req.user?.userId) {
            await client.query(`
        UPDATE users SET loyalty_points = LEAST(loyalty_points + 1, 10), updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [req.user.userId]);
        }

        await client.query('COMMIT');

        const order = orderResult.rows[0];

        res.status(201).json({
            id: order.id,
            customerName: order.customer_name,
            status: order.status,
            total: parseFloat(order.total),
            deliveryMode: order.delivery_mode,
            deliveryAddress: order.delivery_address,
            deliveryFee: parseFloat(order.delivery_fee),
            paymentMethod: order.payment_method,
            queuePosition: order.queue_position,
            observation: order.observation || null,
            createdAt: order.created_at,
            items: orderData.items
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        client.release();
    }
});

// PATCH /api/orders/:id/status - Atualizar status do pedido (admin)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses: OrderStatus[] = ['recebido', 'preparando', 'pronto', 'entregue', 'cancelado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const result = await pool.query(`
      UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }

        res.json({
            id: result.rows[0].id,
            status: result.rows[0].status,
            updatedAt: result.rows[0].updated_at
        });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET /api/orders/stats/financial - Estatísticas financeiras (admin)
router.get('/stats/financial', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN total ELSE 0 END), 0) as daily,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN total ELSE 0 END), 0) as weekly,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total ELSE 0 END), 0) as monthly,
        COUNT(*) as total_orders
      FROM orders
      WHERE status != 'cancelado'
    `);

        const stats = result.rows[0];

        res.json({
            daily: parseFloat(stats.daily),
            weekly: parseFloat(stats.weekly),
            monthly: parseFloat(stats.monthly),
            totalOrders: parseInt(stats.total_orders)
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
