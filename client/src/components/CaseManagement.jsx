import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PRIORITY_BADGE = {
    'Critical': 'bg-label-danger',
    'High': 'bg-label-warning',
    'Medium': 'bg-label-info',
    'Low': 'bg-label-success',
};

const CaseManagement = () => {
    const { user, authFetch } = useContext(AuthContext);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchCases(); }, []);

    const fetchCases = async () => {
        try {
            const res = await authFetch('http://localhost:3001/cases');
            if (res.ok) setCases(await res.json());
        } catch { }
        finally { setLoading(false); }
    };
    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="row">
            {/* Page header */}
            <div className="col-12 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div>
                        <h4 className="mb-1">Case Management</h4>
                        <p className="text-muted mb-0">{cases.length} case{cases.length !== 1 ? 's' : ''} · Organize and track evidence by investigation</p>
                    </div>
                    {['Case Agent', 'Admin'].includes(user?.role) && (
                        <Link to="/cases/new" className="btn btn-primary">
                            <i className="icon-base ti tabler-plus me-2"></i>Create New Case
                        </Link>
                    )}
                </div>
            </div>

            {/* Cases */}
            {cases.length === 0 ? (
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <i className="icon-base ti tabler-folders text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                            <h5 className="mb-2">No Cases Found</h5>
                            <p className="text-muted mb-4">Create your first investigation case to organize evidence and track chain of custody.</p>
                            {['Case Agent', 'Admin'].includes(user?.role) && (
                                <Link to="/cases/new" className="btn btn-primary">
                                    <i className="icon-base ti tabler-plus me-2"></i>Create New Case
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                cases.map(c => (
                    <div key={c.id} className="col-sm-6 col-xl-4 mb-4">
                        <div className="card h-100">
                            <div className="card-body d-flex flex-column">
                                <div className="d-flex align-items-start justify-content-between mb-3">
                                    <div className={`badge ${c.status === 'Open' ? 'bg-label-success' : 'bg-label-secondary'} rounded p-2`}>
                                        <i className={`icon-base ti ${c.status === 'Open' ? 'tabler-folder-open' : 'tabler-folder'} ti-md`}></i>
                                    </div>
                                    <div className="text-end">
                                        <small className="text-muted d-block font-monospace">{c.caseNumber}</small>
                                        <span className={`badge ${c.status === 'Open' ? 'bg-success' : 'bg-secondary'} mt-1`}>{c.status}</span>
                                    </div>
                                </div>

                                <h5 className="card-title mb-1 text-truncate">{c.title}</h5>
                                <p className="text-muted small mb-3 flex-grow-1" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {c.description || 'No description provided.'}
                                </p>

                                <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-auto">
                                    <div>
                                        <small className="text-muted d-block font-sans">Created On</small>
                                        <small className="fw-semibold">{new Date(c.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <span className={`badge ${PRIORITY_BADGE[c.priority] || 'bg-label-secondary'}`}>{c.priority}</span>
                                </div>

                                <Link to={`/cases/detail/${c.id}`} className="btn btn-label-primary w-100 mt-3 align-items-center d-flex justify-content-center">
                                    <i className="icon-base ti tabler-eye me-2 ti-xs"></i> View &amp; Manage Evidence
                                </Link>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};;

export default CaseManagement;
