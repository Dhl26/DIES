@echo off
title Start DEIS Services
cd /d "%~dp0"

echo ==============================================================
echo            DEIS Project Startup Script (WSL Mode)
echo ==============================================================
echo.
echo Important: Ensure Docker Desktop is running before proceeding.
echo.

set /p ResetFabric="Do you want to reset and rebuild the Hyperledger Network? (Y/N): "

if /i "%ResetFabric%"=="Y" (
    echo.
    echo [1/3] Pushing to WSL to rebuild Blockchain... (This takes a few minutes)
    wsl -d Ubuntu -e bash -c "cd ~/fabric-network/fabric-samples/test-network && ./network.sh down && ./network.sh up createChannel -c mychannel -ca && ./network.sh deployCC -ccn evidence-contract -ccp ~/DIES/fabric-backend/chaincode-javascript/ -ccl javascript"
) ELSE (
    echo.
    echo [1/3] Skipping Blockchain deployment (assuming it is already running)...
)

echo.
echo [2/3] Starting Backend Server in a new WSL terminal...
start "DEIS Server" wsl -d Ubuntu -e bash -c "export NVM_DIR=~/.nvm; source ~/.nvm/nvm.sh; nvm install 23; nvm use 23; cd ~/DIES/server; npm start; echo 'Backend crashed or stopped. Check errors above.'; exec bash"

echo.
echo [3/3] Starting Frontend Client in a new WSL terminal...
start "DEIS Client" wsl -d Ubuntu -e bash -c "export NVM_DIR=~/.nvm; source ~/.nvm/nvm.sh; nvm install 23; nvm use 23; cd ~/DIES/client; npm run dev; echo 'Frontend crashed or stopped. Check errors above.'; exec bash"

echo.
echo ==============================================================
echo All services have been dispatched to Windows Subsystem for Linux!
echo Two new terminal windows should have popped up. Keep them open.
echo.
echo Access the frontend at: http://localhost:5173
echo ==============================================================
echo Press any key to exit this launcher...
pause >nul
