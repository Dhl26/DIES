# DIES: Digital Evidence Integrity System
**Presentation & Defense Cheat Sheet**

Use this document to prepare for your presentation. It breaks down the system's architecture, its real-world value, and expected questions your professor might ask (along with exactly how to answer them!).

---

## 🏗️ 1. High-Level Architecture
DIES is an enterprise-grade forensic platform designed to securely manage, authenticate, and track digital evidence using a decentralized ledger.

*   **Frontend (The Face):** Built using **React + Vite**. It provides a highly responsive, modern "dashboard" UI where officers and administrators log in, track cases, print reports, and upload files.
*   **Backend API (The Brain):** A **Node.js (Express)** server. When a file is uploaded, the backend temporarily holds it, computes its mathematical fingerprint (SHA-256), and securely saves the actual heavy file to a local storage server. 
*   **The Blockchain (The Vault):** A private, permissioned **Hyperledger Fabric** network running via Docker inside Linux (WSL2). The backend talks to this network to permanently anchor the file's hash and the uploader's identity.

---

## 📂 2. File Structure Breakdown
If your professor asks you to open your code editor and explain where everything lives, explain this structure:

```text
DIES/
 ├── client/                  <-- React.js Frontend
 │    ├── src/components/     <- Houses UI panels (Dashboard, EvidenceDetail, etc.)
 │    └── vite.config.ts      <- Build config for the user interface
 │
 ├── server/                  <-- Node.js Express Backend API
 │    ├── data/               <- Fast off-chain JSON NoSQL metadata cache
 │    ├── uploads/            <- Secure vault where actual heavy files (.zip, .mp4) sit in isolation
 │    ├── fabricContract.js   <- The "Bridge" file using Hyperledger gRPC to talk to the blockchain
 │    └── index.js            <- The REST API that handles auth and evidence orchestration
 │
 ├── fabric-backend/          <-- The Smart Contract Repository
 │    └── chaincode-javascript/
 │         └── lib/evidenceContract.js <- Contains exactly what is deployed into the Hyperledger Docker container
 │
 ├── setup_environment.bat    <-- 1-click script to install all Windows/WSL requirements
 └── start_project.bat        <-- 1-click script to boot up the entire stack seamlessly
```

---

## 🔥 2. Core Features You Must Highlight
When presenting, make sure you show off these features:
1.  **Immutable Chain of Custody:** Show them the "Custody Tab". Emphasize that *every* action (downloading, changing status to "Court Ready", adding a note) records an immutable log. 
2.  **Live Integrity Verification:** Upload a file, process it, and click **"Run Integrity Check"**. Explain that the app is mathematically proving the file on the server perfectly matches the anchor tag on the blockchain.
3.  **Role-Based Access (RBAC):** Show that an "Evidence Custodian" has different permissions than an "Admin". This mimics real-world police departments.
4.  **Instant Reporting:** Show the "Generate Report" feature which prepares a clean document proving the file is court-admissible.

---

## ❓ 3. Expected Professor Questions & Answers

### Q: Why did you use Blockchain for this? Why not just a normal SQL database?
**Your Answer:** "Traditional databases can be hacked, altered, or manipulated by a rogue database administrator (like a corrupt officer erasing a case file). Blockchain solves this by creating an **immutable** ledger. Once an evidence hash is committed to a block, it is cryptographically sealed forever. It provides absolute, irrefutable proof to a judge that the file hasn't been tampered with since the exact second it was uploaded."

### Q: Why did you choose "Hyperledger Fabric" instead of Ethereum or Bitcoin?
**Your Answer:** "Hyperledger Fabric is designed specifically for enterprise environments. 
1. **Privacy:** Unlike public networks like Ethereum where anyone can see the data, Fabric is *permissioned*. Only authorized agencies can join the network.
2. **No Gas Fees:** We don't have to pay cryptocurrency just to upload a mugshot.
3. **Identity:** Fabric uses Certificate Authorities (CAs). Every transaction is cryptographically signed by a specific, known officer's identity so we have true accountability."

### Q: Are you storing the actual evidence files directly ON the blockchain? Exactly how and where is the data stored?
**Your Answer:** "No, storing heavy multimedia files on a blockchain is anti-pattern because it causes massive chain-bloat and kills network speed. We use a **Hybrid Storage Architecture** split into three layers:
1. **The Physical File (Off-Chain):** The actual heavy JPEG, MP4, or PCAP file is saved securely on the Node.js file system inside the `server/uploads` directory.
2. **The Fast Cache (JSON):** Basic relational data (like case numbers, basic tags, and categories) is saved in a fast NoSQL-style JSON registry (`server/data/evidence.json`). This allows for lightning-fast search bars and filtering without querying the heavy blockchain.
3. **The Cryptographic Proof (On-Chain):** We ONLY store the **SHA-256 Hash Fingerprint**, the upload timestamp, and the Officer's digital certificate permanently inside the Hyperledger Fabric ledger running in our WSL Docker containers."

### Q: How does the data get from the storage to the React Frontend?
**Your Answer:** "When the React Frontend loads the Evidence Dashboard, it fires an asynchronous HTTP `GET` request using the browser's `fetch` API to our Node.js Express Backend. 
The backend acts as an orchestrator: It rapidly pulls the search metadata from the JSON registry, then securely interfaces with the Hyperledger network via the `fabric-gateway` gRPC API to attach the cryptographic anchor proofs. Finally, it ships a single, unified JSON payload back to React, which dynamically hydrates the UI components."

### Q: How was the Smart Contract actually built and how does it execute?
**Your Answer:** "In Hyperledger, smart contracts are called **Chaincode**. I wrote ours securely in JavaScript using the `fabric-contract-api`. 
Instead of running openly on the internet like Ethereum, our Chaincode is physically packaged and deployed by our administrator script directly into the peer nodes. When the Hyperledger network starts, it spins up isolated, secure **Docker Containers** whose *only* job is to execute this Javascript logic. 
In the code, whenever I call `ctx.stub.putState()`, it mathematically seals the JSON data into a binary buffer and permanently commits it to the Hyperledger World State Database."

### Q: How exactly does the "Integrity Check" button work technically?
**Your Answer:** "When I click that button, three things happen instantly:
1. The Node.js server grabs the local physical file from the hard drive.
2. It recalculates the file's SHA-256 hash completely from scratch.
3. It sends a secure query to the Hyperledger Smart Contract (`chaincode`) asking for the original hash submitted on day one. 
If the newly calculated hash perfectly matches the blockchain hash, it means not a single pixel or byte of the file has been altered. If a hacker changed one pixel of the image, the hashes would be completely different, and the system would instantly flag it as compromised."

### Q: What compliance standards did you consider?
**Your Answer:** "The platform was built with **NIST IR 8387** guidelines in mind. It uses multi-algorithm cryptographic hashing (SHA-256 as the primary, accompanied by SHA-1 and MD5 to prevent collision attacks) to ensure strict digital evidence authenticity."

---

## 🚀 4. Presentation Pro-Tips
*   **The "Wow" Moment:** Don't just show them the dashboard. *Prove* it works. Mention that you have a script running native WSL bridging Hyperledger smoothly directly to Windows!
*   **Simulate a Hack (Optional but highly recommended if you want an A+):** 
    1. Upload an image. 
    2. Show the Integrity Check passes successfully.
    3. Manually go into the backend `data/uploads` folder and change *one word* in a text file or alter a byte. 
    4. Click "Run Integrity Check" again in front of the professor. It will instantly flash red and say "INTEGRITY VIOLATION DETECTED". This proves the blockchain is actively protecting the data!
