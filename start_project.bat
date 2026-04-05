@echo off
title Start DEIS Services
cd /d "%~dp0"

echo ==============================================
echo        DEIS Project Startup Script
echo ==============================================

echo [1/2] Starting Backend Server (Fabric Node SDK)...
start "Backend Server" cmd /k "cd server && npm start"

echo [2/2] Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm run dev"

echo ==============================================
echo All services have been launched!
echo Access the frontend at: http://localhost:5173
echo Note: Hyperledger Fabric runs via Docker.
echo Check FABRIC_SETUP_GUIDE.md to start the blockchain node.
echo ==============================================
