# DEIS - Digital Evidence Investigation System

DEIS is a decentralized, secure digital evidence management platform that leverages **Hyperledger Fabric** to ensure an immutable, tamper-proof chain of custody for forensic data. 

## 🏗️ Project Architecture
- **Client**: React + Vite + Tailwind/Bootstrap frontend for investigators and admins.
- **Server**: Node.js + Express backend that interfaces directly with Hyperledger.
- **Fabric Backend**: Contains the private, permissioned Hyperledger chaincode deployed via Docker.

---

## 🚀 Complete Startup Guide (Windows & WSL2)

Because the Hyperledger Fabric nodes run in Docker on Linux, the entire stack should be started natively inside a **WSL2 (Ubuntu)** terminal to avoid pathing and network conflicts.

### Prerequisites (Inside WSL)
1. Ensure **Docker Desktop** is running on Windows and **WSL Integration** is turned ON for your Ubuntu distro.
2. Ensure you have **Node.js 18+** installed directly inside WSL using NVM (not Windows Node).
3. Ensure `jq` is installed: `sudo apt install jq`

### Step 1: Fix Cross-Platform Pathing Issues
Fabric scripts notoriously fail when paths contain spaces (like `/mnt/c/Users/Dev Lad/`). Create a symlink in your WSL home folder to bypass this:
```bash
# Run this once in your WSL terminal
ln -s "/mnt/c/Users/Dev Lad/Documents/GitHub/DIES" ~/DIES
```

### Step 2: Start the Hyperledger Network
Navigate to your `test-network` directory inside `fabric-samples` and bring up the network smoothly:
```bash
# Clean up any broken state from previous runs
./network.sh down

# Bring up the network, CAs, and create the channel
./network.sh up createChannel -c mychannel -ca

# If you get a docker build error "No such image: hyperledger/fabric-nodeenv:2.5", run:
# docker pull hyperledger/fabric-nodeenv:2.5

# Deploy the chaincode (Using the un-spaced symlink path!)
./network.sh deployCC -ccn evidence-contract -ccp ~/DIES/fabric-backend/chaincode-javascript/ -ccl javascript
```

### Step 3: Start the Backend Server
Once the blockchain chaincode is successfully deployed, start the Node server. Open a new WSL terminal tab:
```bash
cd ~/DIES/server
npm install
npm start
```
*The backend should connect to the Hyperledger Gateway over port 7051.*

### Step 4: Start the Frontend UI
With the backend running, open one more WSL terminal tab to launch the React interface:
```bash
cd ~/DIES/client
npm install
npm run dev
```

You can now open `http://localhost:5173` in your Windows browser. The Dashboard will show **"Hyperledger Fabric is connected"**, meaning any evidence you now register will be securely audited on-chain!

---

## 🔍 How Integrity Verification Works
1. **Upload Original:** A file uploaded through the UI is hashed (SHA-256) on the client side. This hash fingerprint is passed to the server and permanently logged to the Hyperledger ledger.
2. **Verify Later:** To verify if a file has been tampered with, drag & drop it into the Verification page. The system re-hashes it and queries the `getEvidence` smart contract. 
3. **Immutable Rule:** Even a 1-byte alteration visually alters the hash. If the hashes don't match, the blockchain will definitively reject it.
