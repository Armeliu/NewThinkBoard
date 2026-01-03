# Socket Events

All Socket.IO events require JWT auth (sent via `socket.handshake.auth.token`).

## Room Events

### room:create (client → server)

**Payload**: none

### room:join (client → server)

```json
{ "code": "AB12C" }
```

### room:ready (client → server)

```json
{ "code": "AB12C", "ready": true }
```

### room:state (server → client)

```json
{
  "code": "AB12C",
  "status": "OPEN",
  "players": [
    { "userId": "...", "ready": false },
    { "userId": "...", "ready": true }
  ]
}
```

## Match Events

### match:started (server → client)

```json
{ "matchId": "...", "roomCode": "AB12C" }
```

### match:countdown (server → client)

```json
{ "seconds": 3 }
```

### question:start (server → client)

```json
{
  "question": {
    "type": "MCQ",
    "prompt": "Which country is ...?",
    "options": ["A", "B", "C", "D"],
    "difficulty": "MEDIUM",
    "pointsCorrect": 70,
    "pointsWrong": 0,
    "negativeMarking": false,
    "citations": [
      { "url": "https://...", "evidenceSnippet": "...", "sourceType": "WIKIPEDIA" }
    ],
    "provider": "WIKIDATA"
  },
  "serverStartTs": 1710000000000,
  "timeLimitSeconds": 30,
  "questionIndex": 0
}
```

### match:submit (client → server)

```json
{ "roomCode": "AB12C", "answer": "A" }
```

### question:result (server → client)

```json
{
  "questionIndex": 0,
  "correctAnswer": "A",
  "awarded": [
    { "userId": "...", "points": 70, "status": "SCORED" },
    { "userId": "...", "points": 0, "status": "PENDING_AI" }
  ],
  "scores": {
    "<userId>": 70
  },
  "citations": [
    { "url": "https://...", "evidenceSnippet": "...", "sourceType": "WIKIPEDIA" }
  ]
}
```

### match:disconnect (server → client)

```json
{ "userId": "...", "countdownSeconds": 30 }
```

### match:reconnect (server → client)

```json
{ "userId": "..." }
```

### match:snapshot (server → client)

```json
{
  "matchId": "...",
  "roomCode": "AB12C",
  "phase": "IN_QUESTION",
  "currentQuestionIndex": 2,
  "serverStartTs": 1710000000000,
  "timeLimitSeconds": 30,
  "scores": { "<userId>": 70 },
  "submitted": true,
  "reconnectCountdown": 0
}
```

### match:finished (server → client)

```json
{
  "matchId": "...",
  "scores": { "<userId>": 210 },
  "winnerUserId": "...",
  "reason": "FINISHED"
}
```

### match:forfeit (server → client)

```json
{
  "matchId": "...",
  "forfeitingUserId": "...",
  "scores": { "<userId>": 210 }
}
```
