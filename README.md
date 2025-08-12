## AFL Guess Who 🎯

An AFL player guessing game based on the 2024–25 season. Supports solo play and multiplayer (random 1v1 and private rooms).

---

## 🎮 Game Modes

- **Solo**: Play locally by yourself.
- **1v1 Random Match**: Online matchmaking with per-round max 8 guesses. Supports series BO3/BO5/BO7. A display name is required before queueing (socket.id is not allowed).
- **Private Room**: Play with friends via a room code. Supports series and live status updates.

---

## 🔧 Tech Stack

- Frontend: React + TypeScript + Tailwind (Webpack Dev Server)
- Backend: Node.js + Express + Socket.IO
- Data: Local `server/data/players.json` (default); MongoDB optional
- Deployment: Railway (`railway.json`, see `docs/RAILWAY_DEPLOYMENT.md`)

---

## 🗂 Project Structure

```
afl-guess-game/
├── client/                      # React frontend
├── server/                      # Express backend
│   ├── index.js
│   ├── data/players.json        # Runtime data source (default)
│   └── scripts/                 # Maintenance scripts (import/verify/update images)
├── docs/                        # Guides (images / Railway deployment)
├── railway.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install
```bash
npm run install:all
```

### Start (development)
```bash
npm start
# Frontend: http://localhost:3000
# Backend:  http://localhost:3002
```

Frontend dev server proxies `/api`, `/socket.io`, and `/images` to `http://localhost:3002` (see `client/webpack.config.js`).

### Build frontend
```bash
npm run build
```

### Backend only (dev)
```bash
npm run start:dev
```

---

## 📦 Data Source

- Default: the server loads players directly from `server/data/players.json` — no DB required.
- Optional MongoDB: if you prefer DB storage/import, set `MONGODB_URI` in `server/.env`, then run:
```bash
npm run import
```

---

## 🔌 API & Static Assets

- `GET /api/players` — all players
- `GET /api/random-player` — a random player
- Static images: `/images/players/<Team>/*.webp`

Image paths are pre-written in `server/data/players.json`. For maintenance, see `docs/PLAYER_IMAGES_GUIDE.md`.

---

## ⚔️ Random Match Workflow

- Client must set a display name before joining the queue; the server rejects empty names or `socket.id`.
- After `matchFound`, both clients send an ACK. The server starts the game only after receiving both ACKs and then emits `battleStatusUpdate`.
- Series supports BO3/BO5/BO7; each round has a max of 8 guesses.

---

## 🚀 Deployment (Railway)

The project is built and started using `railway.json`. See `docs/RAILWAY_DEPLOYMENT.md` for details.

---

## 🖼 Image Maintenance

Useful scripts (run from repo root):
```bash
npm run list-players
npm run update-images
npm run update-images-by-name
npm run update-images-by-number
npm run verify-images
```
Images live in `server/public/images/players/<Team>/`. See `docs/PLAYER_IMAGES_GUIDE.md` for best practices.

---

## ℹ️ Notes

- On the error screen, the Restart button calls `resetGame` and then forces a page reload to avoid stale state.
- For entertainment purposes only.

---

## License

MIT