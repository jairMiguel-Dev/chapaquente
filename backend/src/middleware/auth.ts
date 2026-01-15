import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'chapa-quente-secret-key';

// Middleware de autenticação obrigatória
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

// Middleware de autenticação opcional (não bloqueia, apenas decodifica se existir)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return next();
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = decoded;
    } catch (error) {
        // Token inválido, mas continua sem autenticação
    }

    next();
};

// Middleware de admin
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    next();
};

// Gerar token JWT
export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
