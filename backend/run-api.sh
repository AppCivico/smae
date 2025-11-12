#!/bin/bash
set -e

# --- Configuration ---
LOG_DIR="/usr/src/app/logs"
LOG_FILE="$LOG_DIR/app.log"
MAX_LOG_SIZE=$((10 * 1024 * 1024)) # 10MB
RESTART_TRIGGER_FILE="/tmp/restart-api"
USE_FILE_LOG="${USE_FILE_LOG:-0}" # Default to 0 if not set

# --- State ---
NODE_PID=""
LOG_ROTATOR_PID=""

# --- Logging Functions ---

# Logs a single message with a timestamp
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    if [ "$USE_FILE_LOG" = "1" ]; then
        echo "$message" | tee -a "$LOG_FILE"
    else
        echo "$message"
    fi
}

# Reads from stdin and logs each line via the `log` function
log_stream() {
    while IFS= read -r line; do
        # We pass the line to `log` to get consistent timestamping
        log "$line"
    done
}

# --- Application Functions ---

# Function to rotate logs if they exceed the maximum size
rotate_logs() {
    while true; do
        if [ "$USE_FILE_LOG" = "1" ] && [ -f "$LOG_FILE" ]; then
            local log_size
            log_size=$(wc -c < "$LOG_FILE")
            if [ "$log_size" -ge "$MAX_LOG_SIZE" ]; then
                log "Log file size ($log_size bytes) exceeds limit ($MAX_LOG_SIZE bytes). Truncating."
                : > "$LOG_FILE"
            fi
        fi
        sleep 600 # Check every 10 minutes
    done
}

run_migrations() {
    log "Running migrations..."
    # Group commands and redirect stderr for the whole block to stdout.
    # The caller will be responsible for piping this to the logger.
    {
        npx prisma migrate deploy
        node --enable-source-maps dist/prisma/seed.js
        PGSQL_DIR=./prisma/manual-copy/ node --enable-source-maps dist/bin/pgsql-migrate.js
    } 2>&1
}

start_node_app() {
    log "Starting Node.js application..."
    # Start the app in the background and store its PID
    if [ "$USE_FILE_LOG" = "1" ]; then
        # When logging to file, redirect both stdout and stderr
        node --enable-source-maps dist/src/main >> "$LOG_FILE" 2>&1 &
    else
        # Otherwise, let it print to the script's stdout/stderr
        node --enable-source-maps dist/src/main &
    fi
    NODE_PID=$!
    log "Node.js application started with PID: $NODE_PID"
}

stop_node_app() {
    if [ -n "$NODE_PID" ] && kill -0 "$NODE_PID" 2>/dev/null; then
        log "Stopping Node.js application (PID: $NODE_PID)..."
        kill "$NODE_PID"
        wait "$NODE_PID" 2>/dev/null || true
        log "Node.js application stopped."
    fi
    NODE_PID=""
}

# Graceful shutdown function
cleanup() {
    log "Shutdown signal received. Cleaning up..."
    stop_node_app
    if [ -n "$LOG_ROTATOR_PID" ] && kill -0 "$LOG_ROTATOR_PID" 2>/dev/null; then
        kill "$LOG_ROTATOR_PID"
    fi
    log "Cleanup complete. Exiting."
    exit 0
}

# --- Main Execution ---

trap cleanup SIGINT SIGTERM

if [ "$USE_FILE_LOG" = "1" ]; then
    mkdir -p "$LOG_DIR"
    : > "$LOG_FILE"
    rotate_logs &
    LOG_ROTATOR_PID=$!
fi

log "Script starting up..."

# Initial startup sequence
run_migrations | log_stream
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    log "Migrations failed on startup. Exiting."
    exit 1
fi
start_node_app

# Main Monitoring Loop
while true; do
    if [ -f "$RESTART_TRIGGER_FILE" ]; then
        log "Restart trigger detected. Restarting application..."
        rm -f "$RESTART_TRIGGER_FILE"
        stop_node_app

        run_migrations | log_stream
        if [ "${PIPESTATUS[0]}" -ne 0 ]; then
            log "Migrations failed during restart. Exiting."
            exit 1
        fi

        start_node_app
    fi

    if ! kill -0 "$NODE_PID" 2>/dev/null; then
        log "Node.js application (PID: $NODE_PID) terminated unexpectedly. Exiting."
        cleanup
        exit 1
    fi

    sleep 5
done
