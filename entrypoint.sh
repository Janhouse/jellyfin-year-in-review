#!/bin/sh

echo "Starting application (build: $(cat /app/.next/BUILD_ID 2>/dev/null || echo 'unknown'))"

# Run the generated injection script to replace BAKED_* placeholders
# with runtime environment variable values
if [ -f /app/scripts/inject-env.sh ]; then
    sh /app/scripts/inject-env.sh
else
    echo "WARNING: inject-env.sh not found, skipping environment injection"
fi

exec "$@"
