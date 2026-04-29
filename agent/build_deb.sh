#!/bin/bash
set -e

# Define Package details
PKG_NAME="linux-security-agent"
VERSION="1.0.0"
ARCH="amd64"
DIR_NAME="${PKG_NAME}_${VERSION}_${ARCH}"

echo "Building Go Agent..."
go build -o linux-security-agent main.go collector.go cis_checks.go sender.go utils.go

echo "Creating Debian directory structure..."
mkdir -p "${DIR_NAME}/DEBIAN"
mkdir -p "${DIR_NAME}/usr/bin"
mkdir -p "${DIR_NAME}/etc/systemd/system"

# Copy binary
cp linux-security-agent "${DIR_NAME}/usr/bin/"

# Copy systemd service
cp linux-security-agent.service "${DIR_NAME}/etc/systemd/system/"

# Create DEBIAN/control file
cat <<EOT > "${DIR_NAME}/DEBIAN/control"
Package: ${PKG_NAME}
Version: ${VERSION}
Section: custom
Priority: optional
Architecture: ${ARCH}
Essential: no
Maintainer: Rohit Kumar <rohit@example.com>
Description: Lightweight Linux endpoint security posture auditor mapped against CIS benchmarks.
EOT

# Create DEBIAN/postinst script
cat <<EOT > "${DIR_NAME}/DEBIAN/postinst"
#!/bin/sh
set -e
systemctl daemon-reload
systemctl enable linux-security-agent
systemctl restart linux-security-agent
echo "Linux Security Agent successfully installed and started!"
EOT

chmod 755 "${DIR_NAME}/DEBIAN/postinst"

# Build .deb package
echo "Running dpkg-deb to build the package..."
dpkg-deb --build "${DIR_NAME}"

# Cleanup
rm -rf "${DIR_NAME}"
echo "Build complete! Package generated: ${DIR_NAME}.deb"
