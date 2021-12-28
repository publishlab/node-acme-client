#!/bin/bash
#
# Run test suite locally using CircleCI CLI.
#
set -eu

JOBS=("$@")

CIRCLECI_CLI_URL="https://github.com/CircleCI-Public/circleci-cli/releases/download/v0.1.16535/circleci-cli_0.1.16535_linux_amd64.tar.gz"
CIRCLECI_CLI_SHASUM="f5f0abcb01bf41b792e4e8e945fc7b165e351323ae1ee1e625eeea947094d022"
CIRCLECI_CLI_PATH="/tmp/circleci-cli"
CIRCLECI_CLI_BIN="${CIRCLECI_CLI_PATH}/circleci"

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && cd .. && pwd )"
CONFIG_PATH="${PROJECT_DIR}/.circleci/.temp.yml"

# Run all jobs by default
if [[ ${#JOBS[@]} -eq 0 ]]; then
    JOBS=(
        "v10"
        "v12"
        "v14"
        "v16"
        "eab-v10"
        "eab-v12"
        "eab-v14"
        "eab-v16"
    )
fi

# Download CircleCI CLI
if [[ ! -f "${CIRCLECI_CLI_BIN}" ]]; then
    echo "[-] Downloading CircleCI cli"
    mkdir -p "${CIRCLECI_CLI_PATH}"
    wget -nv "${CIRCLECI_CLI_URL}" -O "${CIRCLECI_CLI_PATH}/circleci-cli.tar.gz"
    echo "${CIRCLECI_CLI_SHASUM} *${CIRCLECI_CLI_PATH}/circleci-cli.tar.gz" | sha256sum -c
    tar zxvf "${CIRCLECI_CLI_PATH}/circleci-cli.tar.gz" -C "${CIRCLECI_CLI_PATH}" --strip-components=1
fi

# Skip CircleCI update checks
export CIRCLECI_CLI_SKIP_UPDATE_CHECK="true"

# Run test suite
echo "[-] Running test suite"
$CIRCLECI_CLI_BIN config process "${PROJECT_DIR}/.circleci/config.yml" > "${CONFIG_PATH}"
$CIRCLECI_CLI_BIN config validate -c "${CONFIG_PATH}"

for job in "${JOBS[@]}"; do
    echo "[-] Running job: ${job}"
    $CIRCLECI_CLI_BIN local execute -c "${CONFIG_PATH}" --job "${job}" --skip-checkout
    echo "[+] ${job} completed successfully"
done

# Clean up
if [[ -f "${CONFIG_PATH}" ]]; then
    rm "${CONFIG_PATH}"
fi

echo "[+] Test suite ran successfully!"
exit 0
