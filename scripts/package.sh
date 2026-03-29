#!/bin/bash
set -euo pipefail

VERSION=${1:-$(date +%Y.%m.%d)}
PKG_NAME="unraid-mcp"
BUILD_DIR="build/pkg"

echo "Building unraid-mcp v${VERSION}..."

# Build the binary
echo "Compiling binary with bun..."
bun build src/index.ts --compile --outfile "dist/${PKG_NAME}"
chmod +x "dist/${PKG_NAME}"

# Set up package directory structure (Slackware layout)
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}/usr/local/bin"
mkdir -p "${BUILD_DIR}/etc/rc.d"
mkdir -p "${BUILD_DIR}/usr/local/unraid-mcp/webgui"
mkdir -p "${BUILD_DIR}/install"

# Copy binary
cp "dist/${PKG_NAME}" "${BUILD_DIR}/usr/local/bin/${PKG_NAME}"

# Create rc script
cat > "${BUILD_DIR}/etc/rc.d/rc.unraid-mcp" << 'RCEOF'
#!/bin/bash
# Unraid MCP Server init script

DAEMON=/usr/local/bin/unraid-mcp
CONFIGFILE=/boot/config/plugins/unraid-mcp/config.env
PIDFILE=/var/run/unraid-mcp.pid
LOGFILE=/var/log/unraid-mcp.log

start() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
    echo "unraid-mcp is already running"
    return 1
  fi
  echo "Starting unraid-mcp..."
  if [ -f "$CONFIGFILE" ]; then
    set -a; source "$CONFIGFILE"; set +a
  fi
  $DAEMON >> "$LOGFILE" 2>&1 &
  echo $! > "$PIDFILE"
  echo "unraid-mcp started (PID $(cat $PIDFILE))"
}

stop() {
  if [ ! -f "$PIDFILE" ]; then
    echo "unraid-mcp is not running"
    return 1
  fi
  echo "Stopping unraid-mcp..."
  kill "$(cat $PIDFILE)" 2>/dev/null || true
  rm -f "$PIDFILE"
  echo "unraid-mcp stopped"
}

restart() {
  stop
  sleep 1
  start
}

status() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
    echo "unraid-mcp is running (PID $(cat $PIDFILE))"
  else
    echo "unraid-mcp is not running"
  fi
}

case "$1" in
  start)   start ;;
  stop)    stop ;;
  restart) restart ;;
  status)  status ;;
  *)       echo "Usage: $0 {start|stop|restart|status}" ;;
esac
RCEOF
chmod +x "${BUILD_DIR}/etc/rc.d/rc.unraid-mcp"

# Copy settings page
cp plugin/settings.php "${BUILD_DIR}/usr/local/unraid-mcp/webgui/Settings/UnraidMCPSettings.php"

# Create doinst.sh
cat > "${BUILD_DIR}/install/doinst.sh" << 'DOEOF'
#!/bin/bash
chmod +x /etc/rc.d/rc.unraid-mcp
DOEOF

# Create the .txz package
echo "Creating Slackware package..."
mkdir -p "dist"
( cd "${BUILD_DIR}" && makepkg -l y -c n "$(pwd)/../../dist/${PKG_NAME}-${VERSION}-x86_64-1.txz" )

echo "Package created: dist/${PKG_NAME}-${VERSION}-x86_64-1.txz"
echo "Done!"
