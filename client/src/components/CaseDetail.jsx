import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PRIORITY_BADGE = {
    'Critical': 'bg-danger',
    'High': 'bg-warning',
    'Medium': 'bg-info',
    'Low': 'bg-success',
};

const CaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userPerms } = useContext(AuthContext);

    const [caseData, setCaseData] = useState(null);
    const [evidenceItems, setEvidenceItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const headers = { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const casesRes = await fetch('http://localhost:3001/cases', { headers });
            if (casesRes.ok) {
                const casesList = await casesRes.json();
                const found = casesList.find(c => c.id === id);
                if (found) setCaseData(found);
            }
            const evRes = await fetch(`http://localhost:3001/evidence?caseId=${id}`, { headers });
            if (evRes.ok) setEvidenceItems(await evRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async () => {
        const nextStatus = caseData.status === 'Open' ? 'Closed' : 'Open';
        await fetch(`http://localhost:3001/cases/${id}`, {
            method: 'PUT', headers,
            body: JSON.stringify({ status: nextStatus }),
        });
        fetchData();
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );
    if (!caseData) return (
        <div className="text-center py-5">
            <p className="text-muted">Case not found. <Link to="/cases">Go back</Link></p>
        </div>
    );

    const canUpload = userPerms?.includes('Upload Evidence');
    const canManage = userPerms?.includes('Close Case') || userPerms?.includes('Update Case');

    return (
        <div className="row">
            {/* breadcrumb */}
            <div className="col-12 mb-4">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link to="/cases">Cases</Link></li>
                        <li className="breadcrumb-item active">{caseData.caseNumber}</li>
                    </ol>
                </nav>
            </div>

            {/* Case Header */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <h4 className="mb-0">{caseData.title}</h4>
                                    <span className={`badge ${PRIORITY_BADGE[caseData.priority] || 'bg-secondary'}`}>{caseData.priority} Priority</span>
                                    <span className={`badge ${caseData.status === 'Open' ? 'bg-success' : 'bg-secondary'}`}>{caseData.status}</span>
                                </div>
                                <p className="text-muted mb-3">{caseData.description || 'No description provided.'}</p>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <small className="text-muted">
                                        <i className="icon-base ti tabler-user me-1"></i>Created by <strong>{caseData.createdBy}</strong>
                                    </small>
                                    <small className="text-muted">
                                        <i className="icon-base ti tabler-calendar me-1"></i>{new Date(caseData.createdAt).toLocaleDateString()}
                                    </small>
                                    <small className="text-muted font-monospace">
                                        <i className="icon-base ti tabler-id me-1"></i>{caseData.caseNumber}
                                    </small>
                                </div>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                {canManage && (
                                    <button onClick={handleStatusToggle} className="btn btn-label-secondary">
                                        {caseData.status === 'Open' ? 'Mark as Closed' : 'Reopen Case'}
                                    </button>
                                )}
                                {canUpload && caseData.status === 'Open' && (
                                    <Link
                                        to={`/upload?caseId=${id}&firNo=${caseData.caseNumber}`}
                                        className="btn btn-primary"
                                    >
                                        <i className="icon-base ti tabler-plus me-2"></i>Add Evidence
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evidence linked to this case */}
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between border-bottom">
                        <div>
                            <h5 className="card-title mb-0">Linked Evidence</h5>
                            <small className="text-muted">Items securely tracked in this case</small>
                        </div>
                        <span className="badge bg-label-primary rounded-pill">{evidenceItems.length} items</span>
                    </div>

                    {evidenceItems.length === 0 ? (
                        <div className="card-body text-center py-5">
                            <i className="icon-base ti tabler-file-off text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                            <h5 className="mb-1">No Evidence Yet</h5>
                            <p className="text-muted mb-4">Click "Add Evidence" above to register items to this case.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>File</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Uploaded</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evidenceItems.map(ev => (
                                        <tr key={ev.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="badge bg-label-primary rounded p-2">
                                                        <i className={`icon-base ti ${ev.mimeType?.startsWith('image/') ? 'tabler-photo' : ev.mimeType?.startsWith('video/') ? 'tabler-video' : 'tabler-file'} ti-sm`}></i>
                                                    </div>
                                                    <div>
                                                        <Link to={`/evidence/${ev.hash}`} className="fw-semibold text-body d-block text-truncate" style={{ maxWidth: '260px' }}>
                                                            {ev.fileName}
                                                        </Link>
                                                        <small className="text-muted text-truncate d-block" style={{ maxWidth: '260px' }}>{ev.metadata || '—'}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="badge bg-label-secondary">{ev.category || 'Other'}</span></td>
                                            <td><span className="badge bg-label-info">{ev.status}</span></td>
                                            <td><small className="text-muted">{new Date(ev.timestamp).toLocaleDateString()}</small></td>
                                            <td>
                                                <Link to={`/evidence/${ev.hash}`} className="btn btn-sm btn-label-primary">
                                                    <i className="icon-base ti tabler-eye me-1"></i>View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaseDetail;
