# DEIS — Digital Evidence Integrity System

## Project Documentation v2.0

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution Architecture](#3-solution-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [System Architecture Diagram](#6-system-architecture-diagram)
7. [Blockchain Layer](#7-blockchain-layer)
8. [Backend Server](#8-backend-server)
9. [Frontend Application](#9-frontend-application)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Evidence Lifecycle Workflow](#11-evidence-lifecycle-workflow)
12. [Chain of Custody](#12-chain-of-custody)
13. [Multi-Hash Integrity Verification](#13-multi-hash-integrity-verification)
14. [Case Management](#14-case-management)
15. [Audit Logging](#15-audit-logging)
16. [Forensic Report Generation](#16-forensic-report-generation)
17. [API Reference](#17-api-reference)
18. [Data Models](#18-data-models)
19. [Security Model](#19-security-model)
20. [How To Run](#20-how-to-run)
21. [End-to-End Testing](#21-end-to-end-testing)
22. [Standards Compliance](#22-standards-compliance)
23. [Future Enhancements](#23-future-enhancements)

---

## 1. Project Overview

**DEIS (Digital Evidence Integrity System)** is a full-stack, blockchain-powered digital forensic evidence management platform. It enables law enforcement agencies, forensic laboratories, and legal teams to securely upload, store, track, verify, and manage digital evidence with a tamper-proof chain of custody.

Every piece of evidence uploaded to DEIS is:

- **Fingerprinted** with three cryptographic hash algorithms (SHA-256, SHA-1, MD5)
- **Registered on a blockchain** — creating an immutable, timestamped record
- **Stored on disk** for secure download and retrieval
- **Tracked** through a complete chain of custody from collection to court
- **Audited** — every system action is logged for NIST compliance

### Key Capabilities

| Capability | Description |
|---|---|
| **Evidence Registration** | Upload files and register their cryptographic fingerprint on blockchain |
| **Multi-Hash Verification** | SHA-256 + SHA-1 + MD5 computed for every file |
| **Chain of Custody** | Every transfer, examination, and access is recorded |
| **Case Management** | Create investigation cases and link evidence to them |
| **Evidence Workflow** | 6-stage lifecycle: Collected → Processing → Analyzed → Court-Ready → Archived → Released |
| **Integrity Re-verification** | On-demand re-hash to detect any tampering of stored files |
| **Forensic Reports** | Generate NIST/ISO compliant integrity reports |
| **Audit Trail** | Complete log of every action in the system |
| **Role-Based Access** | 7 forensic roles with granular permissions |
| **Public Verification** | Anyone can verify evidence integrity without login |

---

## 2. Problem Statement

Digital evidence in criminal investigations faces critical challenges:

1. **Integrity**: How do you prove a file hasn't been altered since collection?
2. **Chain of Custody**: Who handled the evidence, when, and why?
3. **Admissibility**: Courts require documented, unbroken custody chains
4. **Accountability**: Every access to evidence must be traceable
5. **Centralized Risk**: Traditional databases can be altered by administrators

### How DEIS Solves These

| Problem | DEIS Solution |
|---|---|
| Integrity concerns | Blockchain-immutable hash + multi-algorithm verification |
| Broken custody chains | Every action auto-logged with timestamps and user identity |
| Court admissibility | NIST IR 8387 / ISO 27037 compliant forensic reports |
| Unauthorized access | JWT authentication + role-based access control |
| Database tampering | Blockchain records are immutable — no one can alter them |

---

## 3. Solution Architecture

DEIS uses a **three-tier architecture**:

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  Dashboard │ Evidence Ledger │ Upload │ Verify │ Cases │ Audit  │
│                     Port 5173 (Vite)                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTP REST API
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                 │
│  Auth │ Evidence CRUD │ Custody │ Cases │ Reports │ Audit Log   │
│                      Port 3001                                  │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  JSON Files   │    │  File System  │    │  Blockchain RPC  │  │
│  │  (data/*.json)│    │  (uploads/)   │    │  (ethers.js)     │  │
│  └──────────────┘    └──────────────┘    └──────┬───────────┘  │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │ JSON-RPC
                                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN (Hardhat Local Node)                │
│             EvidenceRegistry Smart Contract (Solidity)           │
│                      Port 8545 (Chain ID: 1337)                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Evidence Mapping: fileHash → Evidence struct              │ │
│  │  Custody Tree: nodeId → CustodyNode struct                 │ │
│  │  Events: EvidenceRegistered, CustodyEventAdded             │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow for Evidence Upload

```
User drops file in browser
        │
        ▼
[Browser] SHA-256 hash computed client-side (preview)
        │
        ▼
[Backend] File received via multipart upload
        │
        ├── Compute SHA-256, SHA-1, MD5 (server-side)
        ├── Save file to disk (uploads/<sha256>.<ext>)
        ├── Call smart contract: registerEvidence(hash, metadata)
        │       └── Contract creates Evidence struct + root CustodyNode
        ├── Save to local registry (data/evidence.json)
        ├── Log to audit trail (data/audit-log.json)
        │
        ▼
[Response] Evidence hash + transaction hash + multi-hashes returned
```

---

## 4. Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.x | UI component framework |
| **React Router DOM** | 6.x | Client-side routing and navigation |
| **Tailwind CSS** | 3.x | Utility-first CSS styling |
| **Vite** | 5.x | Development server and build tool |
| **Web Crypto API** | Native | Client-side SHA-256 hash computation |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 5.x | HTTP server framework |
| **ethers.js** | 5.7.2 | Blockchain interaction (JSON-RPC) |
| **jsonwebtoken** | 9.x | JWT token generation and verification |
| **bcryptjs** | 3.x | Password hashing with salt |
| **multer** | 2.x | Multipart file upload handling |
| **crypto** (built-in) | Node.js | SHA-256, SHA-1, MD5 hash computation |
| **cors** | 2.x | Cross-Origin Resource Sharing |
| **dotenv** | 16.x | Environment variable management |

### Blockchain

| Technology | Version | Purpose |
|---|---|---|
| **Solidity** | 0.8.19 | Smart contract programming language |
| **Hardhat** | 2.22.x | Ethereum development environment |
| **@nomicfoundation/hardhat-toolbox** | 5.x | Hardhat plugins (testing, deployment) |

### Data Storage

| Storage | Location | Purpose |
|---|---|---|
| **users.json** | `server/data/` | User accounts (hashed passwords) |
| **evidence.json** | `server/data/` | Evidence registry with custody logs |
| **cases.json** | `server/data/` | Investigation case records |
| **audit-log.json** | `server/data/` | Complete system activity log |
| **uploads/** | `server/uploads/` | Actual evidence files stored on disk |
| **Blockchain** | In-memory (Hardhat) | Immutable evidence hashes and custody tree |

---

## 5. Project Structure

```
DEIS/
├── blockchain/                      # Ethereum blockchain layer
│   ├── contracts/
│   │   └── EvidenceRegistry.sol     # Smart contract (113 lines)
│   ├── scripts/
│   │   └── deploy.js               # Deployment script
│   ├── artifacts/                   # Compiled contract ABI
│   ├── hardhat.config.js            # Hardhat configuration
│   └── package.json                 # Blockchain dependencies
│
├── server/                          # Backend REST API
│   ├── index.js                     # Main server (751 lines, 20+ endpoints)
│   ├── abi.json                     # Contract ABI (copied from artifacts)
│   ├── .env                         # Environment variables
│   ├── package.json                 # Server dependencies
│   ├── data/                        # JSON-based persistence
│   │   ├── users.json               # User accounts
│   │   ├── evidence.json            # Evidence registry
│   │   ├── cases.json               # Investigation cases
│   │   └── audit-log.json           # Activity audit trail
│   ├── uploads/                     # Stored evidence files
│   └── test_e2e.js                  # Comprehensive E2E test suite (27 tests)
│
└── client/                          # Frontend React application
    ├── src/
    │   ├── App.jsx                  # Router, navbar, layout
    │   ├── main.tsx                 # React entry point
    │   ├── index.css                # Global styles + Tailwind
    │   ├── context/
    │   │   └── AuthContext.jsx      # Authentication state management
    │   └── components/
    │       ├── Login.jsx            # Login page
    │       ├── Register.jsx         # Registration page (with role)
    │       ├── Dashboard.jsx        # Analytics dashboard
    │       ├── UploadEvidence.jsx   # Evidence upload with drag & drop
    │       ├── EvidenceLedger.jsx   # Evidence list with filtering
    │       ├── EvidenceDetail.jsx   # Full evidence view + actions
    │       ├── VerifyEvidence.jsx   # Public hash verification
    │       ├── CaseManagement.jsx   # Case CRUD operations
    │       └── AuditLog.jsx         # System activity log (Admin)
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.ts
    └── package.json
```

---

## 6. System Architecture Diagram

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                          USER (Web Browser)                            │
  │                                                                         │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
  │  │ Dashboard│ │ Evidence │ │  Upload  │ │  Verify  │ │  Cases   │    │
  │  │          │ │  Ledger  │ │          │ │          │ │          │    │
  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
  │       │            │            │            │            │            │
  └───────┼────────────┼────────────┼────────────┼────────────┼────────────┘
          │            │            │            │            │
          ▼            ▼            ▼            ▼            ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     EXPRESS.JS BACKEND (Port 3001)                      │
  │                                                                         │
  │  ┌──────────────────────────────────────────────────────────────────┐  │
  │  │                      MIDDLEWARE LAYER                            │  │
  │  │  CORS → JSON Parser → JWT Auth → Role Authorization             │  │
  │  └──────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
  │  │  Auth    │ │ Evidence │ │ Custody  │ │  Cases   │ │  Audit   │    │
  │  │ Routes   │ │  CRUD    │ │  Events  │ │  CRUD    │ │   Log    │    │
  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    │
  │       │            │            │            │            │            │
  │  ┌────▼────────────▼────────────▼────────────▼────────────▼────────┐  │
  │  │                      DATA ACCESS LAYER                          │  │
  │  │                                                                  │  │
  │  │  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐    │  │
  │  │  │ JSON Files │  │  File I/O  │  │  ethers.js → Contract  │    │  │
  │  │  │ (data/*.json│  │ (uploads/) │  │  (Blockchain RPC)     │    │  │
  │  │  └────────────┘  └────────────┘  └───────────┬────────────┘    │  │
  │  └──────────────────────────────────────────────┼──────────────────┘  │
  └─────────────────────────────────────────────────┼──────────────────────┘
                                                    │
                                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                   HARDHAT LOCAL BLOCKCHAIN (Port 8545)                  │
  │                                                                         │
  │  ┌──────────────────────────────────────────────────────────────────┐  │
  │  │              EvidenceRegistry Smart Contract                     │  │
  │  │                                                                  │  │
  │  │  ┌───────────────────┐    ┌───────────────────────────┐        │  │
  │  │  │  Evidence Struct  │    │    CustodyNode Struct     │        │  │
  │  │  │  ──────────────── │    │    ────────────────────── │        │  │
  │  │  │  fileHash         │    │    id (bytes32)           │        │  │
  │  │  │  uploader (addr)  │    │    parentId (bytes32)     │        │  │
  │  │  │  timestamp        │    │    holder (addr)          │        │  │
  │  │  │  metadata         │    │    action (string)        │        │  │
  │  │  │  rootCustodyNodeId│───▶│    timestamp              │        │  │
  │  │  └───────────────────┘    │    metadata               │        │  │
  │  │                           └───────────────────────────┘        │  │
  │  │                                                                  │  │
  │  │  Functions:                                                      │  │
  │  │   • registerEvidence(hash, metadata) → creates Evidence + root  │  │
  │  │   • addCustodyEvent(parentId, action, metadata) → adds node     │  │
  │  │   • getEvidence(hash) → returns Evidence struct                 │  │
  │  │   • getCustodyChain(nodeId) → returns full chain (linked list)  │  │
  │  │   • getCustodyNode(nodeId) → returns single node                │  │
  │  └──────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Blockchain Layer

### Smart Contract: `EvidenceRegistry.sol`

The smart contract is the **immutable backbone** of DEIS. Once evidence is registered on the blockchain, its record **cannot be altered, deleted, or tampered with** by anyone — not even the system administrator.

#### Structs

```solidity
struct Evidence {
    string fileHash;              // SHA-256 hash of the file
    address uploader;             // Ethereum address that registered it
    uint256 timestamp;            // Block timestamp of registration
    string metadata;              // Description + uploader info
    bytes32 rootCustodyNodeId;    // Points to first custody node
}

struct CustodyNode {
    bytes32 id;                   // Unique identifier
    bytes32 parentId;             // Link to parent node (linked list)
    address holder;               // Who performed the action
    string action;                // What happened (UPLOAD, TRANSFERRED, etc.)
    uint256 timestamp;            // When it happened
    string metadata;              // Additional details
}
```

#### Functions

| Function | Description |
|---|---|
| `registerEvidence(hash, metadata)` | Registers new evidence; creates root custody node; emits `EvidenceRegistered` event |
| `addCustodyEvent(parentId, action, metadata)` | Appends a new custody node to the linked list; emits `CustodyEventAdded` event |
| `getEvidence(hash)` | Returns the Evidence struct for a given file hash |
| `getCustodyChain(nodeId)` | Traverses the linked list and returns the complete custody chain |
| `getCustodyNode(nodeId)` | Returns a single custody node |

#### How the Custody Tree Works

The custody chain is implemented as a **linked list** on-chain:

```
[Root Node: INITIAL_UPLOAD]
       ▲
       │ parentId
[Node: TRANSFERRED]
       ▲
       │ parentId
[Node: EXAMINED]
       ▲
       │ parentId
[Node: COURT_SUBMITTED]
```

Each new custody event creates a node that points back to its parent, forming an unbreakable chain. `getCustodyChain()` traverses from any node back to the root, returning the complete history.

#### Events

```solidity
event EvidenceRegistered(string indexed fileHash, address indexed uploader, uint256 timestamp);
event CustodyEventAdded(bytes32 indexed nodeId, bytes32 indexed parentId, string action, address holder);
```

These events create searchable, indexed logs on the blockchain that can be queried by external systems.

#### Deployment

The contract is deployed to a **Hardhat local blockchain** (Chain ID 1337) using the deployment script:

```javascript
const EvidenceRegistry = await hre.ethers.getContractFactory("EvidenceRegistry");
const evidenceRegistry = await EvidenceRegistry.deploy();
await evidenceRegistry.waitForDeployment();
```

The deployed contract address is saved to the server's `.env` file as `CONTRACT_ADDRESS`.

---

## 8. Backend Server

### Overview

The backend (`server/index.js`, 751 lines) is the central hub that:

1. Handles user authentication (JWT)
2. Processes file uploads and computes multi-hashes
3. Communicates with the blockchain via ethers.js
4. Manages the local evidence registry, cases, and audit log
5. Serves evidence files for download
6. Generates forensic reports

### Server Boot Sequence

```
1. Load environment variables (.env)
2. Initialize Express with CORS and JSON middleware
3. Create uploads/ and data/ directories if missing
4. Connect to Hardhat blockchain via JSON-RPC (localhost:8545)
5. Load contract ABI and create ethers.js Contract instance
6. Migrate any legacy data files to data/ directory
7. Register all API routes
8. Start listening on port 3001
```

### Middleware Pipeline

Every request passes through this pipeline:

```
Request → CORS → JSON Parser → [Route Handler]
                                      │
                                      ├── Public routes: /verify, /enums, /register, /login
                                      │
                                      └── Protected routes: authenticate → authorize → handler
                                              │                    │
                                              │                    └── Check user role
                                              └── Verify JWT token
```

### Key Features

#### Multi-Hash Computation

```javascript
const computeHashes = (buffer) => ({
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    sha1:   crypto.createHash('sha1').update(buffer).digest('hex'),
    md5:    crypto.createHash('md5').update(buffer).digest('hex'),
});
```

Three NIST-approved algorithms are applied to every file. This provides:
- **SHA-256**: Primary integrity hash (stored on blockchain)
- **SHA-1**: Secondary verification
- **MD5**: Legacy compatibility and quick comparison

#### File Storage

Evidence files are saved to `server/uploads/` using their SHA-256 hash as the filename:

```
uploads/
├── a3f2e8b1c9d4...7e2f.jpg    (SHA-256 hash + original extension)
├── 8b1ca3f2e9d4...f2e7.pdf
└── c9d4a3f2e8b1...2f7e.txt
```

This ensures:
- No duplicate files (same hash = same filename)
- Files are findable by their integrity fingerprint
- Original file extension is preserved for correct MIME type

---

## 9. Frontend Application

### Pages and Components

#### 1. Login (`/login`)

- Username + password authentication
- JWT token stored in `localStorage`
- Role returned from server and stored for UI permissions
- Redirect to Dashboard on success

#### 2. Register (`/register`)

- Username, password, role selection
- Dropdown with all 7 forensic roles
- Password minimum length: 6 characters
- Prevents duplicate usernames

#### 3. Dashboard (`/dashboard`)

The main hub showing:

- **Welcome banner** with role-specific color gradient
- **Stats row**: Total evidence, active cases, total cases, users, blockchain status
- **Evidence breakdown**: Visual progress bars by status (Collected, Processing, etc.) and by category (Photo, Video, Document, etc.)
- **Quick Actions**: Context-aware cards based on user role permissions
- **Recent Activity**: Live feed from the audit log
- **Restricted section**: Shows actions the user's role cannot access

#### 4. Upload Evidence (`/upload`)

- **Drag & drop zone** with visual feedback
- **Client-side hash preview**: SHA-256 computed in browser using Web Crypto API before upload
- **Case selector**: Link evidence to an existing investigation case
- **Category picker**: 10 categories (Photo, Video, Document, Device Image, Network Capture, Audio, Database, Email, Mobile Data, Other)
- **Tags input**: Comma-separated tags for searchability
- **Metadata field**: Free-text description of the evidence
- **Result card**: Shows multi-hash fingerprints (SHA-256, SHA-1, MD5) and blockchain transaction hash

#### 5. Evidence Ledger (`/ledger`)

- **Search**: Filter by filename, hash, uploader, metadata, or tags
- **Status filter**: Dropdown for Collected, Processing, Analyzed, Court-Ready, Archived, Released
- **Category filter**: Filter by evidence type
- **Case filter**: URL parameter `?case=<id>` to show only evidence linked to a specific case
- **Evidence cards**: File icon (by MIME type), status badge, category tag, custody event count, upload info
- **Click-through**: Each card links to the full Evidence Detail page

#### 6. Evidence Detail (`/evidence/:hash`)

The most feature-rich page, containing:

- **Header card**: File name, size, status badge, category, download button, integrity check button, report button
- **Info grid**: Uploader, role, date, blockchain verification status, custody event count
- **Integrity result**: Per-algorithm (SHA-256/SHA-1/MD5) match/mismatch indicators
- **Status workflow**: Clickable status buttons to advance through the 6-stage lifecycle
- **Case linking**: Dropdown to link/unlink evidence from investigation cases
- **Multi-hash display**: All three hash values displayed with copy functionality
- **Tags display**: All tags shown as pills
- **Three-tab interface**:
  - **Custody tab**: Full chain of custody timeline with action icons, timestamps, user info, and notes
  - **Notes tab**: Collaborative notes system — add observations, see who wrote what and when
  - **Report tab**: Generate and view NIST IR 8387 / ISO 27037 compliant forensic integrity report with JSON export

#### 7. Verify Evidence (`/verify`)

- **Public page** — no login required
- **File drop zone**: Drag a file to automatically compute its SHA-256 hash
- **Manual hash entry**: Paste a known hash to verify
- **Results**: Shows blockchain verification status, uploader address, timestamp, local registry data (filename, size, status, tags), and a preview of the custody chain

#### 8. Case Management (`/cases`)

- **Create cases**: Title, case number, description, priority (Low/Medium/High/Critical)
- **Case list**: Shows case number, title, priority badge, status (Open/Closed), evidence count, creator
- **Open/Close toggle**: Case Agents and Admins can close or reopen cases
- **View Evidence**: Link to Evidence Ledger filtered by that case

#### 9. Audit Log (`/audit`)

- **Admin-only** page
- **Complete activity log**: Every action in the system
- **Action type icons**: Visual icons for upload, login, download, custody, integrity check, etc.
- **Filtering**: Search by action type or username
- **Details**: Evidence hash snippets, case links, blockchain transaction confirmations

### Frontend State Management

Authentication state is managed via React Context:

```
AuthContext (context/AuthContext.jsx)
├── user: { token, role, username } | null
├── login(userData)  → stores in localStorage + context
├── logout()         → clears localStorage + context
└── loading          → true during initial hydration from localStorage
```

The `ProtectedRoute` component in `App.jsx` wraps routes that require authentication, and optionally enforces specific roles:

```jsx
<ProtectedRoute roles={['Admin']}>
    <AuditLog />
</ProtectedRoute>
```

---

## 10. Authentication & Authorization

### Authentication Flow

```
1. User submits username + password to POST /login
2. Server looks up user in users.json
3. bcryptjs compares password hash
4. If valid, JWT signed with SECRET_KEY (4-hour expiry)
5. Token + role + username returned to client
6. Client stores in localStorage and AuthContext
7. All subsequent API calls include: Authorization: Bearer <token>
8. Server middleware verifies JWT on protected routes
```

### Role-Based Access Control (RBAC)

DEIS has **7 forensic roles**, each with specific permissions:

| Role | Upload | Download | Manage Status | Create Cases | Custody Events | Reports | Audit Log |
|---|---|---|---|---|---|---|---|
| **First Responder** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Evidence Technician** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Forensic Analyst** | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Case Agent** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Transportation** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Legal** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

The `authorize()` middleware enforces these permissions at the API level:

```javascript
app.post('/upload',
    authenticate,                                                      // 1. Verify JWT
    authorize('First Responder', 'Evidence Technician', 'Case Agent', 'Admin'),  // 2. Check role
    upload.single('file'),                                             // 3. Handle file
    async (req, res) => { ... }                                        // 4. Business logic
);
```

---

## 11. Evidence Lifecycle Workflow

Every piece of evidence in DEIS follows a **6-stage lifecycle**:

```
┌───────────┐    ┌────────────┐    ┌───────────┐    ┌─────────────┐    ┌───────────┐    ┌──────────┐
│ Collected │───▶│ Processing │───▶│ Analyzed  │───▶│ Court-Ready │───▶│ Archived  │───▶│ Released │
└───────────┘    └────────────┘    └───────────┘    └─────────────┘    └───────────┘    └──────────┘
     │                │                │                  │                  │                │
  Evidence         Forensic         Analysis          Ready for          Long-term        Evidence
  collected &     examination      complete &        presentation       storage or       returned
  uploaded        in progress      documented        in court           cold storage      to owner
```

| Status | Description | Typical Role |
|---|---|---|
| **Collected** | Initial state after upload | First Responder |
| **Processing** | Forensic examination underway | Evidence Technician |
| **Analyzed** | Analysis complete, findings documented | Forensic Analyst |
| **Court-Ready** | Evidence package prepared for legal proceedings | Case Agent |
| **Archived** | Case closed, evidence in long-term storage | Admin |
| **Released** | Evidence returned to its owner or disposed | Admin |

Each status change is:
- Recorded in the evidence's `custodyLog` with the user who made the change
- Logged in the system audit trail
- Visible in the Evidence Detail page timeline

---

## 12. Chain of Custody

The chain of custody is the **cornerstone of forensic evidence admissibility**. DEIS maintains custody records in **two places**:

### 1. Local Custody Log (data/evidence.json)

Each evidence item has a `custodyLog` array:

```json
{
    "custodyLog": [
        {
            "action": "INITIAL_UPLOAD",
            "by": "officer_smith",
            "role": "First Responder",
            "timestamp": "2026-02-13T00:15:00.000Z",
            "notes": "Collected from crime scene"
        },
        {
            "action": "TRANSFERRED",
            "by": "tech_jones",
            "role": "Evidence Technician",
            "timestamp": "2026-02-13T02:30:00.000Z",
            "notes": "Received at forensic lab"
        }
    ]
}
```

### 2. Blockchain Custody Tree (EvidenceRegistry.sol)

Critical custody events are also written to the blockchain via `addCustodyEvent()`, creating an immutable record that cannot be altered.

### Supported Custody Actions

| Action | Icon | Description |
|---|---|---|
| `INITIAL_UPLOAD` | 📤 | First registration of evidence |
| `TRANSFERRED` | 🔄 | Custody transferred between parties |
| `EXAMINED` | 🔬 | Forensic examination performed |
| `STORED` | 🏛️ | Placed in secure storage |
| `TRANSPORTED` | 🚚 | Physically moved to another location |
| `COURT_SUBMITTED` | ⚖️ | Submitted as court evidence |
| `INTEGRITY_CHECK` | ✅ | File integrity re-verified |
| `RELEASED` | 📤 | Evidence released/returned |
| `STATUS_CHANGED` | 🔄 | Lifecycle status updated |
| `DOWNLOADED` | ⬇️ | File downloaded (auto-logged) |
| `CASE_LINKED` | 🔗 | Evidence linked to a case |

### Auto-Logged Events

Some custody events are automatically recorded by the system:
- **DOWNLOADED**: Every file download is auto-logged
- **INTEGRITY_CHECK**: Every integrity verification is auto-logged
- **STATUS_CHANGED**: Every status transition is auto-logged
- **CASE_LINKED**: Every case link/unlink is auto-logged

---

## 13. Multi-Hash Integrity Verification

### Why Multiple Hashes?

NIST recommends using multiple hash algorithms for maximum verification confidence:

| Algorithm | Digest Size | Speed | Use Case |
|---|---|---|---|
| **SHA-256** | 256 bits (64 hex chars) | Fast | Primary integrity hash, stored on blockchain |
| **SHA-1** | 160 bits (40 hex chars) | Very fast | Secondary verification, legacy compatibility |
| **MD5** | 128 bits (32 hex chars) | Fastest | Quick comparison, legacy system interop |

### Verification Workflow

```
                   ┌──────────────────────────────────────┐
                   │     Evidence File Stored on Disk     │
                   └──────────────────┬───────────────────┘
                                      │
                              ┌───────▼───────┐
                              │  Re-read file │
                              │  from disk    │
                              └───────┬───────┘
                                      │
                   ┌──────────────────┼──────────────────┐
                   ▼                  ▼                  ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │ Compute      │  │ Compute      │  │ Compute      │
           │ SHA-256      │  │ SHA-1        │  │ MD5          │
           └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                  │                 │                 │
           ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐
           │ Compare with │  │ Compare with │  │ Compare with │
           │ stored hash  │  │ stored hash  │  │ stored hash  │
           └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
              ✅ Match?         ✅ Match?         ✅ Match?
                  │                 │                 │
                  └────────┬────────┘                 │
                           └──────────┬───────────────┘
                                      ▼
                        ALL three must match → INTACT
                        ANY mismatch → ⚠️ COMPROMISED
```

The integrity check endpoint (`GET /evidence/:hash/verify-integrity`) returns:

```json
{
    "intact": true,
    "stored": { "sha256": "a3f2...", "sha1": "8b1c...", "md5": "c9d4..." },
    "current": { "sha256": "a3f2...", "sha1": "8b1c...", "md5": "c9d4..." },
    "checkedAt": "2026-02-13T00:20:00.000Z"
}
```

---

## 14. Case Management

Cases allow investigators to organize evidence by investigation:

```
┌──────────────────────────────────────────────────────────────┐
│  Case: TST-001 — Warehouse Break-in Investigation            │
│  Priority: High │ Status: Open │ Created by: agent_smith     │
│                                                              │
│  Linked Evidence:                                            │
│  ├── 📷 crime_scene_photo.jpg     (Analyzed)                │
│  ├── 🎥 surveillance_footage.mp4  (Processing)              │
│  ├── 📄 forensic_report.pdf       (Court-Ready)             │
│  └── 💿 hard_drive_image.dd       (Collected)               │
│                                                              │
│  Evidence Count: 4                                           │
└──────────────────────────────────────────────────────────────┘
```

### Case Fields

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique identifier |
| `caseNumber` | String | Human-readable case number (e.g., `2026-CR-0042`) |
| `title` | String | Case title |
| `description` | String | Investigation description |
| `priority` | Enum | Low, Medium, High, Critical |
| `status` | Enum | Open, Closed |
| `createdBy` | String | Username of creator |
| `createdAt` | ISO Date | Creation timestamp |

### Case-Evidence Relationship

- Each evidence item has an optional `caseId` field
- Evidence can be linked/unlinked from cases at any time
- The Evidence Ledger can be filtered by case via URL parameter `?case=<id>`
- Case cards show a live count of linked evidence items

---

## 15. Audit Logging

Every significant action in DEIS is recorded in the audit log (`data/audit-log.json`). This is a requirement of **NIST IR 8387** for digital evidence handling.

### Logged Actions

| Action Code | When It Fires |
|---|---|
| `USER_REGISTERED` | New account created |
| `USER_LOGIN` | User successfully logs in |
| `EVIDENCE_UPLOADED` | New evidence file uploaded |
| `EVIDENCE_VIEWED` | User views evidence detail page |
| `EVIDENCE_DOWNLOADED` | User downloads evidence file |
| `EVIDENCE_STATUS_CHANGED` | Evidence status updated |
| `EVIDENCE_CASE_LINKED` | Evidence linked/unlinked from case |
| `CUSTODY_EVENT` | New custody event recorded |
| `INTEGRITY_CHECK` | File integrity re-verified |
| `REPORT_GENERATED` | Forensic report generated |
| `CASE_CREATED` | New investigation case created |
| `CASE_UPDATED` | Case details updated |
| `NOTE_ADDED` | Note added to evidence |

### Audit Entry Format

```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-13T00:15:00.000Z",
    "action": "EVIDENCE_UPLOADED",
    "username": "officer_smith",
    "role": "First Responder",
    "ip": "::1",
    "evidenceHash": "a3f2e8b1c9d4...",
    "fileName": "crime_scene.jpg",
    "fileSize": 2457600,
    "caseId": "case-uuid-here",
    "txHash": "0x7a8b..."
}
```

---

## 16. Forensic Report Generation

The `GET /evidence/:hash/report` endpoint generates a comprehensive forensic integrity report compliant with **NIST IR 8387** and **ISO 27037**.

### Report Contents

```json
{
    "title": "Digital Evidence Integrity Report",
    "standard": "NIST IR 8387 / ISO 27037",
    "generatedAt": "2026-02-13T00:20:00.000Z",
    "generatedBy": "analyst_jones",
    "generatedByRole": "Forensic Analyst",

    "evidence": {
        "fileName": "crime_scene_photo.jpg",
        "fileSize": 2457600,
        "mimeType": "image/jpeg",
        "category": "Photo",
        "status": "Analyzed",
        "tags": ["crime-scene", "exterior"],
        "uploadedBy": "officer_smith",
        "uploaderRole": "First Responder",
        "uploadTimestamp": "2026-02-12T18:30:00.000Z"
    },

    "hashes": {
        "sha256": "a3f2e8b1c9d4...7e2f",
        "sha1": "8b1ca3f2e9d4...f2e7",
        "md5": "c9d4a3f2e8b1...2f7e"
    },

    "integrityStatus": "INTACT",

    "blockchain": {
        "fileHash": "a3f2e8b1c9d4...7e2f",
        "uploader": "0x1234...5678",
        "timestamp": "2026-02-12T18:30:00.000Z",
        "metadata": "Crime scene photo | By: officer_smith (First Responder)"
    },

    "case": {
        "caseNumber": "2026-CR-0042",
        "title": "Warehouse Break-in Investigation",
        "priority": "High",
        "status": "Open"
    },

    "chainOfCustody": [ ... ],
    "notes": [ ... ],
    "totalCustodyEvents": 7
}
```

Reports can be **exported as JSON** from the Evidence Detail page for court submission.

---

## 17. API Reference

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check — returns service status, version, features |
| `GET` | `/enums` | Returns valid roles, statuses, categories |
| `GET` | `/verify/:hash` | Public integrity verification against blockchain |
| `POST` | `/register` | Create new user account |
| `POST` | `/login` | Authenticate and receive JWT token |

### Protected Endpoints (JWT Required)

| Method | Endpoint | Role Restriction | Description |
|---|---|---|---|
| `GET` | `/me` | Any | Get current user profile |
| `GET` | `/cases` | Any | List all investigation cases |
| `POST` | `/cases` | Case Agent, Admin, First Responder | Create new case |
| `PUT` | `/cases/:id` | Case Agent, Admin | Update case details/status |
| `POST` | `/upload` | FR, ET, CA, Admin | Upload evidence file |
| `GET` | `/evidence` | Any | List evidence (with filtering) |
| `GET` | `/evidence/:hash` | Any | Get evidence detail + blockchain data |
| `GET` | `/evidence/:hash/download` | FR, ET, FA, CA, Admin | Download evidence file |
| `PUT` | `/evidence/:hash/status` | ET, FA, CA, Admin | Change evidence status |
| `PUT` | `/evidence/:hash/case` | CA, Admin, ET | Link/unlink evidence to case |
| `PUT` | `/evidence/:hash/tags` | Any | Update evidence tags |
| `POST` | `/evidence/:hash/notes` | Any | Add note to evidence |
| `POST` | `/evidence/:hash/custody` | FR, ET, FA, CA, Transport, Admin | Record custody event |
| `GET` | `/evidence/:hash/verify-integrity` | ET, FA, CA, Admin | Re-verify file hashes |
| `GET` | `/evidence/:hash/report` | FA, CA, Legal, Admin | Generate forensic report |
| `GET` | `/audit-log` | Admin only | View system audit trail |
| `GET` | `/stats` | Any | Get dashboard statistics |

**Role abbreviations**: FR = First Responder, ET = Evidence Technician, FA = Forensic Analyst, CA = Case Agent

---

## 18. Data Models

### User

```json
{
    "username": "officer_smith",
    "password": "$2a$10$...",          // bcrypt hash
    "role": "First Responder",
    "createdAt": "2026-02-12T18:00:00.000Z"
}
```

### Evidence

```json
{
    "id": "uuid-v4",
    "hash": "sha256-hex-string",       // Primary identifier
    "hashes": {
        "sha256": "...",
        "sha1": "...",
        "md5": "..."
    },
    "fileName": "evidence.jpg",
    "fileSize": 2457600,
    "mimeType": "image/jpeg",
    "storedAs": "sha256hash.jpg",      // Filename on disk
    "metadata": "Description...",
    "category": "Photo",
    "tags": ["crime-scene", "exterior"],
    "caseId": "case-uuid or null",
    "status": "Collected",
    "uploadedBy": "officer_smith",
    "uploaderRole": "First Responder",
    "transactionHash": "0x...",
    "timestamp": "2026-02-12T18:30:00.000Z",
    "notes": [ ... ],
    "custodyLog": [ ... ]
}
```

### Case

```json
{
    "id": "uuid-v4",
    "caseNumber": "2026-CR-0042",
    "title": "Warehouse Break-in Investigation",
    "description": "...",
    "priority": "High",
    "status": "Open",
    "createdBy": "agent_smith",
    "createdAt": "2026-02-12T18:00:00.000Z",
    "updatedAt": "2026-02-12T20:00:00.000Z"
}
```

### Audit Log Entry

```json
{
    "id": "uuid-v4",
    "timestamp": "2026-02-12T18:30:00.000Z",
    "action": "EVIDENCE_UPLOADED",
    "username": "officer_smith",
    "role": "First Responder",
    "ip": "::1",
    "evidenceHash": "sha256...",
    "fileName": "evidence.jpg",
    "fileSize": 2457600,
    "txHash": "0x..."
}
```

---

## 19. Security Model

### Defense in Depth

```
Layer 1: AUTHENTICATION
         └── JWT tokens (4-hour expiry, HS256 signing)

Layer 2: AUTHORIZATION
         └── Role-based middleware on every protected endpoint

Layer 3: PASSWORD SECURITY
         └── bcryptjs with salt factor 10 (never stored in plaintext)

Layer 4: DATA INTEGRITY
         └── Multi-hash (SHA-256 + SHA-1 + MD5) computed server-side
         └── Blockchain-immutable records (cannot be altered)

Layer 5: AUDIT TRAIL
         └── Every action logged with user, timestamp, and details
         └── Downloads auto-logged in custody chain

Layer 6: FILE SECURITY
         └── Files served only to authorized roles
         └── Files stored with hash-based names (not user-supplied names)
```

### Security Measures

| Measure | Implementation |
|---|---|
| Password hashing | bcryptjs with salt (cost factor 10) |
| Token signing | JWT with HS256 algorithm |
| Token expiry | 4 hours |
| Role enforcement | Express middleware on every route |
| File naming | SHA-256 hash (prevents path traversal) |
| Input validation | Required field checks on all endpoints |
| CORS | Enabled for cross-origin frontend access |
| Audit logging | Every action recorded with user identity |
| Blockchain immutability | Evidence records cannot be altered post-registration |

---

## 20. How To Run

### Prerequisites

- **Node.js** 18+ installed
- **npm** package manager

### Step 1: Start the Blockchain

```bash
cd DEIS/blockchain
npm install
npx hardhat node
```

This starts a local Ethereum blockchain on `http://localhost:8545`. Keep this terminal running.

### Step 2: Deploy the Smart Contract

In a new terminal:

```bash
cd DEIS/blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address from the output.

### Step 3: Configure the Backend

Edit `DEIS/server/.env`:

```env
PORT=3001
CONTRACT_ADDRESS=<paste-contract-address-here>
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
JWT_SECRET=your_secret_key_here
```

The `PRIVATE_KEY` above is the default Hardhat Account #0 private key (for development only).

### Step 4: Start the Backend

```bash
cd DEIS/server
npm install
npm start
```

The server starts on `http://localhost:3001`. You should see:

```
[DEIS] v2.0 running on http://localhost:3001
[DEIS] Features: Multi-Hash | Case Mgmt | Audit Log | Workflow | Reports
```

### Step 5: Start the Frontend

```bash
cd DEIS/client
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

### Step 6: Use the Application

1. Open `http://localhost:5173` in your browser
2. Click **Register** to create an account (choose a role like "Admin" for full access)
3. Log in with your credentials
4. Start uploading evidence, creating cases, and exploring features!

---

## 21. End-to-End Testing

DEIS includes a comprehensive E2E test suite (`server/test_e2e.js`) with **27 tests** covering:

```
📡 Health
  ✅ Service is running
  ✅ Enums endpoint returns roles/statuses/categories

🔐 Authentication
  ✅ Register an Admin user
  ✅ Login
  ✅ Get current user

📁 Case Management
  ✅ Create a case
  ✅ List cases
  ✅ Update case status

📤 Evidence Upload
  ✅ Upload evidence with case + category + tags

📋 Evidence Management
  ✅ List all evidence
  ✅ Get evidence detail

🔄 Status Workflow
  ✅ Change status to Processing
  ✅ Change status to Analyzed
  ✅ Reject invalid status

🔗 Case Linking
  ✅ Unlink from case
  ✅ Re-link to case

📝 Evidence Notes
  ✅ Add a note
  ✅ Note appears in detail

🏷️ Evidence Tags
  ✅ Update tags

⛓️ Custody Chain
  ✅ Add custody event

⬇️ Download
  ✅ Download evidence file

🛡️ Integrity Verification
  ✅ Verify file integrity (multi-hash)

📊 Forensic Report
  ✅ Generate forensic integrity report

📜 Audit Log
  ✅ Retrieve audit log (Admin only)

📈 Dashboard Stats
  ✅ Get system statistics

🔍 Public Verification
  ✅ Public verify endpoint

🔗 Final Chain of Custody Check
  ✅ Evidence has full custody trail
```

### Running Tests

```bash
cd DEIS
node server/test_e2e.js
```

Ensure the blockchain and server are running before executing tests.

---

## 22. Standards Compliance

DEIS is designed to align with the following forensic standards:

### NIST IR 8387 — Digital Evidence Preservation

| Requirement | DEIS Implementation |
|---|---|
| Document who handled evidence | Custody log with username and role |
| Record when evidence was handled | ISO timestamps on every event |
| Record why evidence was handled | Action types and notes field |
| Maintain chain of custody | Linked list on blockchain + local log |
| Use approved hash algorithms | SHA-256 (FIPS 180-4) |
| Verify evidence integrity | On-demand re-verification |
| Comprehensive audit trail | Every action logged |

### ISO 27037 — Digital Evidence Collection

| Requirement | DEIS Implementation |
|---|---|
| Evidence identification | SHA-256 hash as unique identifier |
| Evidence collection | Upload with metadata and chain of custody |
| Evidence preservation | Multi-hash + blockchain immutability |
| Evidence analysis documentation | Notes, status workflow, forensic reports |

---

## 23. Future Enhancements

| Enhancement | Description |
|---|---|
| **Testnet Deployment** | Deploy to Ethereum Sepolia testnet for production readiness |
| **Cloud Storage** | Replace disk storage with AWS S3 or IPFS for scalability |
| **PostgreSQL/MongoDB** | Replace JSON files with a proper database |
| **File Encryption** | Encrypt evidence at rest using AES-256 |
| **Digital Signatures** | Sign evidence with user's private key for non-repudiation |
| **Batch Upload** | Upload and register multiple files in one operation |
| **Evidence Preview** | In-browser preview for images, PDFs, and text files |
| **Email Notifications** | Alert when evidence status changes or is accessed |
| **Advanced Search** | Full-text search with date ranges and boolean operators |
| **User Management** | Admin panel for managing users, resetting passwords |
| **API Rate Limiting** | Prevent brute-force attacks on login endpoint |
| **HTTPS/TLS** | Encrypt all traffic in transit |
| **Multi-Chain Support** | Support Polygon, Arbitrum for lower gas costs |
| **RBAC Refinement** | Per-case role assignments (e.g., agent on Case A ≠ agent on Case B) |
| **Evidence Redaction** | Mark sensitive portions of evidence for restricted access |

---

## Summary

**DEIS v2.0** is a complete, production-ready (local development) digital evidence management platform that combines:

- **Blockchain immutability** for tamper-proof evidence registration
- **Multi-hash verification** for maximum integrity confidence
- **Role-based access control** for forensic workflow compliance
- **Case management** for investigation organization
- **Audit logging** for NIST IR 8387 compliance
- **Forensic reporting** for court-ready documentation

The system is built with modern web technologies (React, Node.js, Express, Solidity, Hardhat) and follows industry forensic standards to ensure digital evidence is admissible, verifiable, and trustworthy.

---

*Document generated: February 13, 2026*
*DEIS v2.0 — Digital Evidence Integrity System*
*NIST IR 8387 • ISO 27037 • Blockchain-Powered*
