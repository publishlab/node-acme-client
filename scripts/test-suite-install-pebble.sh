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

# Pebble config with EAB enabled
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/v${PEBBLE_VERSION}/test/config/pebble-config-external-account-bindings.json" -O /tmp/pebble-config-external-account-bindings.json


# Download Pebble
wget -nv "https://github.com/letsencrypt/pebble/releases/download/v${PEBBLE_VERSION}/pebble_linux-amd64" -O /tmp/pebble

# Config and permissions
sed -i 's/test\/certs\/localhost/\/tmp/' /tmp/pebble.json
sed -i 's/test\/certs\/localhost/\/tmp/' /tmp/pebble-config-external-account-bindings.json
sed -i 's/:14000/:24000/' /tmp/pebble-config-external-account-bindings.json
sed -i 's/:15000/:25000/' /tmp/pebble-config-external-account-bindings.json
sed -i 's/:5002/:25002/' /tmp/pebble-config-external-account-bindings.json
sed -i 's/:5001/:25001/' /tmp/pebble-config-external-account-bindings.json
chmod +x /tmp/pebble

exit 0
