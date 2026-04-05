# Instructions to Run Hyperledger Fabric Locally

Because you requested a private Hyperledger Fabric blockchain, we have replaced the Ethereum (Hardhat) setup with a Hyperledger Fabric implementation.

The new structure is located in the `fabric-backend` directory, which contains your Fabric chaincode (`chaincode-javascript/`).

## Prerequisites (Windows)
1. Install **Docker Desktop** (with WSL2 backend enabled).
2. Install **WSL2** (Ubuntu recommended).
3. Ensure you have **Node.js 18+** installed inside WSL2.
4. Install **Git** inside WSL2.

## 1. Setup the Fabric Test Network
Open your WSL2 terminal (Ubuntu) and run the following curl command to download the Hyperledger Fabric docker images and binaries:

```bash
mkdir -p ~/fabric-network
cd ~/fabric-network
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
./install-fabric.sh docker samples binary
```

## 2. Start the Private Blockchain
Navigate to the test-network directory and launch the blockchain nodes:

```bash
cd fabric-samples/test-network
./network.sh down
./network.sh up createChannel -c mychannel -ca
```

## 3. Deploy the DIES Evidence Chaincode
Since we created your smart contract in the `fabric-backend/chaincode-javascript` directory, you need to copy it into your WSL2 environment, or point the network script to it:

Assume your Windows path is `/mnt/c/Users/Dev Lad/Documents/GitHub/DIES/fabric-backend/chaincode-javascript`.

```bash
./network.sh deployCC -ccn evidence-contract -ccp "/mnt/c/Users/Dev Lad/Documents/GitHub/DIES/fabric-backend/chaincode-javascript/" -ccl javascript
```

## 4. Connect the Node.js Server
Once the network is running, Fabric generates cryptographic certificates. 
Copy the `organizations` folder from `fabric-samples/test-network/organizations` into `fabric-backend/crypto-config` in your DIES repository, so that the Node.js Server can authenticate.

Start the express server:
```cmd
cd server
npm start
```
The server will now authenticate and use the gateway utilizing Fabric's mTLS protocol.

> Note: If the backend cannot find the crypto certificates when it starts, it will gracefully fallback to a `SIMULATED` behavior so you can continue testing the frontend UI without starting Docker every time.
