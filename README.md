# ChromaVault 🎨 — Color Memory Game on GenLayer

A multiplayer color memory game powered by GenLayer AI on-chain.
Players memorize colors and recreate them using HSB sliders. XP distributed trustlessly on-chain.

---

## How It Works

1. **AI generates 7 colors** weekly via an on-chain LLM call (GenLayer)
2. Players join a **room** (up to 6)
3. Each round: **memorize** a color → use **HSB sliders** to recreate it → get a score
4. After 7 rounds (~10 min), scores are **submitted on-chain**
5. **XP distributed** transparently via the smart contract
6. **Global leaderboard** stored on GenLayer

---

## Setup

### 1. Deploy the Contract

1. Go to [studio.genlayer.com](https://studio.genlayer.com)
2. Create a new contract and paste the contents of `contracts/color_memory_game.py`
3. Deploy it on **studionet**
4. Copy the deployed **contract address**

### 2. Configure the Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env and set your contract address:
# VITE_CONTRACT_ADDRESS=0xYourAddressHere
```

### 3. Install & Run

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Playing the Game

1. **Connect MetaMask** (make sure it's on studionet)
2. **Generate weekly colors** (first player to do it this week)
3. **Create or join a room** with a 6-character code
4. Host clicks **Start Game**
5. 7 rounds of memorize → recall → reveal
6. **Submit score** → wait for all players → see leaderboard + XP

---

## Game Criteria

| Criterion | How It's Met |
|---|---|
| Multiplayer / rooms | On-chain room management (up to 6 players) |
| 5-15 minutes | 7 rounds × ~90s = ~10 minutes |
| Weekly replayable | AI-generated new colors each week, 1 play per wallet per week |
| Leaderboard + XP | On-chain XP distribution: 🥇150 🥈100 🥉70 + 20 participation |

---

## GenLayer Contract Features

- `generate_weekly_colors()` — LLM generates 7 themed colors each week
- `create_room(id)` / `join_room(id)` — trustless room management
- `start_game(id)` — host starts, recorded on-chain
- `submit_scores(id, score)` — score submitted, XP auto-distributed when all submit
- `get_leaderboard_top10()` — global rankings on-chain

---

## Tech Stack

- **Smart Contract**: Python (GenLayer Intelligent Contract)
- **Frontend**: React + Vite + TailwindCSS
- **Blockchain SDK**: genlayer-js (studionet)
- **Wallet**: MetaMask
