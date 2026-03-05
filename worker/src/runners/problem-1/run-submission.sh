#!/usr/bin/env bash
#
# Standalone Docker submission runner.
# Usage: ./run-submission.sh <path-to-submission>
#   <path-to-submission> = path to a .zip file or to an extracted submission directory.
# Builds the submission with Docker, runs the container, runs the SSR HTML check
# (from runner/) against it, then stops the container. Exit code = check script exit code (0 = pass, 1 = fail).
# Requires: bash, docker, curl, unzip, node/npm (for running check from runner/).
# Check script and static/ are in runner/ (not taken from submission).
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNNER_DIR="${SCRIPT_DIR}/runner"
CONTAINER_NAME=""
TEMP_EXTRACT_DIR=""
EXTRACT_ROOT=""
BUILD_DIR=""
CHECK_EXIT_CODE=1

cleanup() {
  if [[ -n "$CONTAINER_NAME" ]]; then
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
  fi
  if [[ -n "$TEMP_EXTRACT_DIR" ]] && [[ -d "$TEMP_EXTRACT_DIR" ]]; then
    rm -rf "$TEMP_EXTRACT_DIR"
  fi
}

trap cleanup EXIT

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <path-to-submission>" >&2
  echo "  <path-to-submission> = path to .zip file or extracted directory" >&2
  exit 2
fi

SUBMISSION_PATH="$1"
if [[ ! -e "$SUBMISSION_PATH" ]]; then
  echo "Error: path does not exist: $SUBMISSION_PATH" >&2
  exit 2
fi

# Resolve to absolute path for later cd
SUBMISSION_PATH="$(cd "$(dirname "$SUBMISSION_PATH")" && pwd)/$(basename "$SUBMISSION_PATH")"

if [[ -f "$SUBMISSION_PATH" ]]; then
  if [[ "$SUBMISSION_PATH" != *.zip ]]; then
    echo "Error: file is not a .zip: $SUBMISSION_PATH" >&2
    exit 2
  fi
  TEMP_EXTRACT_DIR="$(mktemp -d)"
  unzip -q -o "$SUBMISSION_PATH" -d "$TEMP_EXTRACT_DIR"
  EXTRACT_ROOT="$TEMP_EXTRACT_DIR"
elif [[ -d "$SUBMISSION_PATH" ]]; then
  EXTRACT_ROOT="$SUBMISSION_PATH"
else
  echo "Error: not a file or directory: $SUBMISSION_PATH" >&2
  exit 2
fi

# Find directory that contains both Dockerfile and package.json
if [[ -f "$EXTRACT_ROOT/Dockerfile" ]] && [[ -f "$EXTRACT_ROOT/package.json" ]]; then
  BUILD_DIR="$EXTRACT_ROOT"
elif [[ -f "$EXTRACT_ROOT/next-version/Dockerfile" ]] && [[ -f "$EXTRACT_ROOT/next-version/package.json" ]]; then
  BUILD_DIR="$EXTRACT_ROOT/next-version"
else
  BUILD_DIR=""
  for dir in "$EXTRACT_ROOT"/*; do
    if [[ -d "$dir" ]] && [[ -f "$dir/Dockerfile" ]] && [[ -f "$dir/package.json" ]]; then
      BUILD_DIR="$dir"
      break
    fi
  done
  if [[ -z "$BUILD_DIR" ]]; then
    echo "Error: no directory with Dockerfile and package.json found under $EXTRACT_ROOT" >&2
    exit 2
  fi
fi

# Ensure absolute path
BUILD_DIR="$(cd "$BUILD_DIR" && pwd)"

if [[ ! -d "$RUNNER_DIR" ]] || [[ ! -f "$RUNNER_DIR/scripts/check-ssr-html.ts" ]] || [[ ! -d "$RUNNER_DIR/static" ]]; then
  echo "Error: runner not found (expected $RUNNER_DIR with scripts/check-ssr-html.ts and static/)" >&2
  exit 2
fi

TAG="submission-$(date +%s)"
CONTAINER_NAME="$TAG"

echo "Building Docker image: $TAG (context: $BUILD_DIR)" >&2
(cd "$BUILD_DIR" && docker build -t "$TAG" .)

# Networking setup
IS_DOCKER=false
if [ -f /.dockerenv ]; then
  IS_DOCKER=true
fi

DOCKER_NET_ARGS=""
BASE_URL="http://localhost"
HOST_PORT=""

if [ "$IS_DOCKER" = true ]; then
  # In Docker, we connect to the same network as the worker container.
  # We use the container name as the hostname.
  NETWORK_NAME=$(docker inspect "$(hostname)" -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -n1)
  if [ -n "$NETWORK_NAME" ]; then
    echo "Detected Docker environment, using network: $NETWORK_NAME" >&2
    DOCKER_NET_ARGS="--network $NETWORK_NAME"
    BASE_URL="http://${CONTAINER_NAME}:8080"
  else
    # Fallback to localhost if network detection fails (unlikely in compose)
    IS_DOCKER=false
  fi
fi

if [ "$IS_DOCKER" = false ]; then
  # Local logic: Find an available port (5000-5019)
  for p in $(seq 5000 5019); do
    DOCKER_OUTPUT=$(docker run -d -p "${p}:8080" --name "$CONTAINER_NAME" "$TAG" 2>&1) || true
    if docker ps -q -f "name=^${CONTAINER_NAME}$" 2>/dev/null | grep -q .; then
      HOST_PORT=$p
      break
    fi
    if echo "$DOCKER_OUTPUT" | grep -qE "address already in use|Ports are not available|bind:.*address already in use"; then
      docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
      continue
    fi
    echo "Error: docker run failed: $DOCKER_OUTPUT" >&2
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    exit 1
  done
  if [ -z "$HOST_PORT" ]; then
    echo "Error: no available port in 5000-5019" >&2
    exit 1
  fi
  BASE_URL="http://localhost:${HOST_PORT}"
else
  # Docker logic: Run without port mapping, just use internal network
  echo "Starting container $CONTAINER_NAME on internal network $NETWORK_NAME" >&2
  docker run -d --name "$CONTAINER_NAME" $DOCKER_NET_ARGS "$TAG"
fi

echo "Waiting for server at ${BASE_URL} (timeout 90s)..." >&2
WAIT_START=$(date +%s)
TIMEOUT=90
while true; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}" 2>/dev/null || echo "000")
  if [[ "$CODE" == "200" ]]; then
    break
  fi
  NOW=$(date +%s)
  if [[ $((NOW - WAIT_START)) -ge $TIMEOUT ]]; then
    echo "Error: server at ${BASE_URL} did not return 200 within ${TIMEOUT}s" >&2
    exit 1
  fi
  sleep 2
done

echo "Running SSR HTML check from runner..." >&2
(cd "$RUNNER_DIR" && npm install --no-audit --no-fund >/dev/null 2>&1)

CHECK_OUTPUT=""
set +e
CHECK_OUTPUT=$(cd "$RUNNER_DIR" && STATIC_DIR="$RUNNER_DIR/static" BASE_URL="${BASE_URL}" npm run check-ssr-html 2>/dev/null)
CHECK_EXIT_CODE=$?
set -e

echo "$CHECK_OUTPUT"

exit $CHECK_EXIT_CODE
