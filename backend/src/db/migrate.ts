import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
    console.log('🔄 Iniciando migração do banco de dados...\n');

    try {
        // Criar tabela de usuários
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        loyalty_points INTEGER DEFAULT 0,
        loyalty_started_at TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela users criada');

        // Criar tabela de produtos
        await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image TEXT,
        category VARCHAR(50) NOT NULL,
        tags TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela products criada');

        // Criar tabela de estoque
        await pool.query(`
      CREATE TABLE IF NOT EXISTS stock (
        product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela stock criada');

        // Criar tabela de pedidos
        await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(20) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        customer_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'recebido',
        total DECIMAL(10,2) NOT NULL,
        delivery_mode VARCHAR(20) DEFAULT 'pickup',
        delivery_address TEXT,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        machine_needed BOOLEAN DEFAULT FALSE,
        queue_position INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabela orders criada');

        // Criar tabela de itens do pedido
        await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        custom_description TEXT
      );
    `);
        console.log('✅ Tabela order_items criada');

        // Criar índices para performance
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    `);
        console.log('✅ Índices criados');

        console.log('\n🎉 Migração concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
