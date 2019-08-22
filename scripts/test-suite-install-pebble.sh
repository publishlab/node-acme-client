#!/bin/bash
#
# Install Pebble, CA and certs for testing.
#
set -eu

PEBBLE_VERSION="v2.2.2"


# Download certs and config
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/${PEBBLE_VERSION}/test/certs/pebble.minica.pem" -O /tmp/ca.cert.pem
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/${PEBBLE_VERSION}/test/certs/localhost/cert.pem" -O /tmp/cert.pem
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/${PEBBLE_VERSION}/test/certs/localhost/key.pem" -O /tmp/key.pem
wget -nv "https://raw.githubusercontent.com/letsencrypt/pebble/${PEBBLE_VERSION}/test/config/pebble-config.json" -O /tmp/pebble.json

# Download Pebble
wget -nv "https://github.com/letsencrypt/pebble/releases/download/${PEBBLE_VERSION}/pebble_linux-amd64" -O /tmp/pebble
wget -nv "https://github.com/letsencrypt/pebble/releases/download/${PEBBLE_VERSION}/pebble-challtestsrv_linux-amd64" -O /tmp/pebble-challtestsrv

# Config and permissions
sed -i 's/test\/certs\/localhost/\/tmp/' /tmp/pebble.json
chmod +x /tmp/{pebble,pebble-challtestsrv}

exit 0
