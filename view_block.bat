@echo off
title DIES Block Viewer
cd /d "%~dp0"

echo ==============================================================
echo            DIES Hyperledger Block Viewer (WSL Mode)
echo ==============================================================
echo.
echo This script will fetch the NEWEST block from the blockchain
echo and decode it into a readable JSON format inside WSL.
echo.

set /p Hash="Enter the Evidence Hash to query (Optional, press Enter to fetch the ALL blocks): "

if "%Hash%"=="" (
    echo [1/2] Fetching the latest block from 'mychannel'...
    wsl -d Ubuntu -e bash -c "cd ~/fabric-network/fabric-samples/test-network && export PATH=${PWD}/../bin:$PATH && export FABRIC_CFG_PATH=$PWD/../config/ && export CORE_PEER_TLS_ENABLED=true && export CORE_PEER_LOCALMSPID='Org1MSP' && export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && export CORE_PEER_ADDRESS=localhost:7051 && peer channel fetch newest newest_block.pb -c mychannel && configtxlator proto_decode --input newest_block.pb --type common.Block > newest_block.json && cat newest_block.json"
) else (
    echo [1/1] Querying the blockchain for hash: %Hash%
    wsl -d Ubuntu -e bash -c "cd ~/fabric-network/fabric-samples/test-network && export PATH=${PWD}/../bin:$PATH && export FABRIC_CFG_PATH=$PWD/../config/ && export CORE_PEER_TLS_ENABLED=true && export CORE_PEER_LOCALMSPID='Org1MSP' && export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt && export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp && export CORE_PEER_ADDRESS=localhost:7051 && peer chaincode query -C mychannel -n evidence-contract -c '{\"Args\":[\"getEvidence\",\"%Hash%\"]}'"
)

echo.
echo ==============================================================
echo Done! If you fetched a block, the JSON is printed above.
echo ==============================================================
pause
