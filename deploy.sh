#!/bin/bash
# Deploy to Alibaba Cloud ECS
# Usage: ./deploy.sh <server-ip> [ssh-user]

SERVER=${1:?请提供服务器 IP}
USER=${2:-root}
DEPLOY_DIR="/var/www/frontend"

echo "=== 1. Building project ==="
npm run build

echo ""
echo "=== 2. Uploading files to $SERVER ==="
ssh $USER@$SERVER "mkdir -p $DEPLOY_DIR"
scp -r out/* $USER@$SERVER:$DEPLOY_DIR/

echo ""
echo "=== 3. Uploading Nginx config ==="
scp nginx.conf $USER@$SERVER:/etc/nginx/sites-available/frontend

echo ""
echo "=== 4. Reloading Nginx ==="
ssh $USER@$SERVER "
    ln -sf /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/frontend &&
    nginx -t &&
    systemctl reload nginx
"

echo ""
echo "=== Deployment complete ==="
echo "Visit: http://$SERVER"
