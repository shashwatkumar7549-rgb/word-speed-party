import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import { generateQuestion } from "./questionGenerator.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const rooms = new Map();

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const ROUNDS = 5;
const QUESTIONS_PER_ROUND = 10;
const QUESTION_MS = 20000;
const REVEAL_MS = 1800;
const ROUND_RESULTS_MS = 3500;

function roomCode() {
  let code;
  do code = Math.random().toString(36).slice(2, 6).toUpperCase();
  while (rooms.has(code));
  return code;
}

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcast(room, data) {
  for (const p of room.players.values()) send(p.ws, data);
}

function publicPlayers(room) {
  return [...room.players.values()].map(p => ({
    id: p.id, name: p.name, score: p.score, correct: p.correct,
    answered: !!p.answer, totalTime: p.totalTime
  }));
}

function clearRoomTimer(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
}

function startQuestion(room) {
  clearRoomTimer(room);
  room.questionIndex++;
  room.currentQuestion = generateQuestion(room.usedQuestions);
  room.usedQuestions.add(room.currentQuestion.id);
  room.questionStartedAt = Date.now();
  for (const p of room.players.values()) p.answer = null;

  broadcast(room, {
    type: "question",
    round: room.round,
    questionNumber: room.questionIndex + 1,
    totalQuestions: ROUNDS * QUESTIONS_PER_ROUND,
    question: room.currentQuestion.prompt,
    options: room.currentQuestion.options || null,
    timeLimitMs: QUESTION_MS
  });

  room.timer = setTimeout(() => finishQuestion(room), QUESTION_MS + 100);
}

function calculatePoints(ms) {
  const sec = ms / 1000;
  if (sec <= 2) return 100;
  if (sec <= 4) return 80;
  if (sec <= 6) return 60;
  if (sec <= 8) return 40;
  if (sec <= 20) return 20;
  return 0;
}

function finishQuestion(room) {
  if (!rooms.has(room.code)) return;
  clearRoomTimer(room);

  for (const p of room.players.values()) {
    if (p.answer && !p.answer.finished) {
      p.answer.finished = true;
      // Score is awarded at submission time; this only finalizes the answer.
    }
  }

  broadcast(room, {
    type: "reveal",
    correctAnswer: room.currentQuestion.answer,
    players: publicPlayers(room)
  });

  const isRoundEnd = (room.questionIndex + 1) % QUESTIONS_PER_ROUND === 0;
  const isGameEnd = room.questionIndex + 1 >= ROUNDS * QUESTIONS_PER_ROUND;

  room.timer = setTimeout(() => {
    if (isGameEnd) {
      room.status = "finished";
      broadcast(room, {
        type: "gameOver",
        players: publicPlayers(room)
      });
    } else if (isRoundEnd) {
      room.round++;
      room.questionIndex++;
      broadcast(room, {
        type: "roundResults",
        round: room.round - 1,
        players: publicPlayers(room)
      });
      room.timer = setTimeout(() => startQuestion(room), ROUND_RESULTS_MS);
    } else {
      startQuestion(room);
    }
  }, REVEAL_MS);
}

function resetPlayer(p) {
  p.score = 0; p.correct = 0; p.totalTime = 0; p.answer = null;
}

wss.on("connection", ws => {
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === "create") {
      const code = roomCode();
      const player = {
        id: crypto.randomUUID(), name: String(msg.name || "Player").slice(0, 18),
        ws, score: 0, correct: 0, totalTime: 0, answer: null
      };
      const room = {
        code, hostId: player.id, players: new Map([[player.id, player]]),
        status: "lobby", round: 1, questionIndex: -1,
        usedQuestions: new Set(), timer: null, currentQuestion: null
      };
      rooms.set(code, room);
      ws.roomCode = code; ws.playerId = player.id;
      send(ws, { type: "joined", code, playerId: player.id, host: true });
      broadcast(room, { type: "lobby", code, hostId: room.hostId, players: publicPlayers(room) });
      return;
    }

    if (msg.type === "join") {
      const code = String(msg.code || "").toUpperCase();
      const room = rooms.get(code);
      if (!room) return send(ws, { type: "error", message: "Room not found." });
      if (room.status !== "lobby") return send(ws, { type: "error", message: "That game has already started." });
      if (room.players.size >= MAX_PLAYERS) return send(ws, { type: "error", message: "Room is full." });

      const player = {
        id: crypto.randomUUID(), name: String(msg.name || "Player").slice(0, 18),
        ws, score: 0, correct: 0, totalTime: 0, answer: null
      };
      room.players.set(player.id, player);
      ws.roomCode = code; ws.playerId = player.id;
      send(ws, { type: "joined", code, playerId: player.id, host: false });
      broadcast(room, { type: "lobby", code, hostId: room.hostId, players: publicPlayers(room) });
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return;

    if (msg.type === "start") {
      if (ws.playerId !== room.hostId) return;
      if (room.players.size < MIN_PLAYERS) return send(ws, { type: "error", message: "At least 2 players are required." });
      room.status = "playing";
      room.round = 1;
      room.questionIndex = -1;
      for (const p of room.players.values()) resetPlayer(p);
      broadcast(room, { type: "gameStarting", rounds: ROUNDS, questionsPerRound: QUESTIONS_PER_ROUND });
      setTimeout(() => startQuestion(room), 1200);
      return;
    }

    if (msg.type === "answer") {
      if (room.status !== "playing" || !room.currentQuestion) return;
      const p = room.players.get(ws.playerId);
      if (!p || p.answer) return;
      const timeMs = Math.min(Date.now() - room.questionStartedAt, QUESTION_MS);
      const submitted = String(msg.answer || "").trim();
      const normalized = submitted.toLowerCase().replace(/\s+/g, " ");
      const accepted = room.currentQuestion.accepted.map(a => a.toLowerCase());
      const correct = accepted.includes(normalized);
      p.answer = { text: submitted, correct, points: correct ? calculatePoints(timeMs) : 0, timeMs, finished: false };
      if (correct) {
        p.score += p.answer.points;
        p.correct++;
        p.totalTime += timeMs;
      }
      send(ws, { type: "answerReceived", correct, points: p.answer.points, timeMs });
      const allAnswered = [...room.players.values()].every(x => x.answer);
      if (allAnswered) finishQuestion(room);
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    const p = room.players.get(ws.playerId);
    if (p) room.players.delete(ws.playerId);
    if (room.players.size === 0) {
      clearRoomTimer(room);
      rooms.delete(room.code);
      return;
    }
    if (room.hostId === ws.playerId) room.hostId = room.players.keys().next().value;
    broadcast(room, { type: room.status === "lobby" ? "lobby" : "players", hostId: room.hostId, players: publicPlayers(room) });
  });
});

server.listen(PORT, () => console.log(`Word Speed Party running on http://localhost:${PORT}`));
