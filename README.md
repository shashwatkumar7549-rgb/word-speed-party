# Word Speed Party

A real-time 2–6 player browser party game.

## Run locally
1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000` on each device on the same network (or deploy to a Node/WebSocket host).
6. Create a room, share the 4-character code, and start with 2–6 players.

## Rules implemented
- 5 rounds × 10 questions = 50 questions.
- 20-second timer per question.
- Correct answers: 100 (0–2s), 80 (2–4s), 60 (4–6s), 40 (6–8s), 20 (8–20s).
- Incorrect/timeout: 0.
- Case-insensitive answer matching with accepted alternatives.
- Round leaderboards and final leaderboard.
- General-knowledge questions are selected dynamically server-side from a question pool and can be replaced with an AI generation provider later.

## Production note
For public internet play, deploy the Node server with WebSocket support. The current question generator is intentionally provider-free so the prototype works without an API key. A future version can swap `generateQuestion()` for an LLM-backed generator with server-side answer validation.
