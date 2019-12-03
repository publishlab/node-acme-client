#!/bin/bash
#
# Install Pebble Challenge Test Server for testing.
#
set -eu

PEBBLECTS_VERSION="2.2.2"


# Download Pebble CTS
wget -nv "https://github.com/letsencrypt/pebble/releases/download/v${PEBBLECTS_VERSION}/pebble-challtestsrv_linux-amd64" -O /tmp/pebble-challtestsrv

# Permissions
chmod +x /tmp/pebble-challtestsrv

exit 0
