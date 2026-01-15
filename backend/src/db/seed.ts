import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Produtos iniciais (mesmos do frontend)
const products = [
    {
        name: 'Clássico Imperial',
        description: 'Salsicha artesanal defumada, pão brioche tostado na manteiga, cebola caramelizada no vinho tinto, mostarda Dijon e ketchup trufado.',
        price: 28.90,
        image: '/classico_imperial.webp',
        category: 'Hot Dogs',
        tags: ['Mais Vendido', 'Chef']
    },
    {
        name: 'Bacon Royale',
        description: 'Dupla de salsichas premium, bacon crocante defumado em madeira de macieira, queijo cheddar derretido e molho barbecue artesanal.',
        price: 34.90,
        image: '/bacon_royale.webp',
        category: 'Hot Dogs',
        tags: ['Premium']
    },
    {
        name: 'Vegetariano Gourmet',
        description: 'Salsicha vegetal premium, guacamole fresco, pico de gallo, sour cream e pimenta jalapeño em conserva.',
        price: 32.90,
        image: '/vegetariano_gourmet.webp',
        category: 'Hot Dogs',
        tags: ['Veggie', 'Novo']
    },
    {
        name: 'Tropicália',
        description: 'Salsicha suína com abacaxi grelhado, coentro fresco, molho teriyaki caseiro e gergelim torrado.',
        price: 31.90,
        image: '/tropicalia.webp',
        category: 'Hot Dogs',
        tags: ['Tropical']
    },
    {
        name: 'Texano Extreme',
        description: 'Três salsichas jumbo, pulled pork desfiado, coleslaw, picles artesanal e molho chipotle defumado.',
        price: 42.90,
        image: '/texano_extreme.webp',
        category: 'Hot Dogs',
        tags: ['XL', 'Favorito']
    },
    {
        name: 'Batata Rústica',
        description: 'Batatas em fatias grossas, fritas na hora com casca, temperadas com alecrim e sal marinho.',
        price: 18.90,
        image: '/batata_rustica.webp',
        category: 'Porcoes',
        tags: ['Acompanhamento']
    },
    {
        name: 'Coca-Cola Lata',
        description: 'Refrigerante Coca-Cola original em lata gelada de 350ml.',
        price: 6.00,
        image: '/coca_lata.webp',
        category: 'Bebidas',
        tags: ['Gelado']
    },
    {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola original garrafa de 2 litros.',
        price: 14.00,
        image: '/coca_2l.webp',
        category: 'Bebidas',
        tags: ['Família']
    },
    {
        name: 'Guaraná Antarctica Lata',
        description: 'Refrigerante Guaraná Antarctica em lata gelada de 350ml.',
        price: 5.50,
        image: '/guarana_lata.webp',
        category: 'Bebidas',
        tags: ['Gelado']
    },
    {
        name: 'Água Mineral 500ml',
        description: 'Água mineral sem gás, garrafa de 500ml.',
        price: 4.00,
        image: '/agua_mineral.webp',
        category: 'Bebidas',
        tags: ['Natural']
    }
];

async function seed() {
    console.log('🌱 Iniciando seed do banco de dados...\n');

    try {
        // Inserir produtos
        for (const product of products) {
            const result = await pool.query(`
        INSERT INTO products (name, description, price, image, category, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [product.name, product.description, product.price, product.image, product.category, product.tags]);

            if (result.rows[0]) {
                // Criar estoque inicial
                await pool.query(`
          INSERT INTO stock (product_id, quantity)
          VALUES ($1, 50)
          ON CONFLICT (product_id) DO NOTHING;
        `, [result.rows[0].id]);
                console.log(`✅ Produto inserido: ${product.name}`);
            }
        }

        // Criar usuário admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        await pool.query(`
      INSERT INTO users (name, email, password_hash, is_admin, loyalty_points)
      VALUES ('Administrador', 'admin@chapaquente.com', $1, TRUE, 0)
      ON CONFLICT (email) DO NOTHING;
    `, [adminPassword]);
        console.log('✅ Usuário admin criado (admin@chapaquente.com / admin123)');

        console.log('\n🎉 Seed concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
