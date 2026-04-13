# Strava Running Performance Dashboard

Dashboard para análise de performance de corrida usando a API do Strava.

**Stack:** Node.js + Fastify + TypeScript (backend) | Vite + React + TypeScript + Recharts (frontend)

---

## Pré-requisitos

- Node.js 18+
- Uma conta no Strava e um app criado em [strava.com/settings/api](https://www.strava.com/settings/api)

## Configuração do App no Strava

1. Acesse [strava.com/settings/api](https://www.strava.com/settings/api)
2. Crie ou selecione seu app
3. Configure **Authorization Callback Domain** como `localhost`
4. Anote o **Client ID** e o **Client Secret**

---

## Instalação

### Backend

```bash
cd server
npm install
```

Crie o arquivo `.env` em `server/`:

```env
STRAVA_CLIENT_ID=seu_client_id
STRAVA_CLIENT_SECRET=seu_client_secret
REDIRECT_URI=http://localhost:3001/auth/callback
PORT=3001
```

Inicie o servidor:

```bash
npm run dev
```

### Frontend (Fase 3)

```bash
cd client
npm install
npm run dev
```

---

## Fase 1 — Autenticação OAuth2

Com o servidor rodando em `http://localhost:3001`:

### 1. Iniciar autenticação

Abra no navegador:
```
http://localhost:3001/auth/strava
```

Você será redirecionado para o Strava para autorizar o app. Após autorizar, o Strava redireciona de volta para `/auth/callback`, que salva os tokens em `server/tokens.json` automaticamente.

### 2. Verificar status

```bash
curl http://localhost:3001/auth/status
```

Resposta de exemplo:
```json
{
  "authenticated": true,
  "athlete_id": 12345678,
  "expires_in_seconds": 18234,
  "expired": false
}
```

### 3. Health check

```bash
curl http://localhost:3001/health
```

---

## Rotas disponíveis

| Método | Rota              | Descrição                                      |
|--------|-------------------|------------------------------------------------|
| GET    | `/health`         | Health check do servidor                       |
| GET    | `/auth/strava`    | Inicia fluxo OAuth2 (redireciona ao Strava)    |
| GET    | `/auth/callback`  | Callback OAuth2 — troca code por access_token  |
| GET    | `/auth/status`    | Verifica se o usuário está autenticado         |

---

## Renovação de token

O token é renovado automaticamente quando expirar. O serviço `tokenService.ts` verifica a expiração com 5 minutos de antecedência antes de cada chamada à API do Strava.
