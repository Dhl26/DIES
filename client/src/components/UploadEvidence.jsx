import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CATEGORIES = ['Photo', 'Video', 'Document', 'Device Image', 'Network Capture', 'Audio', 'Database', 'Email', 'Mobile Data', 'Other'];
const CATEGORY_ICONS = {
    'Photo': 'tabler-photo',
    'Video': 'tabler-video',
    'Document': 'tabler-file-text',
    'Device Image': 'tabler-device-mobile',
    'Network Capture': 'tabler-network',
    'Audio': 'tabler-volume',
    'Database': 'tabler-database',
    'Email': 'tabler-mail',
    'Mobile Data': 'tabler-device-laptop',
    'Other': 'tabler-circle-plus'
};

const DELIVERY_MODES = ['Messenger / By Hand', 'Registered Post', 'Insured Parcel'];
const DELIVERY_ICONS = {
    'Messenger / By Hand': 'tabler-hand-stop',
    'Registered Post': 'tabler-truck-delivery',
    'Insured Parcel': 'tabler-package'
};

const UploadEvidence = () => {
    const { user, authFetch } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const urlCaseId = searchParams.get('caseId') || '';
    const urlFirNo = searchParams.get('firNo') || '';

    const [file, setFile] = useState(null);
    const [fileHash, setFileHash] = useState('');

    const [category, setCategory] = useState('Other');
    const [tags, setTags] = useState('');
    const [handover, setHandover] = useState({
        forwardingAuthority: '',
        firNo: urlFirNo,
        deliveryMode: 'Messenger',
        officerName: '',
        officerId: '',
        documentsIncluded: {
            forwardingLetter: false,
            firCopy: false,
            specimenSeal: false,
        },
        remarks: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileRef = useRef(null);

    const handleFile = async (f) => {
        setFile(f);
        setResult(null);
        const buffer = await f.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        setFileHash(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
    };

    const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

    const handleHandoverChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setHandover(prev => ({
                ...prev,
                documentsIncluded: { ...prev.documentsIncluded, [name]: checked }
            }));
        } else {
            setHandover(prev => ({ ...prev, [name]: value }));
        }
    };

    const compileMetadata = () => {
        const docs = [];
        if (handover.documentsIncluded.forwardingLetter) docs.push('Forwarding Letter');
        if (handover.documentsIncluded.firCopy) docs.push('FIR Copy');
        if (handover.documentsIncluded.specimenSeal) docs.push('Specimen Seal');

        return `[HANDOVER FORM]
Authority: ${handover.forwardingAuthority || 'N/A'}
FIR/Case No: ${handover.firNo || 'N/A'}
Delivered By: ${handover.officerName || 'N/A'} (ID: ${handover.officerId || 'N/A'}) via ${handover.deliveryMode}
Docs Included: ${docs.length > 0 ? docs.join(', ') : 'None'}
Remarks: ${handover.remarks || 'None'}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setStatus({ type: 'error', message: 'Please select an evidence file first.' });
            return;
        }

        // Confirmation dialog
        const confirm = await Swal.fire({
            title: 'Register Evidence?',
            html: `<div style="text-align:left">
                <p><b>File:</b> ${file.name}</p>
                <p><b>Category:</b> ${category}</p>
                <p style="color:#d33">This will be permanently recorded on the blockchain and cannot be undone.</p>
            </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#7367f0',
            cancelButtonColor: '#adb5bd',
            confirmButtonText: 'Yes, Register',
            cancelButtonText: 'Cancel',
        });
        if (!confirm.isConfirmed) return;

        setLoading(true);
        setStatus({ type: '', message: '' });
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', compileMetadata());
        formData.append('category', category);
        formData.append('tags', tags);
        
        // Use the query param if it exists, otherwise fall back to nothing
        if (urlCaseId) {
            formData.append('caseId', urlCaseId);
        }

        try {
            const response = await authFetch('http://localhost:3001/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setResult(data);
                setStatus({ type: 'success', message: 'Evidence successfully registered on blockchain!' });
                setFile(null);
                setFileHash('');
                setTags('');
                setHandover({
                    forwardingAuthority: '', firNo: urlFirNo, deliveryMode: 'Messenger', officerName: '', officerId: '',
                    documentsIncluded: { forwardingLetter: false, firCopy: false, specimenSeal: false },
                    remarks: ''
                });
                Swal.fire({
                    title: 'Registration Successful!',
                    text: 'Digital evidence has been verified and committed to the ledger.',
                    icon: 'success',
                    confirmButtonColor: '#7367f0',
                });
            } else {
                setStatus({ type: 'error', message: data.error || 'Upload failed' });
                Swal.fire('Error', data.error || 'Upload failed', 'error');
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Connection failed' });
            Swal.fire('Error', 'Connection failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

    return (
        <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
                {/* Page header */}
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                    <div>
                        <h4 className="mb-1">Digital Evidence Intake</h4>
                        <p className="text-muted mb-0">Register evidence with multi-hash fingerprinting and blockchain timestamping.</p>
                    </div>
                    {urlCaseId && (
                        <span className="badge bg-label-primary px-3 py-2">
                            <i className="icon-base ti tabler-link me-1"></i>Linked to Case: {urlFirNo || urlCaseId}
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* File Upload */}
                    <div className="card mb-4">
                        <div className="card-header border-bottom">
                            <h5 className="card-title mb-0">1. Upload File</h5>
                        </div>
                        <div className="card-body">
                            <div
                                onDragEnter={handleDrag} onDragLeave={handleDrag}
                                onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className="cursor-pointer"
                                style={{
                                    border: `2px dashed ${dragActive ? '#7367f0' : file ? '#28a745' : '#d8d8d8'}`,
                                    borderRadius: '8px', padding: '2.5rem',
                                    textAlign: 'center', transition: 'all 0.2s',
                                    background: dragActive ? 'rgba(115,103,240,.05)' : file ? 'rgba(40,167,69,.04)' : '#fff',
                                    cursor: 'pointer'
                                }}>
                                <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
                                {file ? (
                                    <>
                                        <i className="icon-base ti tabler-file-check text-success mb-2" style={{ fontSize: '3rem' }}></i>
                                        <h5 className="mb-1">{file.name}</h5>
                                        <p className="text-muted small mb-3">{formatBytes(file.size)} &bull; {file.type || 'unknown'}</p>
                                        <div className="alert alert-success py-2 mb-0 font-monospace small text-break">
                                            <strong>SHA-256:</strong> {fileHash}
                                        </div>
                                        <small className="text-primary mt-2 d-block">Click or drop to change file</small>
                                    </>
                                ) : (
                                    <>
                                        <i className="icon-base ti tabler-upload text-primary mb-2" style={{ fontSize: '3rem' }}></i>
                                        <h5 className="mb-1">Drag &amp; drop evidence file</h5>
                                        <p className="text-muted mb-0">or click to browse &bull; Max 100MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Handover & Authority */}
                    <div className="card mb-4">
                        <div className="card-header border-bottom">
                            <h5 className="card-title mb-0">2. Handover &amp; Authority</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Forwarding Authority / Station</label>
                                    <input type="text" name="forwardingAuthority" className="form-control"
                                        value={handover.forwardingAuthority} onChange={handleHandoverChange}
                                        placeholder="e.g. Crime Branch, Sector 4" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Case / FIR No.</label>
                                    <input type="text" name="firNo" className="form-control"
                                        value={handover.firNo} onChange={handleHandoverChange}
                                        placeholder="e.g. FIR-2026/042"
                                        disabled={!!urlCaseId} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Handed Over By (Officer)</label>
                                    <input type="text" name="officerName" className="form-control"
                                        value={handover.officerName} onChange={handleHandoverChange}
                                        placeholder="e.g. Insp. Raj Patel" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Officer ID</label>
                                    <input type="text" name="officerId" className="form-control"
                                        value={handover.officerId} onChange={handleHandoverChange}
                                        placeholder="e.g. ID-8942" />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label d-flex justify-content-between align-items-center">
                                        Mode of Receipt
                                        <span className="badge bg-label-info">Selected: {handover.deliveryMode}</span>
                                    </label>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-info w-100 d-flex justify-content-between align-items-center py-2"
                                        data-bs-toggle="offcanvas" 
                                        data-bs-target="#deliveryModeDrawer"
                                    >
                                        <div className="d-flex align-items-center gap-2 text-info">
                                            <i className={`icon-base ti ${DELIVERY_ICONS[handover.deliveryMode] || 'tabler-truck'} ti-sm`}></i>
                                            <span>{handover.deliveryMode}</span>
                                        </div>
                                        <i className="icon-base ti tabler-chevron-right ti-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta & Categorization */}
                    <div className="card mb-4">
                        <div className="card-header border-bottom">
                            <h5 className="card-title mb-0">3. Meta &amp; Categorization</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Documents Included (Checklist)</label>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="forwardingLetter"
                                                id="forwardingLetter"
                                                checked={handover.documentsIncluded.forwardingLetter}
                                                onChange={handleHandoverChange} />
                                            <label className="form-check-label" htmlFor="forwardingLetter">Forwarding Letter present</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="firCopy"
                                                id="firCopy"
                                                checked={handover.documentsIncluded.firCopy}
                                                onChange={handleHandoverChange} />
                                            <label className="form-check-label" htmlFor="firCopy">Copy of FIR attached</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" name="specimenSeal"
                                                id="specimenSeal"
                                                checked={handover.documentsIncluded.specimenSeal}
                                                onChange={handleHandoverChange} />
                                            <label className="form-check-label" htmlFor="specimenSeal">Specimen Seal(s) intact</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label d-flex justify-content-between align-items-center">
                                            Evidence Category
                                            <span className="badge bg-label-primary">Selected: {category}</span>
                                        </label>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center py-2"
                                            data-bs-toggle="offcanvas" 
                                            data-bs-target="#categoryDrawer"
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`icon-base ti ${CATEGORY_ICONS[category] || 'tabler-circle-plus'} ti-sm`}></i>
                                                <span>{category}</span>
                                            </div>
                                            <i className="icon-base ti tabler-chevron-right ti-xs"></i>
                                        </button>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Search Tags / Keywords</label>
                                        <input type="text" className="form-control" value={tags} onChange={(e) => setTags(e.target.value)}
                                            placeholder="e.g. mobile, blood, cyber" />
                                    </div>
                                    <div>
                                        <label className="form-label">Forensic Collector Remarks</label>
                                        <textarea name="remarks" className="form-control" rows="2"
                                            value={handover.remarks} onChange={handleHandoverChange}
                                            placeholder="Condition of packaging, seals, unique marks..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Selection Offcanvas (Drawer) */}
                    <div className="offcanvas offcanvas-end" tabIndex="-1" id="categoryDrawer" aria-labelledby="categoryDrawerLabel">
                        <div className="offcanvas-header border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <i className="icon-base ti tabler-category text-primary"></i>
                                <h5 id="categoryDrawerLabel" className="offcanvas-title fw-bold">Select Category</h5>
                            </div>
                            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                        </div>
                        <div className="offcanvas-body p-0">
                            <div className="list-group list-group-flush">
                                {CATEGORIES.map(c => (
                                    <button 
                                        key={c}
                                        type="button"
                                        className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 px-4 border-0 ${category === c ? 'bg-label-primary active' : ''}`}
                                        onClick={() => setCategory(c)}
                                        data-bs-dismiss="offcanvas"
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`avatar avatar-sm ${category === c ? 'bg-primary text-white' : 'bg-label-secondary text-body'}`}>
                                                <span className="avatar-initial rounded">
                                                    <i className={`icon-base ti ${CATEGORY_ICONS[c] || 'tabler-circle-plus'} ti-xs`}></i>
                                                </span>
                                            </div>
                                            <span className="fw-medium">{c}</span>
                                        </div>
                                        {category === c && <i className="icon-base ti tabler-check text-primary"></i>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="offcanvas-footer p-4 border-top bg-light">
                            <p className="text-muted small mb-0">Choosing the correct category helps in specialized forensic tool automation and metadata mapping.</p>
                        </div>
                    </div>

                    {status.type === 'error' && (
                        <div className="alert alert-danger mb-4">{status.message}</div>
                    )}

                    {/* Submit */}
                    <div className="d-grid mb-4">
                        <button type="submit" className="btn btn-primary btn-lg py-3" disabled={loading}>
                            {loading ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Creating Block...</>
                            ) : (
                                <><i className="icon-base ti tabler-shield-check me-2"></i>Register to Blockchain</>
                            )}
                        </button>
                        <p className="text-center text-muted small mt-2">By registering, you execute an electronic signature on the immutable ledger.</p>
                    </div>
                </form>

                {/* Success Result */}
                {result && (
                    <div className="card border-success mb-4">
                        <div className="card-body">
                            <div className="d-flex align-items-start gap-3 mb-4">
                                <div className="badge bg-success rounded p-2"><i className="icon-base ti tabler-check ti-md"></i></div>
                                <div>
                                    <h5 className="mb-1 text-success">Registration Successful</h5>
                                    <p className="text-muted mb-0">Chain of Custody timestamp block minted.</p>
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-uppercase small fw-bold">Integrity Hash (SHA-256)</label>
                                <code className="d-block bg-light p-2 rounded small text-break">{result.hash}</code>
                            </div>
                            <div className="mb-4">
                                <label className="form-label text-uppercase small fw-bold">Blockchain Transaction</label>
                                <code className="d-block text-primary small text-break">{result.transactionHash}</code>
                            </div>
                            <div className="d-flex gap-3">
                                <button onClick={() => navigate(`/evidence/${result.hash}`)} className="btn btn-label-primary flex-fill">
                                    <i className="icon-base ti tabler-eye me-2"></i>View Evidence Profile
                                </button>
                                {urlCaseId && (
                                    <button onClick={() => navigate(`/cases/detail/${urlCaseId}`)} className="btn btn-label-secondary flex-fill">
                                        <i className="icon-base ti tabler-arrow-left me-2"></i>Return to Case
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Mode of Receipt Selection Offcanvas (Drawer) */}
                <div className="offcanvas offcanvas-end" tabIndex="-1" id="deliveryModeDrawer" aria-labelledby="deliveryModeDrawerLabel">
                    <div className="offcanvas-header border-bottom">
                        <div className="d-flex align-items-center gap-2">
                            <i className="icon-base ti tabler-truck text-info"></i>
                            <h5 id="deliveryModeDrawerLabel" className="offcanvas-title fw-bold">Mode of Receipt</h5>
                        </div>
                        <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    </div>
                    <div className="offcanvas-body p-0">
                        <div className="list-group list-group-flush">
                            {DELIVERY_MODES.map(m => (
                                <button 
                                    key={m}
                                    type="button"
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-3 px-4 border-0 ${handover.deliveryMode === m ? 'bg-label-info active' : ''}`}
                                    onClick={() => handleHandoverChange({ target: { name: 'deliveryMode', value: m } })}
                                    data-bs-dismiss="offcanvas"
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`avatar avatar-sm ${handover.deliveryMode === m ? 'bg-info text-white' : 'bg-label-info text-info'}`}>
                                            <span className="avatar-initial rounded">
                                                <i className={`icon-base ti ${DELIVERY_ICONS[m] || 'tabler-truck'} ti-xs`}></i>
                                            </span>
                                        </div>
                                        <span className="fw-medium">{m}</span>
                                    </div>
                                    {handover.deliveryMode === m && <i className="icon-base ti tabler-check text-info"></i>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="offcanvas-footer p-4 border-top bg-light">
                        <p className="text-muted small mb-0">The receiving officer must verify the delivery method to ensure the chain of custody integrity is maintained during transport.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadEvidence;

