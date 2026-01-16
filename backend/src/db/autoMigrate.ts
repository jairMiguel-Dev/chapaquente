import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Função para rodar migrações automaticamente no startup
export async function runAutoMigrations(pool: Pool): Promise<void> {
  console.log('🔄 Verificando banco de dados...\n');

  try {
    // Verificar se as tabelas já existem
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (tablesExist.rows[0].exists) {
      console.log('✅ Banco de dados já configurado, verificando atualizações...\n');

      // Adicionar coluna observation se não existir
      try {
        await pool.query(`
                    ALTER TABLE orders ADD COLUMN IF NOT EXISTS observation TEXT;
                `);
        console.log('✅ Coluna observation verificada/adicionada');
      } catch (e) {
        // Coluna já existe, ignora
      }

      return;
    }

    console.log('📦 Criando tabelas...\n');

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
        observation TEXT,
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

    // Criar índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    `);
    console.log('✅ Índices criados');

    // ========== SEED: Inserir dados iniciais ==========
    console.log('\n🌱 Inserindo dados iniciais...\n');

    // Produtos
    const products = [
      { name: 'Clássico Imperial', description: 'Salsicha artesanal defumada, pão brioche tostado na manteiga, cebola caramelizada no vinho tinto, mostarda Dijon e ketchup trufado.', price: 28.90, image: '/classico_imperial.webp', category: 'Hot Dogs', tags: ['Mais Vendido', 'Chef'] },
      { name: 'Bacon Royale', description: 'Dupla de salsichas premium, bacon crocante defumado em madeira de macieira, queijo cheddar derretido e molho barbecue artesanal.', price: 34.90, image: '/bacon_royale.webp', category: 'Hot Dogs', tags: ['Premium'] },
      { name: 'Vegetariano Gourmet', description: 'Salsicha vegetal premium, guacamole fresco, pico de gallo, sour cream e pimenta jalapeño em conserva.', price: 32.90, image: '/vegetariano_gourmet.webp', category: 'Hot Dogs', tags: ['Veggie', 'Novo'] },
      { name: 'Tropicália', description: 'Salsicha suína com abacaxi grelhado, coentro fresco, molho teriyaki caseiro e gergelim torrado.', price: 31.90, image: '/tropicalia.webp', category: 'Hot Dogs', tags: ['Tropical'] },
      { name: 'Texano Extreme', description: 'Três salsichas jumbo, pulled pork desfiado, coleslaw, picles artesanal e molho chipotle defumado.', price: 42.90, image: '/texano_extreme.webp', category: 'Hot Dogs', tags: ['XL', 'Favorito'] },
      { name: 'Batata Rústica', description: 'Batatas em fatias grossas, fritas na hora com casca, temperadas com alecrim e sal marinho.', price: 18.90, image: '/batata_rustica.webp', category: 'Porcoes', tags: ['Acompanhamento'] },
      { name: 'Coca-Cola Lata', description: 'Refrigerante Coca-Cola original em lata gelada de 350ml.', price: 6.00, image: '/coca_lata.webp', category: 'Bebidas', tags: ['Gelado'] },
      { name: 'Coca-Cola 2L', description: 'Refrigerante Coca-Cola original garrafa de 2 litros.', price: 14.00, image: '/coca_2l.webp', category: 'Bebidas', tags: ['Família'] },
      { name: 'Guaraná Antarctica Lata', description: 'Refrigerante Guaraná Antarctica em lata gelada de 350ml.', price: 5.50, image: '/guarana_lata.webp', category: 'Bebidas', tags: ['Gelado'] },
      { name: 'Água Mineral 500ml', description: 'Água mineral sem gás, garrafa de 500ml.', price: 4.00, image: '/agua_mineral.webp', category: 'Bebidas', tags: ['Natural'] }
    ];

    for (const product of products) {
      const result = await pool.query(`
        INSERT INTO products (name, description, price, image, category, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [product.name, product.description, product.price, product.image, product.category, product.tags]);

      if (result.rows[0]) {
        await pool.query(`
          INSERT INTO stock (product_id, quantity)
          VALUES ($1, 50)
          ON CONFLICT (product_id) DO NOTHING;
        `, [result.rows[0].id]);
        console.log(`✅ Produto: ${product.name}`);
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

    console.log('\n🎉 Banco de dados configurado com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro na configuração do banco:', error);
    // Não lança erro para não derrubar o servidor
  }
}
