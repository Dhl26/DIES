import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const VerifyEvidence = () => {
    const [hash, setHash] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [fileInfo, setFileInfo] = useState(null);
    const dropRef = useRef(null);

    const handleFileDrop = async (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (!file) return;

        setFileInfo({ name: file.name, size: file.size, type: file.type });
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setHash(hexHash);
    };

    const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!hash.trim()) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const res = await fetch(`http://localhost:3001/verify/${hash.trim()}`);
            const data = await res.json();
            setResult(data);
        } catch {
            setError('Connection failed. Ensure the backend server is running.');
        } finally { setLoading(false); }
    };

    const formatBytes = (b) => !b ? '0 B' : b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

    return (
        <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
                {/* Header */}
                <div className="mb-4">
                    <h4 className="mb-1">Verify Evidence</h4>
                    <p className="text-muted mb-0">Check evidence integrity against the blockchain — <span className="text-success fw-semibold">no login required</span></p>
                </div>

                {/* Drop Zone */}
                <div
                    ref={dropRef}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleFileDrop}
                    className={`card mb-4 border-2 border-dashed text-center ${dragActive ? 'border-primary' : fileInfo ? 'border-success' : 'border-secondary'}`}
                    style={{ cursor: 'pointer' }}>
                    <div className="card-body py-5">
                        <input type="file" onChange={handleFileDrop} className="d-none" id="fileInput" />
                        <label htmlFor="fileInput" className="cursor-pointer d-block mb-0" style={{ cursor: 'pointer' }}>
                            {fileInfo ? (
                                <div>
                                    <div className="badge bg-label-success rounded p-3 mb-3 d-inline-flex">
                                        <i className="icon-base ti tabler-file-check ti-lg"></i>
                                    </div>
                                    <h5 className="mb-1">{fileInfo.name}</h5>
                                    <p className="text-muted mb-0">{formatBytes(fileInfo.size)} &bull; Hash computed ✓</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="badge bg-label-secondary rounded p-3 mb-3 d-inline-flex">
                                        <i className="icon-base ti tabler-upload ti-lg"></i>
                                    </div>
                                    <h6 className="mb-1 text-muted">Drop a file to auto-compute its hash</h6>
                                    <small className="text-muted">or click to browse</small>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                {/* Hash Input & Verify */}
                <div className="card mb-4">
                    <div className="card-body">
                        <form onSubmit={handleVerify}>
                            <label className="form-label fw-semibold">SHA-256 Hash</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="icon-base ti tabler-hash"></i></span>
                                <input type="text" className="form-control font-monospace" value={hash} onChange={e => setHash(e.target.value)}
                                    placeholder="Or paste SHA-256 hash here…" />
                                <button type="submit" disabled={!hash.trim() || loading} className="btn btn-primary">
                                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="icon-base ti tabler-search me-2"></i>}
                                    Verify
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {error && <div className="alert alert-danger mb-4">{error}</div>}

                {/* Result */}
                {result && (
                    <div className={`card border-${result.verified ? 'success' : 'danger'} mb-4`}>
                        <div className="card-body">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className={`badge bg-label-${result.verified ? 'success' : 'danger'} rounded p-3`}>
                                    <i className={`icon-base ti ${result.verified ? 'tabler-shield-check' : 'tabler-shield-x'} ti-lg`}></i>
                                </div>
                                <div>
                                    <h5 className={`mb-1 text-${result.verified ? 'success' : 'danger'}`}>
                                        {result.verified ? (result.simulated ? 'Evidence Verified (Simulated)' : 'Evidence Verified') : 'Not Found'}
                                        {result.simulated && <span className="badge bg-label-warning ms-2">Blockchain Offline</span>}
                                    </h5>
                                    <p className="text-muted mb-0 small">
                                        {result.verified ? (result.simulated ? 'Validated against secure local records (Simulation Mode).' : 'Blockchain record matches. Evidence is authentic.') : 'No blockchain record found for this hash.'}
                                    </p>
                                </div>
                            </div>

                            {result.verified && result.evidence && (
                                <>
                                    <div className="row g-3 mb-4">
                                        {[
                                            ['Blockchain Uploader', result.evidence.uploader?.substring(0, 26) + '…'],
                                            ['Registered', new Date(result.evidence.timestamp).toLocaleString()],
                                        ].map(([l, v]) => (
                                            <div key={l} className="col-sm-6">
                                                <label className="form-label text-uppercase small fw-bold text-muted mb-1">{l}</label>
                                                <div className="text-body">{v}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {result.local && (
                                        <>
                                            <hr />
                                            <h6 className="text-uppercase small fw-bold text-muted mb-3">Local Registry</h6>
                                            <div className="row g-3 mb-3">
                                                {[
                                                    ['File Name', result.local.fileName],
                                                    ['File Size', formatBytes(result.local.fileSize)],
                                                    ['Uploaded By', result.local.uploadedBy],
                                                    ['Status', result.local.status],
                                                ].map(([l, v]) => (
                                                    <div key={l} className="col-sm-6 col-md-3">
                                                        <label className="form-label text-uppercase small fw-bold text-muted mb-1">{l}</label>
                                                        <div className="text-body">{v}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {result.local.tags?.length > 0 && (
                                                <div className="mb-3">
                                                    {result.local.tags.map((t, i) => (
                                                        <span key={i} className="badge bg-label-info me-1 mb-1">{t}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {result.local.custodyLog?.length > 0 && (
                                                <div>
                                                    <h6 className="text-uppercase small fw-bold text-muted mb-3">
                                                        Chain of Custody <span className="badge bg-label-secondary ms-1">{result.local.custodyLog.length}</span>
                                                    </h6>
                                                    <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        <table className="table table-sm table-striped mb-0">
                                                            <thead>
                                                                <tr><th>#</th><th>Action</th><th>By</th><th>Role</th><th>Date</th></tr>
                                                            </thead>
                                                            <tbody>
                                                                {result.local.custodyLog.map((e, i) => (
                                                                    <tr key={i}>
                                                                        <td className="text-muted small">{i + 1}</td>
                                                                        <td className="small">{e.action?.replace(/_/g, ' ')}</td>
                                                                        <td className="small">{e.by}</td>
                                                                        <td><span className="badge bg-label-secondary">{e.role}</span></td>
                                                                        <td className="text-muted small">{new Date(e.timestamp).toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="mt-4 text-center">
                                        <Link to={`/evidence/${hash}`} className="btn btn-label-primary btn-sm">
                                            <i className="icon-base ti tabler-external-link me-2"></i>View Full Evidence Detail
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEvidence;
