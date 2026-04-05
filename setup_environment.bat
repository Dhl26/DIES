@echo off
title DEIS Environment Setup
cd /d "%~dp0"
set "PROJECT_DIR=%cd%"

echo =========================================================
echo            DEIS Universal Setup Script
echo =========================================================
echo This script will automatically download and install all 
echo necessary prerequisites to run the DEIS blockchain platform.
echo.
pause

echo.
echo [1/6] Installing WSL2 (if not already installed)...
wsl --install

echo.
echo [2/6] Installing Docker Desktop...
winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements

echo.
echo [3/6] Installing native Linux dependencies (Git, JQ, Curl) inside WSL...
echo (You may be prompted for your WSL Linux password)
wsl -e bash -c "sudo apt-get update && sudo apt-get install -y git jq curl"

echo.
echo [4/6] Installing Node.js 23 natively in Linux using NVM...
wsl -e bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
wsl -e bash -c "export NVM_DIR=$HOME/.nvm; source $NVM_DIR/nvm.sh; nvm install 23 && nvm alias default 23"
wsl -e bash -c "export NVM_DIR=$HOME/.nvm; source $NVM_DIR/nvm.sh; npm install -g npm@latest"

echo.
echo [5/6] Downloading Hyperledger Fabric infrastructure into Linux...
wsl -e bash -c "mkdir -p ~/fabric-network && cd ~/fabric-network && curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh"
wsl -e bash -c "cd ~/fabric-network && ./install-fabric.sh docker samples binary"
echo Pulling missing Node chaincode compiler image...
wsl -e bash -c "docker pull hyperledger/fabric-nodeenv:2.5"

echo.
echo [6/6] Creating pathing Symlink to project folder to avoid space bugs...
for /f "usebackq tokens=*" %%a in (`wsl wslpath "%PROJECT_DIR%"`) do set WSL_PATH=%%a
wsl -e bash -c "ln -sfn \"%WSL_PATH%\" ~/DIES"
echo Linked %WSL_PATH% to ~/DIES

echo.
echo =========================================================
echo                       100%% Complete!
echo =========================================================
echo IMPORTANT NEXT STEPS (DO NOT SKIP):
echo 1. If Docker Desktop was just installed, please RESTART YOUR PC !!
echo 2. Open the Docker Desktop App on Windows.
echo 3. Go to Settings (Gear Icon) -^> Resources -^> WSL Integration.
echo 4. Check the box to enable integration with your default WSL distro!
echo 5. You can now double-click start_project.bat to launch everything!
echo =========================================================
pause
