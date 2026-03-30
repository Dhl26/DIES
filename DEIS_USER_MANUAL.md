# DEIS: Digital Evidence Integrity System
**Comprehensive FSL Operations Manual**

## 1. What is DEIS?
The **Digital Evidence Integrity System (DEIS)** is a next-generation platform custom-built for Forensic Science Laboratories (FSL). It digitizes the traditionally manual, paper-based procedure of handing over physical or digital evidence from law enforcement (Police) to the forensic laboratory. 

At its core, DEIS integrates a **Private Blockchain (Ethereum/Hardhat)** to ensure that every sequence of evidence handling is mathematically verifiable, tamper-proof, and legally sound.

## 2. What Problems Does DEIS Solve?
* **Elimination of Paper Trails:** Replaces fragile carbon-copy forms (Case Acceptance / Case Opening Sheets) with a streamlined digital intake wizard.
* **Immutable Chain of Custody:** Paper logs can be altered; blockchain cannot. Every time an evidence file changes hands, its status is updated, or it gets analyzed, a permanent cryptographic timestamp is added to the ledger ensuring absolute accountability.
* **Evidence Tampering & Integrity:** By instantly computing multi-algorithm hashes (SHA-256, SHA-1, MD5) upon intake, DEIS mathematically guarantees that a digital artifact presented in court is the *exact same file* as the one handed over by the police on day one.
* **Automated Traceability:** Removes the risk of orphaned evidence by enforcing strict linking between evidence hashes and their respective police FIR identifiers.

---

## 3. The Digital Forensic Workflow in DEIS
DEIS strictly enforces the industry-standard **7-Step Digital Forensic Investigation Methodology**:

1. **Identification & Legal Authorization:** Investigation begins when Police physically hand over evidence to the FSL along with legal backing (Forwarding Authority details, FIR numbers, Officer ID).
2. **Preservation (Case Intake):** The FSL Receptionist uses the **Case Intake** tool to register the evidence. A digital fingerprint (hash) is generated and locked into the blockchain, preserving its initial state forever. An internal FSL Case is automatically generated based on the FIR Number provided by police.
3. **Acquisition (Evidence Ledger):** Evidence is securely stored on the FSL servers and mirrored on the ledger with its associated tags, categorizations, and checklists.
4. **Forensic Analysis:** Forensic Analysts check the evidence out of the ledger, verify its hashes using the **Verify Evidence** tool to prove it hasn't degraded, and conduct their analysis while logging findings in the **Evidence Notes**.
5. **Documentation & Presentation:** Once analysis is complete, DEIS auto-generates a NIST-compliant **Forensic Integrity Report**. This court-ready document outlines the original hash, the full Chain of Custody, and analytical notes.

---

## 4. How to Use the System
### Getting Started
1. Run the `start_project.bat` script on your desktop. This launches the local Blockchain Node, deploys the Smart Contracts, starts the Backend Database API, and boots up the Frontend.
2. Open your browser and navigate to `http://localhost:5173`.
3. **Register/Login:** Create a new user account with a specific system role to begin.

### Module Breakdown
* **Case Intake:** Used strictly when receiving evidence from police. Fill out the "Police Evidence Handover" wizard, attaching the digital artifact and FIR details. Clicking submit registers it to the blockchain and auto-creates the case.
* **Dashboard:** A real-time overview of FSL statistics, active cases, and a feed of recent organizational activity. 
* **Evidence Ledger:** The central repository. Use this to search and track all evidence inside the laboratory. Click "View Details" to see the Chain of Custody graph, add notes, or change the item's state (e.g., from *Processing* to *Analyzed*).
* **Verify:** A drag-and-drop authenticity tool. Drop any file here to immediately check if its current cryptographic hash matches the one originally placed on the blockchain. 
* **Case Management:** View automatically generated FSL cases (organized by Police FIR number), oversee linked evidence, and close/reopen investigations.
* **Audit (Admin Only):** A read-only, NIST-compliant trail monitoring every single action, login, and read/write event across the entire system.

---

## 5. User Roles and Accessibility
DEIS uses strict Role-Based Access Control (RBAC) to ensure principle-of-least-privilege operations:

| Role | Primary Responsibilities & Access Levels |
| :--- | :--- |
| **Admin** | Full system oversight. Can view the Audit Log, manage cases, register evidence, and override statuses. *Has access to all modules.* |
| **Evidence Technician** | Focuses on intake and storage. Can use **Case Intake** to register evidence, verify hashes, and update evidence statuses (e.g., *Archived*, *Released*). Cannot conduct deeper analytical reporting. |
| **Forensic Analyst** | Focuses strictly on investigation. Cannot upload new evidence (intake). Can view the Ledger, Verify hashes, update statuses (e.g., *Analyzed*), add analytical notes, and generate Final Reports. |
| **Case Agent** | The lead investigator overseeing the whole case. Has broad access to Case Intake, Case Management, Evidence Ledger, and Report Generation. |
| **Transportation** | Handles physical movement of drives/devices. Limited to Ledger viewing, Verify, and appending "Custody Events" to the evidence timeline. |
| **Legal** | Read-only capacity for court preparation. Can access the Ledger, Verify evidence integrity, and securely download the final Forensic Integrity Reports for presentation. Cannot alter evidence states or notes. |
