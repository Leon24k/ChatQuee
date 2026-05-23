# ChatQuee Go sidecar analyzer

Small Go HTTP sidecar that exposes a simple `/analyze` endpoint on port `8081`.

Quick run (requires Go 1.20+):

```bash
cd services/go_sidecar
go run main.go
```

Request format: POST `/analyze` with JSON body:

```json
{ "chatHistory": [ { "text": "hello", "type": "user", "time": "10:00" }, ... ] }
```

Response: JSON summary with top words, counts and average length.
 
Docker (recommended for local dev):

```bash
# from repo root
docker compose up --build
```

This will start the Node app on port `3000` and the Go sidecar on port `8081`.
Go sidecar for ChatQuee
======================

This small service accepts a POST of the chat history (JSON array of `{text,type,time}`) and returns a simple analytics summary (total messages, user/bot counts, top words).

Run locally (requires Go 1.18+):

```bash
cd services/go_sidecar
go run .
# or build: go build -o chat-sidecar && ./chat-sidecar
```

The service listens on `:8081` and provides the `/analyze` endpoint. CORS is permissive for local development.
