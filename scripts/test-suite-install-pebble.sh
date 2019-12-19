#!/bin/bash
#
# Install Pebble for testing.
#
set -eu


# Download certs and config
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/v${PEBBLE_VERSION}/test/certs/pebble.minica.pem" -O /tmp/ca.cert.pem
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/v${PEBBLE_VERSION}/test/certs/localhost/cert.pem" -O /tmp/cert.pem
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/v${PEBBLE_VERSION}/test/certs/localhost/key.pem" -O /tmp/key.pem
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/v${PEBBLE_VERSION}/test/config/pebble-config.json" -O /tmp/pebble.json

# Download Pebble
wget -nv "https://github.com/letsencrypt/pebble/releases/download/v${PEBBLE_VERSION}/pebble_linux-amd64" -O /tmp/pebble

# Config and permissions
sed -i 's/test\/certs\/localhost/\/tmp/' /tmp/pebble.json
chmod +x /tmp/pebble

exit 0
