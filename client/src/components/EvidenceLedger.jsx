import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DataTable from 'react-data-table-component';

const STATUS_BADGE = {
    'Collected': 'bg-label-primary', 'Processing': 'bg-label-warning',
    'Analyzed': 'bg-label-info', 'Court-Ready': 'bg-label-success',
    'Archived': 'bg-label-secondary', 'Released': 'bg-label-danger',
};

const STATUSES = ['Collected', 'Processing', 'Analyzed', 'Court-Ready', 'Archived', 'Released'];
const CATEGORIES = ['Photo', 'Video', 'Document', 'Device Image', 'Network Capture', 'Audio', 'Database', 'Email', 'Mobile Data', 'Other'];

const EvidenceLedger = () => {
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [cases, setCases] = useState([]);
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const caseIdFilter = searchParams.get('case') || '';

    useEffect(() => { fetchEvidence(); fetchCases(); }, []);

    const fetchEvidence = async () => {
        try {
            const res = await fetch('http://localhost:3001/evidence', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setEvidence(await res.json());
        } catch { }
        finally { setLoading(false); }
    };

    const fetchCases = async () => {
        try {
            const res = await fetch('http://localhost:3001/cases', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) setCases(await res.json());
        } catch { }
    };

    const formatBytes = (b) => !b ? '0 B' : b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

    let filtered = evidence;
    if (caseIdFilter) filtered = filtered.filter(e => e.caseId === caseIdFilter);
    if (statusFilter) filtered = filtered.filter(e => e.status === statusFilter);
    if (categoryFilter) filtered = filtered.filter(e => e.category === categoryFilter);
    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(e =>
            e.fileName?.toLowerCase().includes(s) || e.hash?.toLowerCase().includes(s) ||
            e.uploadedBy?.toLowerCase().includes(s) || e.metadata?.toLowerCase().includes(s) ||
            e.tags?.some(t => t.toLowerCase().includes(s))
        );
    }

    const linkedCase = caseIdFilter ? cases.find(c => c.id === caseIdFilter) : null;

    const columns = [
        {
            name: 'File',
            selector: row => row.fileName,
            cell: item => (
                <div className="d-flex align-items-center gap-2">
                    <div className="badge bg-label-secondary rounded p-1">
                        <i className={`icon-base ti ${item.mimeType?.startsWith('image/') ? 'tabler-photo' : item.mimeType?.startsWith('video/') ? 'tabler-video' : 'tabler-file-description'} ti-sm`}></i>
                    </div>
                    <div>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>{item.fileName}</div>
                        <small className="text-muted">{formatBytes(item.fileSize)}</small>
                    </div>
                </div>
            ),
            sortable: true,
            width: '250px'
        },
        {
            name: 'Hash (SHA-256)',
            selector: row => row.hash,
            cell: item => <code className="small text-muted" style={{ fontSize: '10px' }}>{item.hash?.substring(0, 20)}…</code>,
            sortable: false,
        },
        {
            name: 'Status',
            selector: row => row.status,
            cell: item => <span className={`badge ${STATUS_BADGE[item.status] || 'bg-label-secondary'}`}>{item.status}</span>,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Category',
            selector: row => row.category,
            cell: item => <span className="text-muted small">{item.category || '–'}</span>,
            sortable: true,
            width: '120px'
        },
        {
            name: 'Uploaded By',
            selector: row => row.uploadedBy,
            cell: item => <span className="text-muted small text-truncate" style={{maxWidth:'100px'}}>{item.uploadedBy}</span>,
            sortable: true,
        },
        {
            name: 'Date',
            selector: row => row.timestamp,
            cell: item => <span className="text-muted small">{new Date(item.timestamp).toLocaleDateString()}</span>,
            sortable: true,
            width: '100px'
        },
        {
            name: '',
            cell: item => (
                <Link to={`/evidence/${item.hash}`} className="btn btn-sm btn-label-primary">
                    <i className="icon-base ti tabler-eye me-1"></i>View
                </Link>
            ),
            button: true,
            width: '100px'
        }
    ];

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="row">
            {/* Header */}
            <div className="col-12 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <h4 className="mb-1">Evidence Ledger</h4>
                        <p className="text-muted mb-0">
                            {filtered.length} of {evidence.length} record{evidence.length !== 1 ? 's' : ''}
                            {linkedCase && <span className="ms-2 badge bg-label-primary">Case: {linkedCase.caseNumber}</span>}
                        </p>
                    </div>
                    <Link to="/upload" className="btn btn-primary">
                        <i className="icon-base ti tabler-plus me-2"></i>Register New
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="col-12 mb-4">
                <div className="card">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-12 col-md-5">
                                <div className="input-group">
                                    <span className="input-group-text"><i className="icon-base ti tabler-search"></i></span>
                                    <input type="text" className="form-control" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files, hashes, tags…" />
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="dropdown">
                                    <button className="btn btn-label-secondary dropdown-toggle w-100 d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown">
                                        <span><i className="icon-base ti tabler-filter me-2 text-warning"></i>{statusFilter || 'All Statuses'}</span>
                                    </button>
                                    <ul className="dropdown-menu w-100 shadow-sm border-0">
                                        <li><button className="dropdown-item" onClick={() => setStatusFilter('')}>All Statuses</button></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        {STATUSES.map(s => (
                                            <li key={s}><button className={`dropdown-item d-flex align-items-center justify-content-between ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                                                {s}
                                                {statusFilter === s && <i className="icon-base ti tabler-check ti-xs"></i>}
                                            </button></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="col-12 col-md-3">
                                <div className="dropdown">
                                    <button className="btn btn-label-secondary dropdown-toggle w-100 d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown">
                                        <span><i className="icon-base ti tabler-category me-2 text-primary"></i>{categoryFilter || 'All Categories'}</span>
                                    </button>
                                    <ul className="dropdown-menu w-100 shadow-sm border-0">
                                        <li><button className="dropdown-item" onClick={() => setCategoryFilter('')}>All Categories</button></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        {CATEGORIES.map(c => (
                                            <li key={c}><button className={`dropdown-item d-flex align-items-center justify-content-between ${categoryFilter === c ? 'active' : ''}`} onClick={() => setCategoryFilter(c)}>
                                                {c}
                                                {categoryFilter === c && <i className="icon-base ti tabler-check ti-xs"></i>}
                                            </button></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="col-12 col-md-1 d-flex align-items-center">
                                {(statusFilter || categoryFilter || caseIdFilter) && (
                                    <button className="btn btn-label-danger btn-sm w-100 p-2 h-100" onClick={() => { setStatusFilter(''); setCategoryFilter(''); window.history.pushState({}, '', '/ledger'); }}>
                                        <i className="icon-base ti tabler-x"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Evidence List */}
            <div className="col-12">
                <div className="card">
                    <DataTable
                        columns={columns}
                        data={filtered}
                        pagination
                        highlightOnHover
                        responsive
                        noHeader
                        persistTableHead
                        customStyles={{
                            headCells: {
                                style: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', color: '#6c757d' }
                            }
                        }}
                        noDataComponent={
                            <div className="text-center py-5">
                                <div className="badge bg-label-secondary rounded p-3 mb-3">
                                    <i className="icon-base ti tabler-inbox ti-lg"></i>
                                </div>
                                <h5>No Evidence Records</h5>
                                <p className="text-muted">
                                    {search || statusFilter || categoryFilter ? 'Try adjusting your filters' : 'Upload your first evidence file to get started'}
                                </p>
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default EvidenceLedger;
