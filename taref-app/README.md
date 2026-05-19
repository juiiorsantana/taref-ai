# Taref.ai

Plataforma de gerenciamento de tarefas e projetos com controle de acesso por roles, portal do cliente e quadro Kanban. Desenvolvida com React + TypeScript no frontend e Supabase no backend.

## Funcionalidades

- Autenticação via Supabase Auth
- Sistema de roles: `super_admin`, `admin`, `user`
- Convites por e-mail para novos usuários
- Quadro Kanban com arrastar e soltar
- Portal do cliente com visão limitada de projetos
- Tema claro/escuro
- Gerenciamento de usuários e permissões pelo admin

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite |
| Backend | Supabase (PostgreSQL + Auth) |
| Edge Functions | Deno (Supabase Functions) |
| Testes | Vitest + Testing Library |
| Ícones | Lucide React |

## Estrutura

```
taref-app/
├── src/
│   ├── components/
│   │   ├── admin/        # Gerenciamento de usuários e permissões
│   │   ├── auth/         # Login, criação de admin, aceite de convite
│   │   ├── dashboard/    # Portal do cliente, cards de projeto
│   │   ├── kanban/       # Quadro Kanban
│   │   ├── layout/       # Header, sidebar, status de conexão
│   │   ├── tasks/        # Lista de tarefas
│   │   └── ui/           # Componentes base (Button, Modal, Toast...)
│   ├── context/          # AuthContext, ProjectContext, ThemeContext
│   ├── hooks/            # useLocalStorage
│   ├── services/         # api.ts — chamadas ao Supabase
│   ├── types/            # Tipos TypeScript e tipos gerados do DB
│   └── utils/            # supabaseClient, backup, date
└── supabase/
    ├── functions/        # Edge Functions (convites, roles, admin)
    └── migrations/       # Migrations SQL com RLS
```

## Primeiros passos

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Configuração

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env.local` na raiz de `taref-app/` com as variáveis do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<sua-chave-anonima>
```

3. Aplique as migrations no Supabase (via dashboard SQL editor ou CLI):

```
supabase/migrations/001_role_system.sql
supabase/migrations/002_fix_rls_recursion.sql
```

4. Faça o deploy das Edge Functions:

```bash
supabase functions deploy create-admin
supabase functions deploy create-invitation
supabase functions deploy accept-invitation
supabase functions deploy manage-roles
```

### Comandos

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Lint com ESLint
npm run test         # Testes em modo watch
npm run test:run     # Testes uma única vez
npm run test:coverage # Cobertura de testes
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
