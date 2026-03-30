@echo off
title Start DEIS Services
cd /d "%~dp0"

echo ==============================================
echo        DEIS Project Startup Script
echo ==============================================

echo [1/4] Starting Hardhat Local Blockchain...
start "BlockChain Node" cmd /k "cd blockchain && npx hardhat node"

echo Waiting for the node to start...
timeout /t 5 /nobreak > NUL

echo [2/4] Deploying Smart Contract...
start "Deploy Contract" cmd /c "cd blockchain && npx hardhat run scripts/deploy.js --network localhost && echo. && echo Deployment successful! This window will close shortly. && timeout /t 5 > NUL"

echo Waiting for contract deployment...
timeout /t 5 /nobreak > NUL

echo [3/4] Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm start"

echo [4/4] Starting Frontend Client...
start "Frontend Client" cmd /k "cd client && npm run dev"

echo ==============================================
echo All services have been launched!
echo Access the frontend at: http://localhost:5173
echo ==============================================
