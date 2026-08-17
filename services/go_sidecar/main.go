package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
    "regexp"
    "sort"
    "strings"
    "time"
)

type ChatMsg struct {
    Text string `json:"text"`
    Type string `json:"type"`
    Time string `json:"time"`
}

type AnalyzeReq struct {
    ChatHistory []ChatMsg `json:"chatHistory"`
}

type AnalyzeResp struct {
    TotalMessages    int      `json:"totalMessages"`
    UserMessages     int      `json:"userMessages"`
    BotMessages      int      `json:"botMessages"`
    AvgMessageLength float64 `json:"avgMessageLength"`
    TopWords         []string `json:"topWords"`
    DurationMs       int64    `json:"durationMs"`
}

var stopWords = map[string]struct{}{
    "the": {}, "and": {}, "for": {}, "with": {}, "that": {}, "this": {}, "you": {}, "are": {}, "was": {}, "but": {},
    "not": {}, "have": {}, "has": {}, "had": {}, "they": {}, "them": {}, "can": {}, "will": {}, "just": {}, "from": {},
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    _ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func parseAnalyzeRequest(r *http.Request) (AnalyzeReq, error) {
    body, err := io.ReadAll(r.Body)
    if err != nil {
        return AnalyzeReq{}, fmt.Errorf("read request body: %w", err)
    }

    trimmed := bytes.TrimSpace(body)
    if len(trimmed) == 0 {
        return AnalyzeReq{}, fmt.Errorf("empty payload")
    }

    var req AnalyzeReq
    if err := json.Unmarshal(trimmed, &req); err == nil && req.ChatHistory != nil {
        return req, nil
    }

    var legacy struct {
        Message string `json:"message"`
    }
    if err := json.Unmarshal(trimmed, &legacy); err == nil && strings.TrimSpace(legacy.Message) != "" {
        return AnalyzeReq{
            ChatHistory: []ChatMsg{{
                Text: legacy.Message,
                Type: "user",
                Time: time.Now().UTC().Format(time.RFC3339),
            }},
        }, nil
    }

    return AnalyzeReq{}, fmt.Errorf("invalid payload")
}

func analyzeHandler(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    w.Header().Set("Content-Type", "application/json")

    token := os.Getenv("ANALYZER_TOKEN")
    if token != "" {
        auth := r.Header.Get("Authorization")
        if auth == "" || !strings.HasPrefix(auth, "Bearer ") || strings.TrimPrefix(auth, "Bearer ") != token {
            w.WriteHeader(http.StatusUnauthorized)
            _ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
            return
        }
    }

    req, err := parseAnalyzeRequest(r)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        _ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid payload"})
        return
    }

    total := len(req.ChatHistory)
    userCount := 0
    botCount := 0
    var totalLen int
    wordFreq := map[string]int{}
    splitter := regexp.MustCompile(`[^\p{L}0-9]+`)

    for _, m := range req.ChatHistory {
        if m.Type == "user" || strings.EqualFold(m.Type, "user") {
            userCount++
        } else {
            botCount++
        }
        totalLen += len(m.Text)
        words := splitter.Split(strings.ToLower(m.Text), -1)
        for _, w := range words {
            if w == "" || len(w) <= 2 {
                continue
            }
            if _, ok := stopWords[w]; ok {
                continue
            }
            wordFreq[w]++
        }
    }

    type pair struct{ k string; v int }
    pairs := make([]pair, 0, len(wordFreq))
    for k, v := range wordFreq {
        pairs = append(pairs, pair{k, v})
    }
    sort.Slice(pairs, func(i, j int) bool { return pairs[i].v > pairs[j].v })

    top := make([]string, 0, 8)
    for i := 0; i < len(pairs) && i < 8; i++ {
        top = append(top, pairs[i].k)
    }

    avg := 0.0
    if total > 0 {
        avg = float64(totalLen) / float64(total)
    }

    resp := AnalyzeResp{
        TotalMessages:    total,
        UserMessages:     userCount,
        BotMessages:      botCount,
        AvgMessageLength: avg,
        TopWords:         top,
        DurationMs:       time.Since(start).Milliseconds(),
    }

    _ = json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/health", healthHandler)
    http.HandleFunc("/analyze", analyzeHandler)

    srv := &http.Server{
        Addr: ":8081",
        ReadHeaderTimeout: 5 * time.Second,
    }

    log.Printf("Go sidecar analyzer listening on %s", srv.Addr)
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        log.Fatalf("server failed: %v", err)
    }
}
