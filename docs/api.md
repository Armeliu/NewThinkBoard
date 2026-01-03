# API

All endpoints return JSON with an `ok` boolean flag.

## REST Endpoints

| Method | Path | Description | Auth |
| --- | --- | --- | --- |
| GET | /api/health | Health check | No |
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login user | No |
| POST | /api/rooms/create | Create a room | Yes (JWT) |
| POST | /api/rooms/join | Join a room by code | Yes (JWT) |
| GET | /api/matches/:matchId | Fetch match details | Yes (JWT) |
| POST | /api/ai/regrade | Regrade pending essays (dev/admin) | Yes (JWT) |

### GET /api/health

**Response**

```json
{
  "ok": true
}
```

### POST /api/auth/register

**Request**

```json
{
  "username": "player1",
  "password": "password123"
}
```

**Response**

```json
{
  "ok": true,
  "token": "<jwt>",
  "user": {
    "id": "...",
    "username": "player1"
  }
}
```

### POST /api/auth/login

**Request**

```json
{
  "username": "player1",
  "password": "password123"
}
```

**Response**

```json
{
  "ok": true,
  "token": "<jwt>",
  "user": {
    "id": "...",
    "username": "player1"
  }
}
```

### POST /api/rooms/create

**Response**

```json
{
  "ok": true,
  "roomCode": "AB12C"
}
```

### POST /api/rooms/join

**Request**

```json
{
  "code": "AB12C"
}
```

**Response**

```json
{
  "ok": true,
  "roomCode": "AB12C"
}
```
