#!/bin/bash
#
# Wait for Pebble Server to accept connetions.
#
set -eu

PEBBLE_HEALTHCHECK="https://localhost:14000/dir"
WAIT_SECONDS=5
MAX_ATTEMPTS=10
ATTEMPT=0


# Loop until ready
while ! $(curl --cacert /tmp/ca.cert.pem -s -D - "${PEBBLE_HEALTHCHECK}" | grep '^HTTP.*200' > /dev/null 2>&1); do
    ATTEMPT=$((ATTEMPT + 1))

    # Max attempts
    if [[ $ATTEMPT -gt $MAX_ATTEMPTS ]]; then
        echo "[!] Waited ${ATTEMPT} attempts for server to become ready, exit 1"
        exit 1
    fi

    # Retry
    echo "[-] Waiting 5 seconds for server to become ready, attempt: ${ATTEMPT}/${MAX_ATTEMPTS}"
    sleep $WAIT_SECONDS
done

# Ready
echo "[+] Server ready!"
exit 0
