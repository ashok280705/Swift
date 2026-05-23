#!/bin/bash
echo "=== ValidateService: health-checking the application ==="

MAX_RETRIES=10
RETRY_INTERVAL=5
PORT=3000

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i/$MAX_RETRIES — checking http://localhost:$PORT ..."

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "Health check passed (HTTP $HTTP_CODE)."
        exit 0
    fi

    echo "Got HTTP $HTTP_CODE — waiting ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

echo "ERROR: Application did not respond after $((MAX_RETRIES * RETRY_INTERVAL))s."
echo "Check PM2 logs: sudo -u ec2-user pm2 logs swift"
exit 1
