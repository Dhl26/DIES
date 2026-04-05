const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
// Hyperledger Fabric Adapter is imported below
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// ═══════════════════════════════════════════════════════════
//  EXPRESS SETUP
// ═══════════════════════════════════════════════════════════
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ═══════════════════════════════════════════════════════════
//  BLOCKCHAIN SETUP (Hyperledger Fabric)
// ═══════════════════════════════════════════════════════════
const contract = require('./fabricContract');

console.log(`[DEIS] Hyperledger Fabric Adapter Loaded`);

// ═══════════════════════════════════════════════════════════
//  DATA LAYER (JSON file-based persistence)
// ═══════════════════════════════════════════════════════════
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES = {
    users: path.resolve(DATA_DIR, 'users.json'),
    evidence: path.resolve(DATA_DIR, 'evidence.json'),
    cases: path.resolve(DATA_DIR, 'cases.json'),
    auditLog: path.resolve(DATA_DIR, 'audit-log.json'),
    permissions: path.resolve(DATA_DIR, 'permissions.json'),
};

const DEFAULT_PERMISSIONS = {
    'Admin': ['Dashboard', 'View Cases', 'Create Case', 'Close Case', 'Update Case', 'Upload Evidence', 'Download Evidence', 'Change Status', 'View Report', 'View Audit Logs', 'User Management', 'Verify Evidence'],
    'Case Agent': ['Dashboard', 'View Cases', 'Create Case', 'Update Case', 'Upload Evidence', 'Download Evidence', 'View Report', 'Verify Evidence'],
    'Evidence Custodian': ['Dashboard', 'View Cases', 'Download Evidence', 'Change Status', 'Verify Evidence']
};

const readJSON = (filePath, fallback = []) => {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
    catch { return fallback; }
};
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

// Migration complete.

const SECRET_KEY = process.env.JWT_SECRET || "deis_secret_key_change_in_production";
const VALID_ROLES = ['Admin', 'Case Agent', 'Evidence Custodian'];
const EVIDENCE_STATUSES = ['Collected', 'Processing', 'Analyzed', 'Court-Ready', 'Archived', 'Released'];
const EVIDENCE_CATEGORIES = ['Photo', 'Video', 'Document', 'Device Image', 'Network Capture', 'Audio', 'Database', 'Email', 'Mobile Data', 'Other'];

// ═══════════════════════════════════════════════════════════
//  AUDIT LOGGER (NIST IR 8387 compliance)
// ═══════════════════════════════════════════════════════════
const logAudit = (action, user, details = {}) => {
    const log = readJSON(FILES.auditLog);
    log.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action,
        username: user?.username || 'SYSTEM',
        role: user?.role || 'SYSTEM',
        ip: details.ip || 'unknown',
        ...details,
    });
    writeJSON(FILES.auditLog, log);
};

// ═══════════════════════════════════════════════════════════
//  HASH UTILITY (Multi-algorithm — NIST-approved)
// ═══════════════════════════════════════════════════════════
const computeHashes = (buffer) => ({
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    sha1: crypto.createHash('sha1').update(buffer).digest('hex'),
    md5: crypto.createHash('md5').update(buffer).digest('hex'),
});

// ═══════════════════════════════════════════════════════════
//  MIDDLEWARE
// ═══════════════════════════════════════════════════════════
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Access Denied: No token' });
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: 'Access Denied: Token malformed' });
    try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: `Forbidden: Requires [${roles.join(', ')}]` });
    }
    next();
};

