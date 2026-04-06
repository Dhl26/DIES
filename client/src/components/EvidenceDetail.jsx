import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

const CUSTODY_ACTIONS = [
    { value: 'TRANSFERRED', label: 'Transfer Custody' },
    { value: 'EXAMINED', label: 'Forensic Examination' },
    { value: 'STORED', label: 'Placed in Storage' },
    { value: 'TRANSPORTED', label: 'Transported' },
    { value: 'COURT_SUBMITTED', label: 'Submitted to Court' },
    { value: 'INTEGRITY_CHECK', label: 'Integrity Verified' },
    { value: 'RELEASED', label: 'Released / Returned' },
];

const STATUSES = ['Collected', 'Processing', 'Analyzed', 'Court-Ready', 'Archived', 'Released'];

const STATUS_BADGE = {
    'Collected': 'bg-label-primary',
    'Processing': 'bg-label-warning',
    'Analyzed': 'bg-label-info',
    'Court-Ready': 'bg-label-success',
    'Archived': 'bg-label-secondary',
    'Released': 'bg-label-danger',
};

const EvidenceDetail = () => {
    const { hash } = useParams();
    const { user, userPerms, authFetch } = useContext(AuthContext);
    const [evidence, setEvidence] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [cases, setCases] = useState([]);
    const [activeTab, setActiveTab] = useState('custody');

    const [showCustodyForm, setShowCustodyForm] = useState(false);
    const [custodyAction, setCustodyAction] = useState('');
    const [custodyNotes, setCustodyNotes] = useState('');
    const [custodyLoading, setCustodyLoading] = useState(false);

    const [noteText, setNoteText] = useState('');
    const [noteLoading, setNoteLoading] = useState(false);

    const [integrityResult, setIntegrityResult] = useState(null);
    const [integrityLoading, setIntegrityLoading] = useState(false);

    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    const headers = { 'Authorization': `Bearer ${user.token}` };

    useEffect(() => { 
        fetchDetail(); 
        fetchCases(); 
        if (userPerms?.includes('View Report')) {
            handleGenerateReport();
        }
    }, [hash, user?.role]);

    const fetchDetail = async () => {
        try {
            const res = await authFetch(`http://localhost:3001/evidence/${hash}`);
            if (res.ok) setEvidence(await res.json());
            else setError('Evidence not found');
        } catch { setError('Connection failed'); }
        finally { setLoading(false); }
    };

    const fetchCases = async () => {
        try { const r = await authFetch('http://localhost:3001/cases'); if (r.ok) setCases(await r.json()); } catch { }
    };

    const handleDownload = async () => {
        const { value: password } = await Swal.fire({
            title: 'Confirm Download',
            text: `Enter your password to authorize download of evidence file.`,
            input: 'password',
            inputPlaceholder: 'Enter your password',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            confirmButtonColor: '#7367f0',
            cancelButtonColor: '#adb5bd',
            showLoaderOnConfirm: true,
            preConfirm: async (pass) => {
                try {
                    const res = await authFetch('http://localhost:3001/verify-password', {
                        method: 'POST',
                        body: JSON.stringify({ password: pass }),
                    });
                    if (res.ok) return true;
                    if (res.status === 401) throw new Error('Invalid credentials');
                    throw new Error('Verification failed');
                } catch (error) {
                    Swal.showValidationMessage(error.message);
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (!password) return;

        setDownloading(true);
        try {
            const res = await fetch(`http://localhost:3001/evidence/${hash}/download`, { headers });
            if (!res.ok) return alert('Download failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = evidence?.fileName || 'file';
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            fetchDetail();
        } catch { alert('Download failed'); }
        finally { setDownloading(false); }
    };

    const handleStatusChange = async (newStatus) => {
        if (newStatus === evidence?.status) return;

        const { value: password } = await Swal.fire({
            title: 'Confirm Status Change',
            text: `Are you sure you want to change status to "${newStatus}"?`,
            input: 'password',
            inputPlaceholder: 'Enter your password to authorize',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            confirmButtonColor: '#7367f0',
            cancelButtonColor: '#adb5bd',
            showLoaderOnConfirm: true,
            preConfirm: async (pass) => {
                try {
                    const res = await authFetch('http://localhost:3001/verify-password', {
                        method: 'POST',
                        body: JSON.stringify({ password: pass }),
                    });
                    if (res.ok) return true;
                    if (res.status === 401) throw new Error('Invalid credentials. Access denied.');
                    throw new Error('Verification failed. Server error.');
                } catch (error) {
                    Swal.showValidationMessage(error.message);
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (password) {
            try {
                const res = await authFetch(`http://localhost:3001/evidence/${hash}/status`, {
                    method: 'PUT',
                    body: JSON.stringify({ status: newStatus }),
                });
                if (res.ok) {
                    Swal.fire({ title: 'Success', text: 'Status updated successfully', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                    fetchDetail();
                } else {
                    Swal.fire('Error', 'Failed to update status', 'error');
                }
            } catch {
                Swal.fire('Error', 'Connection failed', 'error');
            }
        }
    };

    const handleCaseLink = async (caseId) => {
        const confirm = await Swal.fire({
            title: 'Update Case Link?',
            text: caseId ? 'Link this evidence to the selected case?' : 'Unlink this evidence from its case?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7367f0',
            confirmButtonText: 'Confirm Update'
        });
        if (!confirm.isConfirmed) return;

        try {
            const res = await authFetch(`http://localhost:3001/evidence/${hash}/case`, {
                method: 'PUT',
                body: JSON.stringify({ caseId: caseId || null }),
            });
            if (res.ok) {
                Swal.fire({ title: 'Linked', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                fetchDetail();
            }
        } catch { }
    };

    const handleCustodySubmit = async (e) => {
        e.preventDefault(); if (!custodyAction) return;
        setCustodyLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/evidence/${hash}/custody`, {
                method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: custodyAction, notes: custodyNotes }),
            });
            if (res.ok) { setCustodyAction(''); setCustodyNotes(''); setShowCustodyForm(false); fetchDetail(); }
        } catch { }
        finally { setCustodyLoading(false); }
    };

    const handleAddNote = async (e) => {
        e.preventDefault(); if (!noteText.trim()) return;
        setNoteLoading(true);
        try {
            await authFetch(`http://localhost:3001/evidence/${hash}/notes`, {
                method: 'POST',
                body: JSON.stringify({ text: noteText }),
            });
            setNoteText(''); fetchDetail();
        } catch { }
        finally { setNoteLoading(false); }
    };

    const handleIntegrityCheck = async () => {
        setIntegrityLoading(true); setIntegrityResult(null);
        try {
            const res = await authFetch(`http://localhost:3001/evidence/${hash}/verify-integrity`);
            if (res.ok) setIntegrityResult(await res.json());
        } catch { }
        finally { setIntegrityLoading(false); }
    };

    const handleGenerateReport = async () => {
        setReportLoading(true); setReport(null);
        try {
            const res = await authFetch(`http://localhost:3001/evidence/${hash}/report`);
            if (res.ok) setReport(await res.json());
        } catch { }
        finally { setReportLoading(false); }
    };

    const formatBytes = (b) => !b ? '0 B' : b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
    const canManage = userPerms?.includes('Change Status');
    const canDownload = userPerms?.includes('Download Evidence');
    const canReport = userPerms?.includes('View Report');

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );
    if (error) return (
        <div className="text-center py-5">
            <p className="text-danger">{error}</p>
            <Link to="/cases" className="btn btn-label-primary mt-3">← Back to Cases</Link>
        </div>
    );

    const linkedCase = evidence?.caseId ? cases.find(c => c.id === evidence.caseId) : null;

    return (
        <div className="row">
            {/* Breadcrumb */}
            <div className="col-12">
                <nav aria-label="breadcrumb" className="mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link to="/cases">Cases</Link></li>
                        {linkedCase && <li className="breadcrumb-item"><Link to={`/cases/detail/${linkedCase.id}`}>{linkedCase.title}</Link></li>}
                        <li className="breadcrumb-item active">Evidence Detail</li>
                    </ol>
                </nav>
            </div>

            {/* Evidence Header Card */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <div className="badge bg-label-primary rounded p-2">
                                        <i className={`icon-base ti ${evidence?.mimeType?.startsWith('image/') ? 'tabler-photo' : evidence?.mimeType?.startsWith('video/') ? 'tabler-video' : 'tabler-file-description'} ti-md`}></i>
                                    </div>
                                    <h5 className="mb-0">{evidence?.fileName}</h5>
                                    <span className={`badge ${STATUS_BADGE[evidence?.status] || 'bg-label-secondary'}`}>{evidence?.status}</span>
                                </div>
                                <div className="d-flex align-items-center gap-3 flex-wrap mb-2">
                                    <small className="text-muted">
                                        <i className="icon-base ti tabler-file ti-xs me-1"></i>{formatBytes(evidence?.fileSize)} &bull; {evidence?.mimeType || 'Unknown'}
                                    </small>
                                    <small className="text-muted">
                                        <i className="icon-base ti tabler-user ti-xs me-1"></i>Uploaded by {evidence?.uploadedBy}
                                    </small>
                                    <small className="text-muted">
                                        <i className="icon-base ti tabler-calendar ti-xs me-1"></i>{new Date(evidence?.timestamp).toLocaleString()}
                                    </small>
                                    {evidence?.category && (
                                        <span className="badge bg-label-info">{evidence.category}</span>
                                    )}
                                </div>
                                {linkedCase && (
                                    <small className="text-muted">
                                        <i className="icon-base ti tabler-folder ti-xs me-1"></i>Case: <Link to={`/cases/detail/${linkedCase.id}`} className="fw-semibold">{linkedCase.title}</Link>
                                    </small>
                                )}
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                {canDownload && (
                                    <button onClick={handleDownload} disabled={downloading} className="btn btn-label-primary">
                                        {downloading ? <><span className="spinner-border spinner-border-sm me-2"></span>Downloading</> : <><i className="icon-base ti tabler-download me-2"></i>Download</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hash Row */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header border-bottom">
                        <h6 className="card-title mb-0">
                            <i className="icon-base ti tabler-shield-check text-primary me-2"></i>Cryptographic Fingerprints
                        </h6>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            {[
                                { label: 'SHA-256 (Primary)', value: evidence?.hash, color: 'success' },
                                { label: 'SHA-1', value: evidence?.sha1, color: 'info' },
                                { label: 'MD5', value: evidence?.md5, color: 'warning' },
                            ].filter(h => h.value).map(h => (
                                <div key={h.label} className="col-12">
                                    <label className="form-label text-uppercase small fw-bold mb-1" style={{ letterSpacing: '.5px' }}>{h.label}</label>
                                    <code className={`d-block bg-light p-2 rounded small text-break border border-${h.color === 'success' ? 'success' : h.color === 'info' ? 'info' : 'warning'} border-opacity-25`}>
                                        {h.value}
                                    </code>
                                </div>
                            ))}
                            {evidence?.txHash && (
                                <div className="col-12">
                                    <label className="form-label text-uppercase small fw-bold mb-1">Blockchain Transaction</label>
                                    <code className="d-block bg-light p-2 rounded small text-break text-primary">{evidence.txHash}</code>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status & Management (Unified Board Style) */}
            {canManage && (
                <div className="col-12 mb-4">
                    <div className="row g-4">
                        <div className="col-12 col-md-8">
                            <div className="card">
                                <div className="card-header border-bottom">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="icon-base ti tabler-settings text-primary"></i>
                                        <h6 className="card-title mb-0">Evidence Status Workflow</h6>
                                    </div>
                                </div>
                                <div className="card-body py-4">
                                    <div className="status-selection-group">
                                        {STATUSES.map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => handleStatusChange(s)}
                                                className={`status-btn ${evidence?.status === s ? 'active' : ''}`}
                                            >
                                                <i className={`icon-base ti ${evidence?.status === s ? 'tabler-circle-check-filled' : 'tabler-circle'} ti-xs`}></i>
                                                <span>{s}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-footer bg-light py-2">
                                    <small className="text-muted"><i className="icon-base ti tabler-info-circle ti-xs me-1"></i>Secure authorization required for every status change.</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="card h-100">
                                <div className="card-header border-bottom">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="icon-base ti tabler-link text-primary"></i>
                                        <h6 className="card-title mb-0">Case Association</h6>
                                    </div>
                                </div>
                                <div className="card-body d-flex flex-column justify-content-center">
                                    <label className="form-label small text-muted">Investigation Connection</label>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center py-2"
                                        data-bs-toggle="offcanvas" 
                                        data-bs-target="#caseLinkDrawer"
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="icon-base ti tabler-folder ti-sm"></i>
                                            <span>{linkedCase ? linkedCase.title : '— NO ACTIVE CASE —'}</span>
                                        </div>
                                        <i className="icon-base ti tabler-chevron-right ti-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-header border-bottom p-0">
                        <ul className="nav nav-tabs card-header-tabs px-3" role="tablist">
                            {[
                                { key: 'custody', label: 'Chain of Custody', icon: 'tabler-shield' },
                                { key: 'notes', label: 'Notes', icon: 'tabler-message' },
                                { key: 'integrity', label: 'Integrity', icon: 'tabler-shield-check' },
                                { key: 'metadata', label: 'Metadata', icon: 'tabler-info-circle' },
                            ].map(tab => (
                                <li key={tab.key} className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === tab.key ? 'active font-bold' : ''}`}
                                        onClick={() => setActiveTab(tab.key)}
                                        style={{ marginTop: '0.1rem' }}>
                                        <i className={`icon-base ti ${tab.icon} ti-sm`}></i>
                                        <span>{tab.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="card-body p-6">

                        {/* Custody Tab */}
                        {activeTab === 'custody' && (
                            <div>
                                {canManage && (
                                    <div className="mb-4">
                                        {!showCustodyForm ? (
                                            <button onClick={() => setShowCustodyForm(true)} className="btn btn-primary shadow-sm">
                                                <i className="icon-base ti tabler-plus ti-xs me-2"></i>Add Custody Event
                                            </button>
                                        ) : (
                                            <form onSubmit={handleCustodySubmit} className="p-3 bg-light rounded border">
                                                <div className="row g-3 mb-3">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold">Custody Action</label>
                                                        <select className="form-select" value={custodyAction} onChange={e => setCustodyAction(e.target.value)} required>
                                                            <option value="">Select action…</option>
                                                            {CUSTODY_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold">Notes / Details</label>
                                                        <input type="text" className="form-control" value={custodyNotes} onChange={e => setCustodyNotes(e.target.value)} placeholder="e.g. Received from Forensic Lab" />
                                                    </div>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button type="submit" className="btn btn-primary" disabled={custodyLoading}>
                                                        {custodyLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Recording...</> : <><i className="icon-base ti tabler-check ti-xs me-2"></i>Record Event</>}
                                                    </button>
                                                    <button type="button" className="btn btn-label-secondary" onClick={() => setShowCustodyForm(false)}>Cancel</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}

                                {evidence?.custodyLog?.length > 0 ? (
                                    <ul className="timeline pb-0 mb-0">
                                        {[...evidence.custodyLog].reverse().map((event, i) => (
                                            <li key={i} className={`timeline-item timeline-item-transparent ${i === evidence.custodyLog.length - 1 ? 'border-transparent' : ''}`}>
                                                <span className="timeline-point timeline-point-primary"></span>
                                                <div className="timeline-event">
                                                    <div className="timeline-header mb-1">
                                                        <h6 className="mb-0">{event.action?.replace(/_/g, ' ')}</h6>
                                                        <small className="text-muted">{new Date(event.timestamp).toLocaleString()}</small>
                                                    </div>
                                                    <p className="mb-1 text-muted">{event.by || event.handledBy || event.officer}</p>
                                                    {event.notes && <small className="text-muted fst-italic">{event.notes}</small>}
                                                    {event.txHash && <div className="mt-1"><span className="badge bg-label-success">TX ✓</span></div>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-muted">No custody events recorded yet.</p>
                                )}
                            </div>
                        )}

                        {/* Notes Tab */}
                        {activeTab === 'notes' && (
                            <div>
                                <form onSubmit={handleAddNote} className="mb-4">
                                    <div className="input-group">
                                        <textarea className="form-control" rows="2" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add an investigator note…"></textarea>
                                        <button type="submit" className="btn btn-primary" disabled={noteLoading}>
                                            {noteLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="icon-base ti tabler-send"></i>}
                                        </button>
                                    </div>
                                </form>

                                {evidence?.notes?.length > 0 ? (
                                    <div className="d-flex flex-column gap-3">
                                        {[...evidence.notes].reverse().map((note, i) => (
                                            <div key={i} className="d-flex gap-3">
                                                <div className="avatar flex-shrink-0">
                                                    <div className="w-px-38 h-px-38 rounded-circle bg-label-primary d-flex align-items-center justify-content-center fw-bold small">
                                                        {note.author?.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <h6 className="mb-0">{note.author}</h6>
                                                        <small className="text-muted">{new Date(note.timestamp).toLocaleString()}</small>
                                                    </div>
                                                    <p className="mb-0 text-body">{note.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No notes added yet.</p>
                                )}
                            </div>
                        )}

                        {/* Integrity Tab */}
                        {activeTab === 'integrity' && (
                            <div>
                                <button onClick={handleIntegrityCheck} disabled={integrityLoading} className="btn btn-primary mb-4">
                                    {integrityLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Verifying…</> : <><i className="icon-base ti tabler-shield-check me-2"></i>Run Integrity Check</>}
                                </button>

                                {integrityResult && (
                                    <div className={`alert ${integrityResult.intact ? 'alert-success' : 'alert-danger'}`}>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <i className={`icon-base ti ${integrityResult.intact ? 'tabler-check' : 'tabler-x'} ti-md`}></i>
                                            <strong>{integrityResult.intact ? 'Evidence Intact' : 'Integrity Compromised'}</strong>
                                        </div>
                                        <p className="mb-1 small">Chain verified: <strong>{integrityResult.chainVerified ? 'Yes' : 'No'}</strong></p>
                                        <p className="mb-0 small">{integrityResult.message}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Metadata Tab */}
                        {activeTab === 'metadata' && (
                            <div>
                                <div className="row g-3 mb-4">
                                    {[
                                        { label: 'File Name', value: evidence?.fileName },
                                        { label: 'File Size', value: formatBytes(evidence?.fileSize) },
                                        { label: 'MIME Type', value: evidence?.mimeType },
                                        { label: 'Category', value: evidence?.category },
                                        { label: 'Tags', value: evidence?.tags },
                                        { label: 'Uploaded By', value: evidence?.uploadedBy },
                                        { label: 'Upload Date', value: new Date(evidence?.timestamp).toLocaleString() },
                                        { label: 'Downloads', value: evidence?.downloadCount || 0 },
                                    ].map(row => row.value ? (
                                        <div key={row.label} className="col-sm-6 col-md-4">
                                            <label className="text-uppercase small fw-bold text-muted d-block mb-1">{row.label}</label>
                                            <span className="text-body">{row.value}</span>
                                        </div>
                                    ) : null)}
                                </div>

                                {evidence?.metadata && (
                                    <div>
                                        <label className="form-label text-uppercase small fw-bold">Handover Metadata</label>
                                        <pre className="bg-light border rounded p-3 small fst-italic text-muted" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {evidence.metadata}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report */}
            {report && (
                <div className="col-12 mb-4">
                    <div className="card border-primary shadow-sm mb-4">
                        <div className="card-header border-bottom d-flex align-items-center justify-content-between bg-primary-subtle py-3">
                            <div className="d-flex align-items-center gap-2">
                                <i className="icon-base ti tabler-file-report text-primary fs-4"></i>
                                <h5 className="card-title mb-0 text-primary fw-bold">{report.title}</h5>
                            </div>
                            <span className="badge bg-primary rounded-pill px-3 py-2 fs-6">{report.standard}</span>
                        </div>
                        <div className="card-body p-4 bg-lighter">
                            
                            <div className="row g-4">
                                {/* Metadata */}
                                <div className="col-12 col-md-4">
                                    <div className="card h-100 border-0 shadow-sm rounded-3">
                                        <div className="card-body">
                                            <h6 className="text-uppercase small fw-bold text-muted mb-3 d-flex align-items-center gap-2">
                                                <i className="icon-base ti tabler-user"></i> Report Metadata
                                            </h6>
                                            <div className="mb-3">
                                                <label className="small text-muted d-block mb-1">Generated At</label>
                                                <span className="fw-medium">{new Date(report.generatedAt).toLocaleString()}</span>
                                            </div>
                                            <div className="mb-3">
                                                <label className="small text-muted d-block mb-1">Analyst</label>
                                                <span className="fw-medium">{report.generatedBy}</span> <span className="badge bg-label-secondary ms-1">{report.generatedByRole}</span>
                                            </div>
                                            {report.case && (
                                                <div className="mb-0">
                                                    <label className="small text-muted d-block mb-1">Case Reference</label>
                                                    <span className="fw-bold text-primary">{report.case.caseNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence Overview */}
                                <div className="col-12 col-md-4">
                                    <div className="card h-100 border-0 shadow-sm rounded-3">
                                        <div className="card-body">
                                            <h6 className="text-uppercase small fw-bold text-muted mb-3 d-flex align-items-center gap-2">
                                                <i className="icon-base ti tabler-file-info"></i> Evidence Overview
                                            </h6>
                                            {report.evidence && (
                                                <>
                                                    <div className="mb-3 text-truncate">
                                                        <label className="small text-muted d-block mb-1">File Name</label>
                                                        <span className="fw-medium" title={report.evidence.fileName}>{report.evidence.fileName}</span>
                                                    </div>
                                                    <div className="row g-3 mb-0">
                                                        <div className="col-6">
                                                            <label className="small text-muted d-block mb-1">Category</label>
                                                            <span className="badge bg-label-info text-wrap">{report.evidence.category}</span>
                                                        </div>
                                                        <div className="col-6">
                                                            <label className="small text-muted d-block mb-1">Status</label>
                                                            <span className={`badge ${report.evidence.status === 'Court-Ready' ? 'bg-label-success' : 'bg-label-warning'} text-wrap`}>{report.evidence.status}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Integrity Status */}
                                <div className="col-12 col-md-4">
                                    <div className="card h-100 border-0 shadow-sm rounded-3">
                                        <div className="card-body d-flex flex-column justify-content-center text-center py-4">
                                            <div className="mb-3">
                                                <div className={`avatar avatar-xl mx-auto rounded-circle d-flex align-items-center justify-content-center ${report.integrityStatus === 'INTACT' ? 'bg-label-success' : 'bg-label-danger'}`} style={{ width: '80px', height: '80px' }}>
                                                    <i className={`icon-base ti ${report.integrityStatus === 'INTACT' ? 'tabler-shield-check text-success' : 'tabler-shield-x text-danger'}`} style={{ fontSize: '2.5rem' }}></i>
                                                </div>
                                            </div>
                                            <h4 className={`mb-1 fw-bold ${report.integrityStatus === 'INTACT' ? 'text-success' : 'text-danger'}`}>{report.integrityStatus}</h4>
                                            <span className="text-muted small">Validated across {report.totalCustodyEvents} recorded events</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cryptographic Hashes */}
                                <div className="col-12 col-lg-6">
                                    <div className="card h-100 border-0 shadow-sm rounded-3">
                                        <div className="card-body">
                                            <h6 className="text-uppercase small fw-bold text-muted mb-3 d-flex align-items-center gap-2">
                                                <i className="icon-base ti tabler-lock text-warning"></i> Cryptographic Hashes
                                            </h6>
                                            {report.hashes && Object.entries(report.hashes).map(([alg, h]) => (
                                                <div key={alg} className="mb-3 border-bottom pb-2">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="fw-bold text-uppercase small text-body">{alg}</span>
                                                    </div>
                                                    <code className="d-block bg-label-secondary text-body p-2 rounded small text-break border">{h}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Blockchain Verification */}
                                <div className="col-12 col-lg-6">
                                    <div className="card h-100 border-0 shadow-sm rounded-3">
                                        <div className="card-body">
                                            <h6 className="text-uppercase small fw-bold text-muted mb-3 d-flex align-items-center gap-2">
                                                <i className="icon-base ti tabler-link text-primary"></i> Blockchain Anchoring
                                            </h6>
                                            {report.blockchain && report.blockchain.uploader ? (
                                                <div className="d-flex flex-column h-100 justify-content-center gap-3">
                                                    <div>
                                                        <span className="d-block small text-uppercase text-muted fw-bold mb-1">Smart Contract Transaction</span>
                                                        <code className="d-block bg-label-primary text-primary p-2 rounded small text-break border border-primary font-monospace">{report.blockchain.fileHash || 'Verified Hash'}</code>
                                                    </div>
                                                    <div className="row g-2 mt-1">
                                                        <div className="col-12">
                                                            <span className="d-block small text-muted d-block mb-1">Uploader Wallet Address</span>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className="icon-base ti tabler-wallet text-muted"></i>
                                                                <span className="fw-semibold font-monospace">{report.blockchain.uploader}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-12 mt-3">
                                                            <span className="d-block small text-muted mb-1">Network Timestamp</span>
                                                            <span className="fw-medium">
                                                                <i className="icon-base ti tabler-clock me-1 text-muted"></i>
                                                                {new Date(report.blockchain.timestamp).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-5 h-100 d-flex flex-column justify-content-center">
                                                    <i className="icon-base ti tabler-clock-x text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                                                    <p className="text-muted mb-0 fw-medium">No blockchain transaction verified</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="d-print-none mt-4 text-center">
                                <button className="btn btn-primary" onClick={() => window.print()}>
                                    <i className="icon-base ti tabler-printer me-2"></i> Print Official Report
                                </button>
                            </div>

                        </div>
                    </div>
                    {/* Case Link Selection Offcanvas (Drawer) */}
                    <div className="offcanvas offcanvas-end" tabIndex="-1" id="caseLinkDrawer" aria-labelledby="caseLinkDrawerLabel">
                        <div className="offcanvas-header border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <i className="icon-base ti tabler-link text-primary"></i>
                                <h5 id="caseLinkDrawerLabel" className="offcanvas-title fw-bold">Link to Investigation</h5>
                            </div>
                            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                        </div>
                        <div className="offcanvas-body p-0">
                            <div className="list-group list-group-flush">
                                <button 
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 px-4 border-0 ${!evidence?.caseId ? 'bg-label-secondary active' : ''}`}
                                    onClick={() => handleCaseLink('')}
                                    data-bs-dismiss="offcanvas"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="avatar avatar-sm bg-label-secondary">
                                            <span className="avatar-initial rounded">
                                                <i className="icon-base ti tabler-folder-off ti-xs"></i>
                                            </span>
                                        </div>
                                        <span className="fw-medium text-muted">No Active Case Association</span>
                                    </div>
                                    {!evidence?.caseId && <i className="icon-base ti tabler-check text-primary"></i>}
                                </button>
                                
                                {cases.map(c => (
                                    <button 
                                        key={c.id}
                                        type="button"
                                        className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 px-4 border-0 ${evidence?.caseId === c.id ? 'bg-label-primary active' : ''}`}
                                        onClick={() => handleCaseLink(c.id)}
                                        data-bs-dismiss="offcanvas"
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`avatar avatar-sm ${evidence?.caseId === c.id ? 'bg-primary text-white' : 'bg-label-primary text-primary'}`}>
                                                <span className="avatar-initial rounded">
                                                    <i className="icon-base ti tabler-folder ti-xs"></i>
                                                </span>
                                            </div>
                                            <div>
                                                <span className="fw-medium d-block">{c.title}</span>
                                                <small className="text-muted">{c.caseNumber}</small>
                                            </div>
                                        </div>
                                        {evidence?.caseId === c.id && <i className="icon-base ti tabler-check text-primary"></i>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="offcanvas-footer p-4 border-top bg-light">
                            <p className="text-muted small mb-0">Linking evidence to a case creates a cryptographic association between the artifact hash and the investigation dossier.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvidenceDetail;
