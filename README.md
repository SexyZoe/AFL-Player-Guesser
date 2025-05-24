# AFL-Player-Guesser
AFL player guessing game with solo and multiplayer modes

# AFL Guess Who 🎯

**AFL Guess Who** is an interactive web-based guessing game based on Australian Football League (AFL) players from the 2024–25 season. Players are challenged to guess a mystery player using a series of progressively revealed hints.

---

## 🎮 Game Modes

- **🎯 Solo Mode**: Try to guess the mystery AFL player in as few attempts as possible.
- **⚔️ 1v1 Random Match**: Match with a random player online and race to guess correctly.
- **👥 Private Room Multiplayer**: Invite friends and play together in a shared room using a code.

---

## 🔧 Tech Stack

| Layer       | Technology                            |
|-------------|----------------------------------------|
| Frontend    | React, TypeScript, Tailwind CSS        |
| Backend     | Node.js, Express.js, Socket.IO         |
| Database    | MongoDB (via MongoDB Atlas)            |
| Deployment  | Vercel (frontend), Render (backend)    |
| Realtime    | WebSockets (via Socket.IO)             |
| Automation  | GitHub Actions (for data updates)      |

---

## 🗂 Project Structure

afl-guess-game/
├── client/ # React frontend
├── server/ # Express backend
│ ├── index.js # Main backend entry point
│ ├── data/ # Player data JSON
│ └── scraper/ # One-time + auto-update scraper
├── .github/workflows/ # GitHub Actions automation
└── README.md

yaml


---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/afl-guess-game.git
cd afl-guess-game
2. Install Frontend
bash

cd client
npm install
npm start
3. Install Backend
bash

cd ../server
npm install
node index.js
🔐 Make sure to create a .env file if using MongoDB:

ini

MONGODB_URI=your_mongodb_connection_string
🔄 Player Data: One-Time Scraping + Weekly Auto-Update
This project uses official AFL player data as the basis for all game logic.

✅ A one-time web scraper (scrapePlayers.js) fetches AFL player data from the AFL official site.

✅ The data is saved to server/data/players.json.

✅ The backend loads this JSON at runtime — no remote calls, fast and stable.

Why This Approach?
Benefit	Description
🔄 Controlled updates	Avoids scraper breakage due to layout changes
⚡ Speed	No live fetching — all local reads
💡 Maintainability	Easy to re-run scraper when needed
🛡 No IP bans	Low-frequency scrape, safe from rate limits

🔧 GitHub Actions: Weekly Auto-Update
This repo includes a GitHub Actions workflow that:

Runs every Monday at 2:00 AM UTC

Executes the scrapePlayers.js script

Commits the updated players.json to the repo

📁 Workflow file: .github/workflows/scrape.yml

You can also trigger it manually from the GitHub Actions tab.

Want to refresh manually? Just run:

bash

cd server
node scraper/scrapePlayers.js
📌 TODO Features
 Hint-based filtering (age, team, position, etc.)

 Responsive UI for mobile players

 User authentication + high score tracking

 Leaderboard and statistics

 Add player photos and bios

🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss the proposal.

📄 License
This project is licensed under the MIT License.