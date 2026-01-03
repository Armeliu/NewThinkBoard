# QuizDuel

QuizDuel is a beginner-friendly MERN monorepo for a real-time two-player quiz battle. It includes local MongoDB storage, server-authoritative Socket.IO matches, and optional local AI essay judging via Ollama. All question sources are free/open (curated local JSON + Wikidata/Wikipedia; OpenTDB optional).

## What it does (scaffold stage)

- Register/login with username + password.
- Create or join a room with a room code.
- Ready up and play a 10-question match (7 MCQ + 3 essay).
- Server-authoritative timers, scoring, and match results stored in MongoDB.

## Architecture overview

- React client (Vite) handles UI and renders server-driven state.
- Express API + Socket.IO server owns match state and timers.
- MongoDB stores users, rooms, match snapshots, submissions, and results.
- Optional Ollama judge runs locally; essays are marked `PENDING_AI` if unavailable.

See `/docs/architecture.md` for diagrams and details.

## Local setup

### Prerequisites

- Node.js 18+
- MongoDB running locally at `mongodb://127.0.0.1:27017`
- (Optional) Ollama installed and running at `http://localhost:11434`

### Environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

To enable local AI judging with Ollama, set `AI_JUDGE=ollama` in `server/.env` and ensure Ollama is running on `http://localhost:11434`.

### Install dependencies

```bash
npm install
```

## Scripts

```bash
npm run dev       # run client + server together
npm run lint      # lint all workspaces
npm run test      # run tests
npm run seed      # seed curated questions
```

## Run in development

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:4000

## Run tests

```bash
npm test
```

## Real-time sync

- Server emits `question:start` with server timestamps.
- Clients display timers based on `serverStartTs`.
- Server accepts submissions until timeout or both players submit.
- `question:result` is emitted only after lock to reveal answers and scores.

## Wikidata questions + citations

- The Wikidata provider runs deterministic SPARQL queries.
- It fetches Wikipedia summaries for evidence snippets.
- Only citation URL + short snippet are stored.

## Extending question providers

Implement the `QuestionProvider` interface under `server/src/features/questions/providers` and register it in `questionService.js`.

## Windows PowerShell tips

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm install
npm run dev
```