// ═══════════════════════════════════════════════════════════
//  ROUTES: HEALTH
// ═══════════════════════════════════════════════════════════
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'DEIS Backend v2.1 (Fabric Edition)', blockchain: 'Hyperledger Fabric', features: ['multi-hash', 'case-management', 'audit-log', 'evidence-workflow', 'report-gen'] });
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: AUTH (Register secured for Admin only)
// ═══════════════════════════════════════════════════════════
app.post('/register', authenticate, authorize('Admin'), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) return res.status(400).json({ error: 'All fields required' });
        if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
        if (password.length < 6) return res.status(400).json({ error: 'Password must be ≥ 6 characters' });

        const users = readJSON(FILES.users);
        if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Username taken' });

        users.push({ username, password: await bcrypt.hash(password, 10), role, createdAt: new Date().toISOString() });
        writeJSON(FILES.users, users);
        logAudit('USER_REGISTERED', { username: req.user.username, role: req.user.role }, { ip: req.ip, new_user: username });

        res.json({ message: 'Account created' });
    } catch (err) {
        console.error("[DEIS] Reg error:", err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.get('/users', authenticate, authorize('Admin'), (req, res) => {
    const users = readJSON(FILES.users).map(u => ({ username: u.username, role: u.role, createdAt: u.createdAt }));
    res.json(users);
});

app.put('/users/role', authenticate, authorize('Admin'), (req, res) => {
    const { username, role } = req.body;
    let users = readJSON(FILES.users);
    const uIdx = users.findIndex(u => u.username === username);
    if (uIdx === -1) return res.status(404).json({ error: 'User not found' });
    users[uIdx].role = role;
    writeJSON(FILES.users, users);
    res.json({ message: 'User role updated successfully' });
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: DYNAMIC PERMISSIONS
// ═══════════════════════════════════════════════════════════
app.get('/permissions', authenticate, (req, res) => {
    const perms = readJSON(FILES.permissions, DEFAULT_PERMISSIONS);
    // If empty or missing, populate defaults
    if (Object.keys(perms).length === 0) {
        writeJSON(FILES.permissions, DEFAULT_PERMISSIONS);
        return res.json(DEFAULT_PERMISSIONS);
    }
    res.json(perms);
});

app.put('/permissions', authenticate, authorize('Admin'), (req, res) => {
    const newPerms = req.body;
    writeJSON(FILES.permissions, newPerms);
    logAudit('PERMISSIONS_UPDATED', req.user, { updated: true });
    res.json({ message: 'Permissions successfully updated' });
});

app.post('/verify-password', authenticate, async (req, res) => {
    console.log(`[DEIS] Password verification attempt for user: ${req.user.username}`);
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Password required' });
        const users = readJSON(FILES.users);
        const user = users.find(u => u.username === req.user.username);
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid password' });
        console.log(`[DEIS] Password verification SUCCESS for: ${req.user.username}`);
        res.json({ success: true });
    } catch (err) {
        console.error("[DEIS] Verification error:", err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'All fields required' });

        const users = readJSON(FILES.users);
        const user = users.find(u => u.username === username);
        if (!user) return res.status(400).json({ error: 'User not found' });
        if (!(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        logAudit('USER_LOGIN', { username, role: user.role }, { ip: req.ip });

        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        console.error("[DEIS] Login error:", err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/me', authenticate, (req, res) => {
    res.json({ username: req.user.username, role: req.user.role });
});

app.get('/me', authenticate, (req, res) => {
    res.json({ username: req.user.username, role: req.user.role });
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: CASES
// ═══════════════════════════════════════════════════════════
app.get('/cases', authenticate, (req, res) => {
    const cases = readJSON(FILES.cases);
    const evidence = readJSON(FILES.evidence);
    // Enrich with evidence count
    const enriched = cases.map(c => ({
        ...c,
        evidenceCount: evidence.filter(e => e.caseId === c.id).length,
    }));
    res.json(enriched);
});

app.post('/cases', authenticate, authorize('Case Agent', 'Admin', 'First Responder'), (req, res) => {
    const { title, description, caseNumber, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Case title is required' });

    const cases = readJSON(FILES.cases);
    const newCase = {
        id: crypto.randomUUID(),
        caseNumber: caseNumber || `CASE-${Date.now().toString(36).toUpperCase()}`,
        title,
        description: description || '',
        priority: priority || 'Medium',
        status: 'Open',
        createdBy: req.user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    cases.push(newCase);
    writeJSON(FILES.cases, cases);
    logAudit('CASE_CREATED', req.user, { caseId: newCase.id, caseNumber: newCase.caseNumber });

    res.json(newCase);
});

app.put('/cases/:id', authenticate, authorize('Case Agent', 'Admin'), (req, res) => {
    const cases = readJSON(FILES.cases);
    const idx = cases.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Case not found' });

    const { title, description, status, priority } = req.body;
    if (title) cases[idx].title = title;
    if (description !== undefined) cases[idx].description = description;
    if (status) cases[idx].status = status;
    if (priority) cases[idx].priority = priority;
    cases[idx].updatedAt = new Date().toISOString();

    writeJSON(FILES.cases, cases);
    logAudit('CASE_UPDATED', req.user, { caseId: req.params.id });
    res.json(cases[idx]);
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE UPLOAD
// ═══════════════════════════════════════════════════════════
app.post('/upload',
    authenticate,
    authorize('Evidence Technician', 'Case Agent', 'Admin'),
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

            // Multi-hash (NIST-approved algorithms)
            const hashes = computeHashes(req.file.buffer);
            const metadata = req.body.metadata || 'No description';
            const caseId = req.body.caseId || null;
            const category = req.body.category || 'Other';
            const tags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            console.log(`[DEIS] Upload: ${hashes.sha256.substring(0, 16)}... by ${req.user.username}`);

            // Check for duplicates
            try {
                const existing = await contract.getEvidence(hashes.sha256);
                if (existing && existing.timestamp && existing.timestamp.toNumber() > 0) {
                    return res.json({ message: 'Evidence already registered', hash: hashes.sha256, transactionHash: 'existing', hashes });
                }
            } catch (e) { /* new evidence */ }

            // Save file to disk
            const ext = path.extname(req.file.originalname) || '';
            const storedAs = `${hashes.sha256}${ext}`;
            fs.writeFileSync(path.join(UPLOADS_DIR, storedAs), req.file.buffer);

            // Register on blockchain
            const fullMeta = `${metadata} | By: ${req.user.username} (${req.user.role})`;
            const tx = await contract.registerEvidence(hashes.sha256, fullMeta);
            await tx.wait();

            // Save to registry
            const registry = readJSON(FILES.evidence);
            const newEvidence = {
                id: crypto.randomUUID(),
                hash: hashes.sha256,
                hashes,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                storedAs,
                metadata,
                category,
                tags,
                caseId,
                status: 'Collected',
                uploadedBy: req.user.username,
                uploaderRole: req.user.role,
                transactionHash: tx.hash,
                timestamp: new Date().toISOString(),
                notes: [],
                custodyLog: [
                    { action: 'INITIAL_UPLOAD', by: req.user.username, role: req.user.role, timestamp: new Date().toISOString(), notes: metadata }
                ]
            };
            registry.push(newEvidence);
            writeJSON(FILES.evidence, registry);

            logAudit('EVIDENCE_UPLOADED', req.user, {
                evidenceHash: hashes.sha256,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                caseId,
                txHash: tx.hash,
            });

            res.json({
                message: 'Evidence registered on blockchain',
                hash: hashes.sha256,
                hashes,
                transactionHash: tx.hash,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                id: newEvidence.id,
            });
        } catch (error) {
            console.error("[DEIS] Upload error:", error.message || error);
            res.status(500).json({ error: 'Failed: ' + (error.reason || error.message || 'Unknown') });
        }
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE LIST & DETAIL
// ═══════════════════════════════════════════════════════════
app.get('/evidence', authenticate, (req, res) => {
    const registry = readJSON(FILES.evidence);
    const { caseId, status, category, search } = req.query;

    let filtered = registry;
    if (caseId) filtered = filtered.filter(e => e.caseId === caseId);
    if (status) filtered = filtered.filter(e => e.status === status);
    if (category) filtered = filtered.filter(e => e.category === category);
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(e =>
            e.fileName?.toLowerCase().includes(s) ||
            e.hash?.toLowerCase().includes(s) ||
            e.uploadedBy?.toLowerCase().includes(s) ||
            e.metadata?.toLowerCase().includes(s) ||
            e.tags?.some(t => t.toLowerCase().includes(s))
        );
    }

    const safe = filtered.map(({ storedAs, ...e }) => e);
    res.json(safe);
});

app.get('/evidence/:hash', authenticate, async (req, res) => {
    try {
        const { hash } = req.params;
        const registry = readJSON(FILES.evidence);
        const entry = registry.find(e => e.hash === hash);
        if (!entry) return res.status(404).json({ error: 'Not found' });

        let blockchain = null;
        try {
            const ev = await contract.getEvidence(hash);
            if (ev && ev.timestamp && ev.timestamp.toNumber() > 0) {
                blockchain = {
                    fileHash: ev.fileHash, uploader: ev.uploader,
                    timestamp: ev.timestamp.toNumber() * 1000,
                    metadata: ev.metadata, rootCustodyNodeId: ev.rootCustodyNodeId,
                };
            }
        } catch (e) { /* */ }

        const { storedAs, ...safe } = entry;
        logAudit('EVIDENCE_VIEWED', req.user, { evidenceHash: hash });
        res.json({ ...safe, blockchain });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE DOWNLOAD
// ═══════════════════════════════════════════════════════════
app.get('/evidence/:hash/download',
    authenticate,
    authorize('Evidence Technician', 'Forensic Analyst', 'Case Agent', 'Admin'),
    (req, res) => {
        const registry = readJSON(FILES.evidence);
        const entry = registry.find(e => e.hash === req.params.hash);
        if (!entry) return res.status(404).json({ error: 'Not found' });

        const filePath = path.join(UPLOADS_DIR, entry.storedAs);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing' });

        entry.custodyLog.push({ action: 'DOWNLOADED', by: req.user.username, role: req.user.role, timestamp: new Date().toISOString(), notes: '' });
        writeJSON(FILES.evidence, registry);
        logAudit('EVIDENCE_DOWNLOADED', req.user, { evidenceHash: req.params.hash });

        res.download(filePath, entry.fileName);
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE STATUS (Workflow)
// ═══════════════════════════════════════════════════════════
app.put('/evidence/:hash/status',
    authenticate,
    authorize('Evidence Technician', 'Forensic Analyst', 'Case Agent', 'Admin'),
    (req, res) => {
        const { status } = req.body;
        if (!status || !EVIDENCE_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Valid: ${EVIDENCE_STATUSES.join(', ')}` });
        }

        const registry = readJSON(FILES.evidence);
        const entry = registry.find(e => e.hash === req.params.hash);
        if (!entry) return res.status(404).json({ error: 'Not found' });

        const oldStatus = entry.status;
        entry.status = status;
        entry.custodyLog.push({
            action: 'STATUS_CHANGED',
            by: req.user.username,
            role: req.user.role,
            timestamp: new Date().toISOString(),
            notes: `Status: ${oldStatus} → ${status}`,
        });
        writeJSON(FILES.evidence, registry);
        logAudit('EVIDENCE_STATUS_CHANGED', req.user, { evidenceHash: req.params.hash, from: oldStatus, to: status });

        res.json({ message: `Status updated to ${status}` });
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE LINK TO CASE
// ═══════════════════════════════════════════════════════════
app.put('/evidence/:hash/case',
    authenticate,
    authorize('Case Agent', 'Admin', 'Evidence Technician'),
    (req, res) => {
        const { caseId } = req.body;
        const registry = readJSON(FILES.evidence);
        const entry = registry.find(e => e.hash === req.params.hash);
        if (!entry) return res.status(404).json({ error: 'Not found' });

        if (caseId) {
            const cases = readJSON(FILES.cases);
            if (!cases.find(c => c.id === caseId)) return res.status(404).json({ error: 'Case not found' });
        }

        entry.caseId = caseId || null;
        entry.custodyLog.push({
            action: 'CASE_LINKED',
            by: req.user.username,
            role: req.user.role,
            timestamp: new Date().toISOString(),
            notes: caseId ? `Linked to case ${caseId}` : 'Unlinked from case',
        });
        writeJSON(FILES.evidence, registry);
        logAudit('EVIDENCE_CASE_LINKED', req.user, { evidenceHash: req.params.hash, caseId });

        res.json({ message: 'Case link updated' });
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE NOTES
// ═══════════════════════════════════════════════════════════
app.post('/evidence/:hash/notes', authenticate, (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Note text required' });

    const registry = readJSON(FILES.evidence);
    const entry = registry.find(e => e.hash === req.params.hash);
    if (!entry) return res.status(404).json({ error: 'Not found' });

    entry.notes = entry.notes || [];
    entry.notes.push({
        id: crypto.randomUUID(),
        text,
        by: req.user.username,
        role: req.user.role,
        timestamp: new Date().toISOString(),
    });
    writeJSON(FILES.evidence, registry);
    logAudit('NOTE_ADDED', req.user, { evidenceHash: req.params.hash });

    res.json({ message: 'Note added' });
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: EVIDENCE TAGS
// ═══════════════════════════════════════════════════════════
app.put('/evidence/:hash/tags', authenticate, (req, res) => {
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'Tags must be an array' });

    const registry = readJSON(FILES.evidence);
    const entry = registry.find(e => e.hash === req.params.hash);
    if (!entry) return res.status(404).json({ error: 'Not found' });

    entry.tags = tags;
    writeJSON(FILES.evidence, registry);
    res.json({ message: 'Tags updated' });
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: CUSTODY EVENTS
// ═══════════════════════════════════════════════════════════
app.post('/evidence/:hash/custody',
    authenticate,
    authorize('Evidence Technician', 'Forensic Analyst', 'Case Agent', 'Transportation', 'Admin'),
    async (req, res) => {
        try {
            const { action, notes } = req.body;
            if (!action) return res.status(400).json({ error: 'Action required' });

            const registry = readJSON(FILES.evidence);
            const entry = registry.find(e => e.hash === req.params.hash);
            if (!entry) return res.status(404).json({ error: 'Not found' });

            entry.custodyLog.push({
                action, by: req.user.username, role: req.user.role,
                timestamp: new Date().toISOString(), notes: notes || '',
            });
            writeJSON(FILES.evidence, registry);

            let txHash = null;
            try {
                const ev = await contract.getEvidence(req.params.hash);
                if (ev && ev.rootCustodyNodeId) {
                    const tx = await contract.addCustodyEvent(ev.rootCustodyNodeId, action, `${notes || ''} | By: ${req.user.username}`);
                    await tx.wait();
                    txHash = tx.hash;
                }
            } catch (e) { console.log("[DEIS] Blockchain custody failed:", e.message); }

            logAudit('CUSTODY_EVENT', req.user, { evidenceHash: req.params.hash, action, txHash });
            res.json({ message: 'Custody event recorded', txHash });
        } catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: INTEGRITY RE-VERIFICATION
// ═══════════════════════════════════════════════════════════
app.get('/evidence/:hash/verify-integrity',
    authenticate,
    authorize('Evidence Technician', 'Forensic Analyst', 'Case Agent', 'Admin'),
    async (req, res) => {
        try {
            const registry = readJSON(FILES.evidence);
            const entry = registry.find(e => e.hash === req.params.hash);
            if (!entry) return res.status(404).json({ error: 'Not found' });

            const filePath = path.join(UPLOADS_DIR, entry.storedAs);
            if (!fs.existsSync(filePath)) return res.json({ intact: false, reason: 'File missing from storage' });

            const buffer = fs.readFileSync(filePath);
            const currentHashes = computeHashes(buffer);

            const intact = currentHashes.sha256 === entry.hashes.sha256 &&
                currentHashes.sha1 === entry.hashes.sha1 &&
                currentHashes.md5 === entry.hashes.md5;

            entry.custodyLog.push({
                action: 'INTEGRITY_CHECK',
                by: req.user.username,
                role: req.user.role,
                timestamp: new Date().toISOString(),
                notes: intact ? 'All hashes match — file intact' : 'INTEGRITY VIOLATION DETECTED',
            });
            writeJSON(FILES.evidence, registry);

            logAudit('INTEGRITY_CHECK', req.user, { evidenceHash: req.params.hash, intact });

            res.json({
                intact,
                stored: entry.hashes,
                current: currentHashes,
                checkedAt: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({ error: 'Verification failed' });
        }
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: FORENSIC REPORT GENERATION
// ═══════════════════════════════════════════════════════════
app.get('/evidence/:hash/report',
    authenticate,
    authorize('Forensic Analyst', 'Case Agent', 'Legal', 'Admin'),
    async (req, res) => {
        try {
            const registry = readJSON(FILES.evidence);
            const entry = registry.find(e => e.hash === req.params.hash);
            if (!entry) return res.status(404).json({ error: 'Not found' });

            const cases = readJSON(FILES.cases);
            const linkedCase = entry.caseId ? cases.find(c => c.id === entry.caseId) : null;

            // Get blockchain data
            let blockchain = null;
            try {
                const ev = await contract.getEvidence(req.params.hash);
                if (ev && ev.timestamp && ev.timestamp.toNumber() > 0) {
                    blockchain = {
                        fileHash: ev.fileHash, uploader: ev.uploader,
                        timestamp: new Date(ev.timestamp.toNumber() * 1000).toISOString(),
                        metadata: ev.metadata,
                    };
                }
            } catch (e) { /* */ }

            // Verify file integrity
            let integrityStatus = 'Unknown';
            const filePath = path.join(UPLOADS_DIR, entry.storedAs);
            if (fs.existsSync(filePath)) {
                const buffer = fs.readFileSync(filePath);
                const currentHashes = computeHashes(buffer);
                integrityStatus = currentHashes.sha256 === entry.hashes.sha256 ? 'INTACT' : 'COMPROMISED';
            } else {
                integrityStatus = 'FILE_MISSING';
            }

            const report = {
                title: 'Digital Evidence Integrity Report',
                standard: 'NIST IR 8387 / ISO 27037',
                generatedAt: new Date().toISOString(),
                generatedBy: req.user.username,
                generatedByRole: req.user.role,
                evidence: {
                    fileName: entry.fileName,
                    fileSize: entry.fileSize,
                    mimeType: entry.mimeType,
                    category: entry.category || 'Uncategorized',
                    status: entry.status,
                    tags: entry.tags || [],
                    uploadedBy: entry.uploadedBy,
                    uploaderRole: entry.uploaderRole,
                    uploadTimestamp: entry.timestamp,
                },
                hashes: entry.hashes,
                integrityStatus,
                blockchain: blockchain || { status: 'Not verified' },
                case: linkedCase ? {
                    caseNumber: linkedCase.caseNumber,
                    title: linkedCase.title,
                    priority: linkedCase.priority,
                    status: linkedCase.status,
                } : null,
                chainOfCustody: entry.custodyLog,
                notes: entry.notes || [],
                totalCustodyEvents: entry.custodyLog?.length || 0,
            };

            logAudit('REPORT_GENERATED', req.user, { evidenceHash: req.params.hash });
            res.json(report);
        } catch (error) {
            console.error("[DEIS] Report error:", error);
            res.status(500).json({ error: 'Report generation failed' });
        }
    }
);

// ═══════════════════════════════════════════════════════════
//  ROUTES: AUDIT LOG
// ═══════════════════════════════════════════════════════════
app.get('/audit-log', authenticate, authorize('Admin'), (req, res) => {
    const log = readJSON(FILES.auditLog);
    const { limit = 100 } = req.query;
    res.json(log.slice(-Number(limit)).reverse());
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: DASHBOARD STATS
// ═══════════════════════════════════════════════════════════
app.get('/stats', authenticate, (req, res) => {
    const evidence = readJSON(FILES.evidence);
    const cases = readJSON(FILES.cases);
    const users = readJSON(FILES.users);
    const auditLog = readJSON(FILES.auditLog);

    const byStatus = {};
    EVIDENCE_STATUSES.forEach(s => byStatus[s] = evidence.filter(e => e.status === s).length);

    const byCategory = {};
    evidence.forEach(e => {
        const cat = e.category || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
    });

    const recentActivity = auditLog.slice(-10).reverse();

    res.json({
        evidence: { total: evidence.length, byStatus, byCategory },
        cases: { total: cases.length, open: cases.filter(c => c.status === 'Open').length },
        users: { total: users.length },
        recentActivity,
    });
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: PUBLIC VERIFY
// ═══════════════════════════════════════════════════════════
app.get('/verify/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const evidence = await contract.getEvidence(hash);

        if (!evidence || !evidence.fileHash || evidence.fileHash === '' || (evidence.timestamp && evidence.timestamp.toNumber() === 0)) {
            return res.json({ verified: false });
        }

        const registry = readJSON(FILES.evidence);
        const local = registry.find(e => e.hash === hash);

        res.json({
            verified: true,
            evidence: {
                fileHash: evidence.fileHash, uploader: evidence.uploader,
                timestamp: evidence.timestamp.toNumber() * 1000, metadata: evidence.metadata,
            },
            local: local ? {
                fileName: local.fileName, fileSize: local.fileSize,
                uploadedBy: local.uploadedBy, uploaderRole: local.uploaderRole,
                category: local.category, status: local.status, tags: local.tags,
                custodyLog: local.custodyLog || [],
            } : null
        });
    } catch (error) {
        res.json({ verified: false });
    }
});

// ═══════════════════════════════════════════════════════════
//  ROUTES: ENUMERATIONS
// ═══════════════════════════════════════════════════════════
app.get('/enums', (req, res) => {
    res.json({ roles: VALID_ROLES, statuses: EVIDENCE_STATUSES, categories: EVIDENCE_CATEGORIES });
});

app.use((req, res) => {
    console.warn(`[DEIS] 404 - ${req.method} ${req.url}`);
    res.status(404).json({ error: `Route ${req.url} not found` });
});

app.listen(port, () => {
    console.log(`[DEIS] v2.1 running on http://localhost:${port}`);
    console.log(`[DEIS] Features: Multi-Hash | Case Mgmt | Audit Log | Workflow | Reports`);
});
