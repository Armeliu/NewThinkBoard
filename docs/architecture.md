# Architecture Overview

## System Context

QuizDuel is a MERN monorepo with a React client and an Express + Socket.IO server. MongoDB stores users, rooms, and matches (question snapshots, submissions, and results). Ollama is optional for essay judging.

## Auth + JWT

- Username/password auth with bcrypt hashing.
- JWT access tokens secure REST and Socket.IO connections.
- JWT allows stateless verification for both HTTP and real-time channels.

## State Machine

```mermaid
stateDiagram-v2
  [*] --> LOBBY
  LOBBY --> COUNTDOWN
  COUNTDOWN --> IN_QUESTION
  IN_QUESTION --> SHOW_RESULTS
  SHOW_RESULTS --> NEXT_QUESTION
  NEXT_QUESTION --> IN_QUESTION
  SHOW_RESULTS --> FINISHED
  FINISHED --> [*]
```

## Data Model Diagram

```mermaid
erDiagram
  USER ||--o{ ROOM : joins
  ROOM ||--o{ MATCH : starts
  MATCH ||--o{ QUESTION_SNAPSHOT : includes
  MATCH ||--o{ SUBMISSION : collects
  MATCH ||--o{ RESULT : records
```

## Reconnect + Forfeit Sequence

```mermaid
sequenceDiagram
  participant P as Player
  participant S as Server
  P->>S: disconnect
  S->>S: start 30s timer
  S-->>P: match:disconnect (countdown)
  alt reconnect in time
    P->>S: reconnect
    S-->>P: match:snapshot
  else timeout
    S-->>P: match:finished (FORFEIT)
  end
```

## Wikidata Question Generation

- Server pulls facts from Wikidata via SPARQL.
- Deterministic templates convert facts into MCQs.
- Wikipedia summary endpoint provides evidence snippets; if not available, the fact is discarded.
- Citations stored as URL + short snippet only.

## Extending Providers

Implement the `QuestionProvider` interface and register it in `questionService.js`.
