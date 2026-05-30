package main

import (
    "encoding/json"
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
    AvgMessageLength float64  `json:"avgMessageLength"`
    TopWords         []string `json:"topWords"`
    DurationMs       int64    `json:"durationMs"`
}

var stopWords = map[string]struct{}{
    "the": {}, "and": {}, "for": {}, "with": {}, "that": {}, "this": {}, "you": {}, "are": {}, "was": {}, "but": {},
    "not": {}, "have": {}, "has": {}, "had": {}, "they": {}, "them": {}, "can": {}, "will": {}, "just": {}, "from": {},
}

func analyzeHandler(w http.ResponseWriter, r *http.Request) {
    start := time.Now()
    w.Header().Set("Content-Type", "application/json")

    // If a token is configured, require Authorization: Bearer <token>
    token := os.Getenv("ANALYZER_TOKEN")
    if token != "" {
        auth := r.Header.Get("Authorization")
        if auth == "" || !strings.HasPrefix(auth, "Bearer ") || strings.TrimPrefix(auth, "Bearer ") != token {
            w.WriteHeader(http.StatusUnauthorized)
            json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
            return
        }
    }

    var req AnalyzeReq
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "invalid payload"})
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

    // pick top 8 words
    type pair struct{ k string; v int }
    pairs := make([]pair, 0, len(wordFreq))
    for k, v := range wordFreq { pairs = append(pairs, pair{k, v}) }
    sort.Slice(pairs, func(i, j int) bool { return pairs[i].v > pairs[j].v })
    top := make([]string, 0, 8)
    for i := 0; i < len(pairs) && i < 8; i++ { top = append(top, pairs[i].k) }

    avg := 0.0
    if total > 0 { avg = float64(totalLen) / float64(total) }

    resp := AnalyzeResp{
        TotalMessages:    total,
        UserMessages:     userCount,
        BotMessages:      botCount,
        AvgMessageLength: avg,
        TopWords:         top,
        DurationMs:       time.Since(start).Milliseconds(),
    }

    json.NewEncoder(w).Encode(resp)
}

func main() {
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
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "regexp"
    "sort"
    "strings"
)

type Message struct {
    Text string `json:"text"`
    Type string `json:"type"`
    Time string `json:"time"`
}

type Summary struct {
    TotalMessages int               `json:"total_messages"`
    UserMessages  int               `json:"user_messages"`
    BotMessages   int               `json:"bot_messages"`
    TopWords      []map[string]int  `json:"top_words"`
}

var wordRe = regexp.MustCompile(`[A-Za-z0-9]+`)

func analyzeHandler(w http.ResponseWriter, r *http.Request) {
    // Very permissive CORS for local development
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    if r.Method == http.MethodOptions {
        w.WriteHeader(http.StatusNoContent)
        return
    }

    var msgs []Message
    dec := json.NewDecoder(r.Body)
    if err := dec.Decode(&msgs); err != nil {
        http.Error(w, "invalid payload", http.StatusBadRequest)
        return
    }

    total := len(msgs)
    user := 0
    bot := 0
    counts := map[string]int{}
    stopwords := map[string]struct{}{"the":{},"and":{},"a":{},"to":{},"is":{},"in":{},"of":{},"for":{},"on":{},"you":{},"i":{},"it":{}}

    for _, m := range msgs {
        if m.Type == "user" {
            user++
        } else if m.Type == "bot" {
            bot++
        }
        text := strings.ToLower(m.Text)
        for _, w := range wordRe.FindAllString(text, -1) {
            if _, ok := stopwords[w]; ok || len(w) < 2 { continue }
            counts[w]++
        }
    }

    // collect top words
    type kv struct{ K string; V int }
    var arr []kv
    for k,v := range counts { arr = append(arr, kv{k,v}) }
    sort.Slice(arr, func(i,j int) bool { return arr[i].V > arr[j].V })
    top := 10
    if len(arr) < top { top = len(arr) }
    topWords := []map[string]int{}
    for i:=0;i<top;i++ { topWords = append(topWords, map[string]int{arr[i].K: arr[i].V}) }

    out := Summary{ TotalMessages: total, UserMessages: user, BotMessages: bot, TopWords: topWords }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(out)
}

func main() {
    http.HandleFunc("/analyze", analyzeHandler)
    log.Println("Go sidecar listening on :8081")
    log.Fatal(http.ListenAndServe(":8081", nil))
}
