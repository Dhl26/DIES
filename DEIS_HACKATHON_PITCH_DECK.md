---
marp: true
theme: default
class: lead
backgroundColor: #f8fafc
color: #0f172a
---

# 🛡️ DEIS
### Digital Evidence Integrity System
**Next-Generation Blockchain Platform for Forensic Laboratories**

---

## 📉 The Problem
Forensic Science Laboratories (FSLs) and Law Enforcement suffer from outdated systems:
- 📄 **Paper-based fragility:** Case Opening and Handover forms are manual, easily lost, and prone to human error.
- 🔓 **Data Tampering Risks:** Digital evidence (mobile dumps, drives) is vulnerable to unauthorized modification during transit or analysis.
- ⚖️ **Legal Inadmissibility:** A broken "Chain of Custody" can cause critical evidence to be thrown out of court.

---

## 💡 The Solution: DEIS
**DEIS** completely digitizes the evidence lifecycle, establishing a mathematically verifiable, tamper-proof Chain of Custody using blockchain technology.

1. **Digital Handover:** Police officers securely transfer evidence through a digital wizard, replacing paper forms.
2. **Instant Preservation:** The system automatically generates multi-algorithm hashes (SHA-256) of the initial evidence.
3. **Immutable Ledger:** Every state change, hash, and custody transfer is permanently locked via Ethereum Smart Contracts.

---

## ⚙️ Key Features
- **NIST-Compliant Hashing:** Multi-algorithm verification (SHA-256, SHA-1, MD5) ensures absolute mathematical integrity.
- **Smart Contract Auditing:** Every action (Intake, Processing, Viewing) is recorded as a transaction on a Private Hardhat / Ethereum Blockchain.
- **Role-Based Access Control (RBAC):** Strict permissions. (e.g., *Forensic Analysts* can analyze but not intake; *Legal Reps* have read-only views).
- **Auto-Generated Court Reports:** Instantly generate NIST-compliant Forensic Integrity Reports to present to judges.

---

## 🏗️ Architecture & Tech Stack

**Frontend (Client):**
- React.js + Vite (Lightning fast)
- Tailwind CSS (Clean, FSL-compliant UI)
- Ethers.js (Blockchain Interaction)

**Backend (Server & Ledger):**
- Node.js + Express
- Solidity (Ethereum Smart Contracts)
- Hardhat (Local Private Blockchain Node)
- JSON Persistence + Cryptographic Hashing Engine

---

## 🔄 The Investigative Workflow
DEIS natively enforces the standard 7-Step Digital Forensic Workflow:

1. **Identification / Legal Auth:** Police initiate FIRs.
2. **Preservation:** FSL Reception runs intake, auto-hashing to the blockchain.
3. **Collection:** DEIS auto-generates the central organizational case.
4. **Analysis:** Techs verify hashes in DEIS before starting analysis.
5. **Presentation:** DEIS generates the immutable court report.

---

## 🚀 Impact & Value Proposition
- **100% Assurance:** Impossible to secretly alter or manipulate evidence files once registered.
- **Drastic Time Reduction:** Eradicates paperwork delays; tracks investigations instantly.
- **Courtroom Ready:** Provides undeniable, cryptographic proof of authenticity for every piece of digital evidence.

---

## 🔮 Future Roadmap
- **Hyperledger / Polygon Edge Migration:** Move from local Hardhat to enterprise-grade consortia blockchains.
- **Direct Device Integration:** Automated ingest pipelines directly from forensic hardware (Cellebrite/Magnet).
- **AI-Assisted Summaries:** Auto-summarizing analysis notes for extremely complex cyber investigations.

---

# ⚖️ Thank You!
**Empowering Justice through Immutable Cryptography.**
*(Ready for Live Demo)*
