# Speed Bug-Fix Arena — MVP

The ultimate competition platform for React & Next.js developers.

## 🚀 Features

- **Sandboxed Evaluation**: All solutions are evaluated inside isolated Docker containers with resource limits (512MB RAM, 1 CPU) and no network access.
- **ZIP Submissions**: Developers work locally, upload their fix as a ZIP, and get results instantly.
- **Real-time Leaderboard**: Rankings update live via WebSockets (Socket.io) as solutions are accepted.
- **Automated Scoring**: Scores are calculated based on test passes, time taken, and attempt penalties.

## 🏗 Architecture

User → Next.js (Frontend) → NestJS (API) → BullMQ (Job Queue) → Worker → Docker (Runner)
Database: PostgreSQL
Cache/Queue: Redis
Real-time: Socket.io

## 🛠 Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Running the Application

1. **Clone and Enter**
   ```bash
   cd /Users/devsloop/.gemini/antigravity/scratch/bugfix-arena
   ```

2. **Start Services**
   ```bash
   docker-compose up --build -d
   ```

3. **Explore**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001
   - **PostgreSQL**: localhost:5432
   - **Redis**: localhost:6379

### Default Challenge
A sample challenge "Fix the Broken useCounter Hook" is pre-seeded. 
- **ID**: `c0ffee00-1234-5678-9abc-def012345678`
- **Link**: http://localhost:3000/challenge/c0ffee00-1234-5678-9abc-def012345678

## 🛡 Security Note
The evaluation worker uses `docker run --network none` to ensure that user-submitted code cannot access the internet during testing. Memory and CPU limits are strictly enforced.

## 🏆 Leaderboard Rules
1. Only **ACCEPTED** submissions (all tests passed) are ranked.
2. Best score per user per challenge is used.
3. Tie-breakers: Lowest time taken → Lowest attempt count.
