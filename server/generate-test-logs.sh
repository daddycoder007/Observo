#!/bin/bash
# generate-test-logs.sh
# Script to generate 500 test log entries for Observo system testing

LOG_FILE="/Users/apple/Documents/Observo/log-agent/logs/output.log"
TOTAL_LOGS=500

# Create logs directory if it doesn't exist
mkdir -p ./log-agent/logs

# Clear the log file first (optional - comment out if you want to append)
echo "" > "$LOG_FILE"

echo "�� Generating $TOTAL_LOGS test log entries..."
echo "📁 Target file: $LOG_FILE"
echo ""

# Array of different log levels and patterns
log_levels=("INFO" "ERROR" "WARN" "DEBUG" "CRITICAL")
services=("web-server" "api-gateway" "database" "auth-service" "payment-service" "notification-service")
users=("Sahil ROHERA" "John Doe" "Jane Smith" "Admin User" "Test User" "System User")
actions=("login" "logout" "payment" "database query" "API call" "file upload" "email sent" "cache miss" "session expired" "user registration")
messages=(
    "very successful operation completed"
    "failed to process request"
    "database connection established"
    "authentication successful"
    "permission denied"
    "resource not found"
    "timeout occurred"
    "validation failed"
    "cache updated successfully"
    "background job started"
    "webhook received"
    "file processed successfully"
    "email delivered"
    "payment processed"
    "user session created"
)

# Generate logs with timestamps and varied content
for i in $(seq 1 $TOTAL_LOGS); do
    # Random selection
    level=${log_levels[$((RANDOM % ${#log_levels[@]}))]}
    service=${services[$((RANDOM % ${#services[@]}))]}
    user=${users[$((RANDOM % ${#users[@]}))]}
    action=${actions[$((RANDOM % ${#actions[@]}))]}
    message=${messages[$((RANDOM % ${#messages[@]}))]}
    
    # Add some randomness to make logs more realistic
    random_id=$((RANDOM % 9999))
    random_port=$((8000 + RANDOM % 2000))
    random_ip="192.168.$((RANDOM % 255)).$((RANDOM % 255))"
    
    # Create different log formats
    case $((RANDOM % 4)) in
        0)
            # Format: ��User action message
            echo "🔥$user $action $message" >> "$LOG_FILE"
            ;;
        1)
            # Format: [LEVEL] Service: User action - message
            echo "[$level] $service: $user $action - $message" >> "$LOG_FILE"
            ;;
        2)
            # Format: Timestamp User action message (ID: xxx)
            echo "$(date '+%Y-%m-%d %H:%M:%S') $user $action $message (ID: $random_id)" >> "$LOG_FILE"
            ;;
        3)
            # Format: Service[PID] User action from IP:PORT - message
            echo "$service[$random_id] $user $action from $random_ip:$random_port - $message" >> "$LOG_FILE"
            ;;
    esac
    
    # Add some delay to simulate real-time logging (optional)
    # sleep 0.01
    
    # Progress indicator
    if [ $((i % 50)) -eq 0 ]; then
        echo "📝 Generated $i/$TOTAL_LOGS logs..."
    fi
done

echo ""
echo "✅ Successfully generated $TOTAL_LOGS test log entries!"
echo "📊 Log file size: $(du -h "$LOG_FILE" | cut -f1)"
echo "📄 Total lines: $(wc -l < "$LOG_FILE")"
echo ""
echo "🔍 Sample of generated logs:"
echo "----------------------------"
tail -10 "$LOG_FILE"
echo ""
echo "🚀 Your Observo system should now be processing these logs!"
echo "�� Check your MongoDB to see the stored data"