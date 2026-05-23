FROM golang:1.20-alpine AS build
WORKDIR /src

# Gather and download dependencies
COPY go.mod .
RUN apk add --no-cache git ca-certificates && update-ca-certificates || true

# Copy source
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/analyzer ./main.go

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=build /bin/analyzer /usr/local/bin/analyzer
EXPOSE 8081
USER 65532:65532
ENTRYPOINT ["/usr/local/bin/analyzer"]
