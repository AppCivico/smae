#!/bin/bash
set -e

# Set the log file and maximum log size (in bytes, e.g., 10MB)
MAX_LOG_SIZE=$((10 * 1024 * 1024))

# Function to rotate logs if they exceed the maximum size
rotate_logs() {
    while true; do
        if [ -f "$LOG_FILE" ]; then
            LOG_SIZE=$(stat -c%s "$LOG_FILE")
            if [ "$LOG_SIZE" -ge "$MAX_LOG_SIZE" ]; then
                # Truncate (empty) the log file instead of renaming/copying
                : > "$LOG_FILE"
            fi
        fi
        sleep 600  # Sleep for 10 minutes
    done
}

# Start the log rotation in the background if logging is enabled
if [ "$USE_FILE_LOG" = "1" ]; then
    # Ensure the log directory exists
    LOG_FILE="/usr/src/app/logs/app.log"
    mkdir -p /usr/src/app/logs

    : > $LOG_FILE
    rotate_logs &
    LOGGING_CMD="tee -a $LOG_FILE"
else
    LOGGING_CMD="cat"
fi

ls -lhas | $LOGGING_CMD

npx prisma migrate deploy 2>&1 | $LOGGING_CMD
node --enable-source-maps dist/prisma/seed.js 2>&1 | $LOGGING_CMD

PGSQL_DIR=./prisma/manual-copy/ node --enable-source-maps dist/bin/pgsql-migrate.js 2>&1 | $LOGGING_CMD

# Run the main application, logging output
LOG_FILE=$LOG_FILE TZ=UTC node --enable-source-maps dist/src/main 2>&1 | $LOGGING_CMD
