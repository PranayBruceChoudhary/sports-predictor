# 🏈 Calling The Lock - Sports Predictor Platform

**Calling The Lock** is a full-stack Next.js web application designed for NFL sports enthusiasts to explore team rosters, view live player and team statistics, and participate in a competitive multi-user prediction league ("Hot-Seat Prediction League").

Powered by **Next.js 16**, **React 19**, **Tailwind CSS v4**, **Supabase**, and real-time NFL data from **Tank01 RapidAPI**, this platform bridges live sports analytics with interactive user gaming.

---

## 🌟 Key Features

### 1. 🏠 Landing & Welcome Portal (`/`)
- Sleek hero section introducing *Calling The Lock*.
- Visual sports emoji banners with responsive design.
- Entry point for user authentication and onboarding.

### 2. 🏆 Hot-Seat Prediction League (`/league`)
- **Multi-Player Hot-Seat Mode**: Supports 4 distinct player profiles (`Player 1` through `Player 4`) in a local pass-and-play format.
- **Player Leader Predictions**: Real-time searchable dropdown component allowing users to predict statistical leaders in:
  - 🏈 Passing Yards
  - 🏃 Rushing Yards
  - 👐 Receiving Yards
  - ⚡ Touchdowns
- **Team Leader Predictions**: Predict top-performing teams for:
  - 🎯 Points Scored
  - 🛡️ Points Allowed
  - 💥 Sacks
  - 🔄 Turnovers Forced
- **Game Matchup Predictions**: Interactive pick buttons for weekly game matchups featuring official ESPN team logo badges.
- **Persistence**: Instant saving and upserting of picks to Supabase database tables per user.

### 3. 🛡️ NFL Teams & Roster Explorer (`/teams`)
- **32-Team Interactive Grid**: High-resolution team logo cards powered by ESPN's CDN.
- **Team Detail Header**: Conference, division, and team identity preview.
- **Split Roster Analytics**:
  - **Offense & Special Teams Table**: Aggregated passing yards, passing TDs, rushing yards, receiving yards, and total touchdowns. Automatically sorted by total yards.
  - **Defense Table**: Total tackles, sacks, interceptions, and forced fumbles. Automatically sorted by defensive tackles and sacks.

### 4. ⚡ Automated Data Pipeline & Seed Routes (`/api/`)
Serverless Next.js API routes that connect directly to Tank01 RapidAPI to harvest real-time NFL data and sync it into Supabase:
- `GET /api/setup-teams`: Fetches and upserts all 32 NFL teams.
- `GET /api/setup-players`: Traverses nested team rosters to upsert active NFL players into the database.
- `GET /api/setup-week-7`: Pulls historical/live game schedules, team weekly stats, and player box scores for Week 7, processing offensive and defensive metrics into relational database tables.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/auth-ui-react`) |
| **Sports Data API** | [Tank01 NFL Live In-Game Real-Time Statistics API](https://rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl) (via RapidAPI) |
| **Assets & Media** | [ESPN CDN Team Logos](https://a.espncdn.com) |

---

## 📁 Project Architecture & File Structure

```
sports-predictor/
├── app/
│   ├── api/
│   │   ├── setup-players/
│   │   │   └── route.ts         # Ingests & formats player rosters into Supabase
│   │   ├── setup-teams/
│   │   │   └── route.ts         # Ingests 32 NFL teams into Supabase
│   │   └── setup-week-7/
│   │       └── route.ts         # Ingests Week 7 schedule, box scores, & player stats
│   ├── league/
│   │   └── page.tsx             # Hot-Seat Prediction League UI & logic
│   ├── teams/
│   │   └── page.tsx             # 32-Team Roster & Player Stats Explorer UI
│   ├── globals.css              # Global styles & Tailwind CSS v4 setup
│   ├── layout.tsx               # Root application layout & font configurations
│   └── page.tsx                 # Main landing page UI
├── utils/
│   ├── nflApi.ts                # RapidAPI fetch helpers (teams, rosters, schedules, box scores)
│   └── supabase.ts             # Supabase client instantiation
├── public/                      # Static assets
├── .env.local                   # Environment credentials (Supabase & RapidAPI keys)
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript configuration
```

---

## 🗄️ Database Schema Overview (Supabase)

The database utilizes relational tables to link teams, players, statistics, and user predictions:

### Core Data Tables
- **`teams`**: `team_abv` (PK), `city`, `team_name`, `conference`, `division`
- **`players`**: `player_id` (PK), `name`, `position`, `team_abv`
- **`weekly_schedule`**: `game_id` (PK), `week_number`, `home_team`, `away_team`, `home_score`, `away_score`, `game_status`
- **`team_weekly_stats`**: `stat_id` (PK), `team_abv`, `week_number`, `points_scored`, `points_allowed`, `sacks`, `turnovers_forced`
- **`player_weekly_stats`**: `stat_id` (PK), `player_id`, `week_number`, `player_name`, `position`, `passing_yards`, `rushing_yards`, `receiving_yards`, `touchdowns_scored`, `touchdowns_thrown`, `tackles`, `interceptions`, `sacks`, `forced_fumbles`

### Prediction Tables
- **`predictions_player`**: `prediction_id` (PK), `user_id`, `category`, `player_id`
- **`predictions_team`**: `prediction_id` (PK), `user_id`, `category`, `team_abv`
- **`predictions_game`**: `prediction_id` (PK), `user_id`, `game_id`, `predicted_winner`

---

## 🔑 Environment Variables Configuration

Create or verify `.env.local` in the project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
RAPIDAPI_KEY=<your-rapidapi-key>
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or higher recommended)
- `npm` or `pnpm` or `yarn`

### 2. Installation
Clone the repository and install the dependencies:

```bash
cd sports-predictor
npm install
```

### 3. Database Initialization (Seeding)
To populate your Supabase database with teams, rosters, and game data, start the dev server and hit the setup API endpoints sequentially in your browser:

1. **Setup Teams**: Navigate to `http://localhost:3000/api/setup-teams`
2. **Setup Players**: Navigate to `http://localhost:3000/api/setup-players`
3. **Setup Week 7 Data**: Navigate to `http://localhost:3000/api/setup-week-7`

### 4. Running Development Server
Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Visit `/` for the main landing page.
- Visit `/league` to test the Prediction League.
- Visit `/teams` to browse NFL Teams and Rosters.

---

## 📜 Available Scripts

- `npm run dev` - Starts the Next.js development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the Next.js production server.
- `npm run lint` - Runs ESLint code quality checks.
