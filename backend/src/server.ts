import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { runAutoMigrations } from './db/autoMigrate';

// Routes
import authRoutes from './routes/auth';
import ordersRoutes from './routes/orders';
import productsRoutes from './routes/products';
import stockRoutes from './routes/stock';
import usersRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middlewares
// Configuração CORS flexível
const allowedOrigins = [
    process.env.FRONTEND_URL?.replace(/\/$/, ''), // Remove trailing slash
    'https://chapaquente-nonj.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permite requests sem origin (Postman, curl, etc)
        if (!origin) return callback(null, true);

        // Remove trailing slash do origin
        const cleanOrigin = origin.replace(/\/$/, '');

        if (allowedOrigins.includes(cleanOrigin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Temporariamente permite todos para debug
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Chapa Quente API'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server with auto-migrations
async function startServer() {
    try {
        // Rodar migrações automaticamente no startup
        await runAutoMigrations(pool);

        app.listen(PORT, () => {
            console.log(`🔥 Chapa Quente API rodando na porta ${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

export default app;

