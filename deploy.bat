@echo off
REM Quick deployment script - runs deployment on remote server

echo ========================================
echo   Buggly App - Remote Deploy
echo ========================================
echo.
echo Connecting to server 31.97.203.7...
echo.

ssh root@31.97.203.7 "cd /home/buggly/download--1- && echo '📥 Pulling latest changes...' && git pull && echo '📦 Installing dependencies...' && npm install && echo '🔨 Building application...' && npm run build && echo '🔄 Restarting PM2 app...' && pm2 restart app && echo '✅ Deployment complete!' && echo '' && echo 'Current commit:' && git log -1 --oneline && echo '' && echo 'PM2 Status:' && pm2 list"

echo.
echo ========================================
echo   Deployment finished!
echo ========================================
pause
