---
marp: true
theme: default
paginate: true
header: 'DIES: Digital Evidence Integrity System'
footer: 'Project Presentation'
---

# Digital Evidence Integrity System (DIES)
**A Hyperledger Fabric-based Forensic Platform**

**Presenters:** [Your Name / Team]
**Date:** [Date]

---

## 1. Introduction
- **Digital Evidence** has become the cornerstone of modern law enforcement and forensic investigations.
- Its volatile nature makes it highly susceptible to tampering, accidental modification, and unauthorized access.
- **DIES** (Digital Evidence Integrity System) is a secure, enterprise-grade forensic platform.
- It leverages **Hyperledger Fabric** blockchain technology and cryptographic hashing (SHA-256, SHA-1, MD5) to establish an immutable chain of custody.

---

## 2. Problem Definition & Motivation
**Problem:**
- Traditional forensic storage systems rely on centralized databases (e.g., SQL), which are vulnerable to single points of failure, malicious insiders, and cyberattacks.
- Maintaining an auditable and undeniable Chain of Custody (CoC) across multiple agencies (police, forensics, judiciary) is difficult.

**Motivation:**
- Recent legal cases have been dismissed due to compromised digital evidence.
- A strong need exists for a framework that inherently prevents tampering and provides cryptographically verifiable proof of evidence integrity to satisfy the "beyond a reasonable doubt" judicial standard.

---

## 3. Aim & Objective
**Aim:**
To design and implement a secure, private, and distributed blockchain-based platform for managing digital evidence lifecycle from collection to courtroom presentation.

**Objectives:**
- **Immutable Chain of Custody:** Record every interaction (upload, transfer, analysis) permanently on the ledger.
- **Data Integrity:** Implement multi-hash fingerprinting to detect byte-level modifications.
- **Granular Access Control:** Enforce strict, transparent Role-Based Access Control (RBAC) dynamically across the entire platform.
- **Compliance & Auditing:** Provide NIST-compliant automated reports and verifiable transaction logs.

---

## 4. Literature Survey
| Traditional Systems | Public Blockchain (e.g., Ethereum) | Consortium Blockchain (DIES / Fabric) |
|---------------------|------------------------------------|---------------------------------------|
| Centralized DBs     | Highly decentralized               | Permissioned & Private                |
| Trust relying on IT administrators | Trust relies on consensus algorithms (PoW/PoS) | Trust established via Certificate Authorities (CA) |
| Single point of failure | High transaction costs (Gas fees) & Low throughput | **Zero gas fees**, High throughput, Strong privacy channels |
| Readily altered logs if breached | Open ledger (Privacy risks for sensitive cases) | Restricted access, confidential channels |

**Conclusion from Literature:** A permissioned blockchain (Hyperledger Fabric) is the optimal architecture for sensitive law enforcement data.

---

## 5. Proposed Method / Framework
**Architecture Components:**
1. **Frontend Client:** React.js integrated with secure dynamic routing and aesthetic UI.
2. **Backend Gateway:** Node.js / Express.js REST APIs enforcing strict authentication (JWT) and granular permission verification.
3. **Blockchain Network:** Hyperledger Fabric (Private Network) with smart contracts (Chaincode) managing the state of evidence.

**Workflow:**
- *Upload:* File is hashed locally (SHA-256, SHA-1, MD5). The file is stored securely while only hashes & metadata are committed to the ledger.
- *Tracking:* Custody transfers trigger new blockchain transactions, appending to the file's history.
- *Verification:* The system recalculates file hashes and compares them against the immutable ledger record.

---

## 6. Implementation Setup
**Environment Requirements:**
- **OS:** Windows Subsystem for Linux (WSL) / Ubuntu
- **Blockchain Core:** Docker Desktop, Hyperledger Fabric v2.x binaries
- **Server:** Node.js (v23), Express.js, Fabric-Network SDK
- **Frontend:** React, Vite, Bootstrap 5 Core

**Deployment Process:**
1. Spin up Fabric Test Network (`network.sh up createChannel`).
2. Deploy Smart Contract (`evidence-contract`).
3. Boot REST API gateway and connect to peer nodes via organizational wallets.
4. Launch the user dashboard for investigators.

---

## 7. Implementation Results
- **Dynamic RBAC Successfully Developed:** Shifted from static hardcoded roles to server-verified, granular functional privileges, hiding unpermitted UI components and protecting backend endpoints.
- **Cryptographic Anchoring:** File uploads successfully generate and store multi-hashes, producing verifiable transaction IDs directly from peer nodes.
- **Integrity Validation:** Zero-trust architecture verifies uploaded files in real-time, instantly flagging identical filenames that possess different encodings or manipulated contents.
- **Automated Case Generation:** Interactive detailed reports grouping evidence custody events for specific cases exist natively.

---

## 8. Comparative Analysis
| Feature | Legacy Forensic DB | DIES (Our Approach) |
|---------|--------------------|---------------------|
| **Immutability** | Low (DB Admins can alter records) | **High** (Cryptographic Ledger prevents alteration) |
| **Integrity Checks** | Manual / Scripted | **Automated** & Instantly verifiable |
| **Access Control** | Hardcoded UI bounds | **Dynamic**, End-to-End granular permissions |
| **Audit Trails** | Stored on the same vulnerable server | Distributed across endorsing peers |
| **Scalability** | High, but centralized risk | Decentralized, resilient architecture |

---

## 9. Conclusion and Future Work
**Conclusion:**
DIES successfully demonstrates that integrating Hyperledger Fabric into forensic workflows drastically improves the reliability and judicial admissibility of digital evidence. By removing the dependency on trust in a central administrator, the system provides an uncompromising chain of custody.

**Future Work:**
- Integration with external cloud storage (IPFS/AWS S3) for the actual preservation of large evidentiary files (videos, disk images).
- Implementing advanced privacy using Zero-Knowledge Proofs (ZKPs) for cross-agency collaborations without revealing raw data.
- Applying AI/ML algorithms to flag unusual custody transfers or potentially corrupted files preemptively.

---

## 10. References
1. Hyperledger Foundation. *Hyperledger Fabric Documentation.* https://hyperledger-fabric.readthedocs.io/
2. National Institute of Standards and Technology (NIST). *Guidelines on Mobile Device Forensics.*
3. [Insert Academic Paper 1 from your literature survey related to Blockchain in Digital Forensics]
4. [Insert Academic Paper 2 related to cryptographic hashing and security]
5. Nakamoto, S. *Bitcoin: A Peer-to-Peer Electronic Cash System.* (Foundational Blockchain Concepts).
