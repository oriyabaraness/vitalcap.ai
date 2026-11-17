#!/usr/bin/env bash
# Run after: npx @railway/cli login
set -euo pipefail
cd "$(dirname "$0")/.."

CLI=(npx -y @railway/cli@latest)

echo "→ Linking Railway project (create new or pick existing)..."
"${CLI[@]}" link

echo "→ Deploying..."
"${CLI[@]}" up --detach

echo "→ Generating public URL (if not set)..."
"${CLI[@]}" domain 2>/dev/null || true

echo ""
echo "Add custom domains in dashboard or run:"
echo "  ${CLI[*]} domain vitalcap.ai"
echo "  ${CLI[*]} domain www.vitalcap.ai"
echo ""
echo "Then add Railway's CNAME + TXT records at your domain registrar."