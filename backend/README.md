# 🔥 Chapa Quente - Backend API

Backend Node.js/Express com PostgreSQL para a aplicação Chapa Quente Dog Lanches.

## 🚀 Tecnologias

- **Node.js** + **Express** - Servidor HTTP
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas

## 📁 Estrutura

```
backend/
├── src/
│   ├── db/
│   │   ├── migrate.ts    # Criação das tabelas
│   │   └── seed.ts       # Dados iniciais
│   ├── middleware/
│   │   └── auth.ts       # Autenticação JWT
│   ├── routes/
│   │   ├── auth.ts       # Login/Registro
│   │   ├── orders.ts     # Pedidos
│   │   ├── products.ts   # Cardápio
│   │   ├── stock.ts      # Estoque
│   │   └── users.ts      # Usuários
│   ├── server.ts         # Entrada principal
│   └── types.ts          # Tipos TypeScript
├── .env.example          # Variáveis de ambiente
├── package.json
├── render.yaml           # Config Render
└── tsconfig.json
```

## 🛠️ Desenvolvimento Local

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Configurar ambiente
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Rodar migrações (criar tabelas)
```bash
npm run db:migrate
```

### 4. Popular banco com dados iniciais
```bash
npm run db:seed
```

### 5. Iniciar servidor de desenvolvimento
```bash
npm run dev
```

Servidor rodando em: `http://localhost:3001`

---

## ☁️ Deploy na Render (Plano Free)

### Passo 1: Criar conta na Render
Acesse [render.com](https://render.com) e crie uma conta (pode usar GitHub).

### Passo 2: Criar Database PostgreSQL

1. No dashboard, clique em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `chapaquente-db`
   - **Database:** `chapaquente`
   - **User:** `chapaquente`
   - **Region:** Oregon (US West)
   - **Plan:** **Free**
3. Clique em **"Create Database"**
4. Aguarde criar e copie a **Internal Database URL**

### Passo 3: Criar Web Service

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name:** `chapaquente-api`
   - **Region:** Oregon (mesma do banco)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** **Free**

### Passo 4: Configurar Variáveis de Ambiente

Em **"Environment"**, adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (Cole a Internal Database URL) |
| `JWT_SECRET` | (Gere uma string aleatória longa) |
| `FRONTEND_URL` | (URL do seu frontend, ex: `https://seuapp.vercel.app`) |

### Passo 5: Deploy!

1. Clique em **"Create Web Service"**
2. Aguarde o build (5-10 min na primeira vez)
3. Acesse a URL fornecida (ex: `https://chapaquente-api.onrender.com`)

### Passo 6: Rodar Migrações

No shell da Render (ou via SSH):
```bash
npm run db:migrate
npm run db:seed
```

Ou use o **Console** no dashboard da Render.

---

## 📡 Endpoints da API

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastrar usuário |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/guest` | Entrar como visitante |

### Products
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/products` | Listar cardápio |
| GET | `/api/products/:id` | Detalhes do produto |
| POST | `/api/products` | Criar produto (admin) |
| PUT | `/api/products/:id` | Atualizar produto (admin) |
| DELETE | `/api/products/:id` | Remover produto (admin) |

### Orders
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/orders` | Listar pedidos |
| GET | `/api/orders/:id` | Detalhes do pedido |
| POST | `/api/orders` | Criar pedido |
| PATCH | `/api/orders/:id/status` | Atualizar status (admin) |
| GET | `/api/orders/stats/financial` | Estatísticas (admin) |

### Stock
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/stock` | Listar estoque |
| PUT | `/api/stock/:productId` | Atualizar estoque (admin) |
| POST | `/api/stock/batch` | Atualização em lote (admin) |
| GET | `/api/stock/alerts/low` | Alertas estoque baixo (admin) |

### Users
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/users/me` | Dados do usuário logado |
| PUT | `/api/users/me` | Atualizar perfil |
| POST | `/api/users/loyalty/redeem` | Resgatar prêmio |
| GET | `/api/users` | Listar usuários (admin) |

---

## 🔑 Autenticação

As rotas protegidas requerem header:
```
Authorization: Bearer <token>
```

O token é retornado no login/registro.

---

## 👤 Usuário Admin Padrão

Após rodar o seed:
- **Email:** `admin@chapaquente.com`
- **Senha:** `admin123`

⚠️ **Troque a senha em produção!**

---

## 🆓 Limitações do Plano Free da Render

- **Banco PostgreSQL:** 256MB de armazenamento
- **Web Service:** Dorme após 15 min de inatividade
  - Primeira requisição após sleep demora ~30s
  - Para uso em produção, considere planos pagos

---

## 📝 Licença

MIT © Chapa Quente Dog Lanches
