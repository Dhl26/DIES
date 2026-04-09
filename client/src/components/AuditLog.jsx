import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DataTable from 'react-data-table-component';

const ACTION_ICON = {
    'USER_REGISTERED': 'tabler-user-plus',
    'USER_LOGIN': 'tabler-login',
    'EVIDENCE_UPLOADED': 'tabler-upload',
    'EVIDENCE_VIEWED': 'tabler-eye',
    'EVIDENCE_DOWNLOADED': 'tabler-download',
    'EVIDENCE_STATUS_CHANGED': 'tabler-refresh',
    'EVIDENCE_CASE_LINKED': 'tabler-link',
    'CUSTODY_EVENT': 'tabler-shield',
    'INTEGRITY_CHECK': 'tabler-shield-check',
    'REPORT_GENERATED': 'tabler-chart-bar',
    'CASE_CREATED': 'tabler-folder-plus',
    'CASE_UPDATED': 'tabler-folder',
    'NOTE_ADDED': 'tabler-message',
};
const ACTION_COLOR = {
    'USER_LOGIN': 'bg-label-success',
    'USER_REGISTERED': 'bg-label-info',
    'EVIDENCE_UPLOADED': 'bg-label-primary',
    'EVIDENCE_DOWNLOADED': 'bg-label-warning',
    'CUSTODY_EVENT': 'bg-label-secondary',
    'INTEGRITY_CHECK': 'bg-label-success',
    'CASE_CREATED': 'bg-label-info',
};

const AuditLog = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('http://localhost:3001/audit-log?limit=200', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) setLogs(await res.json());
            } catch { }
            finally { setLoading(false); }
        };
        fetchLogs();
    }, [user.token]);

    const filtered = filter ? logs.filter(l =>
        l.action?.toLowerCase().includes(filter.toLowerCase()) ||
        l.username?.toLowerCase().includes(filter.toLowerCase())
    ) : logs;

    const columns = [
        {
            name: 'Action',
            selector: row => row.action,
            cell: row => (
                <div className="d-flex align-items-center gap-2">
                    <div className={`badge ${ACTION_COLOR[row.action] || 'bg-label-secondary'} rounded p-2`}>
                        <i className={`icon-base ti ${ACTION_ICON[row.action] || 'tabler-file'} ti-sm`}></i>
                    </div>
                    <span className="fw-semibold text-truncate" style={{ maxWidth: '200px' }}>{row.action?.replace(/_/g, ' ')}</span>
                </div>
            ),
            sortable: true,
            width: '250px'
        },
        {
            name: 'User',
            selector: row => row.username,
            cell: row => <span className="fw-semibold text-nowrap">{row.username}</span>,
            sortable: true,
            width: '150px'
        },
        {
            name: 'Role',
            selector: row => row.role,
            cell: row => <span className="badge bg-label-info">{row.role}</span>,
            sortable: true,
            width: '150px'
        },
        {
            name: 'Details',
            cell: log => {
                const details = [];
                if (log.ip && log.ip !== 'unknown') details.push(<div key="ip" className="small text-muted"><i className="ti tabler-map-pin me-1"></i>{log.ip}</div>);
                if (log.caseNumber) details.push(<div key="case" className="small fw-semibold text-primary">Case: {log.caseNumber}</div>);
                if (log.evidenceHash) details.push(<div key="hash" className="small text-muted"><i className="ti tabler-hash me-1"></i>{log.evidenceHash.substring(0, 12)}…</div>);
                if (log.from && log.to) details.push(<div key="status" className="small">Changed status: <span className="text-danger">{log.from}</span> → <span className="text-success">{log.to}</span></div>);
                if (log.updates) details.push(<div key="updates" className="small">Updated: {log.updates}</div>);
                if (log.new_user) details.push(<div key="new_user" className="small text-success">New User: {log.new_user}</div>);
                if (log.txHash) details.push(<div key="tx" className="small text-success"><i className="ti tabler-blockchain me-1"></i>Blockchain Verified</div>);
                
                Object.keys(log).forEach(key => {
                    if (!['id', 'timestamp', 'action', 'username', 'role', 'ip', 'evidenceHash', 'caseId', 'caseNumber', 'from', 'to', 'updates', 'new_user', 'txHash'].includes(key)) {
                        details.push(<div key={key} className="small text-muted capitalize-first text-truncate" style={{maxWidth:'200px'}}>{key.replace(/_/g, ' ')}: {String(log[key])}</div>);
                    }
                });

                return <div className="d-flex flex-column gap-1 py-2">{details.length > 0 ? details : <span className="text-muted small">—</span>}</div>;
            }
        },
        {
            name: 'Timestamp',
            selector: row => row.timestamp,
            cell: log => (
                <div className="d-flex align-items-center justify-content-between w-100">
                    <div>
                        <small className="text-primary fw-medium">{new Date(log.timestamp).toLocaleDateString()}</small><br />
                        <small className="text-muted">{new Date(log.timestamp).toLocaleTimeString()}</small>
                    </div>
                    <button 
                        className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                        onClick={() => setSelectedLog(log)}
                        data-bs-toggle="modal" 
                        data-bs-target="#logDetailsModal">
                        <i className="ti tabler-maximize"></i>
                    </button>
                </div>
            ),
            sortable: true,
            width: '200px'
        }
    ];

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="row">
            <div className="col-12 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div>
                        <h4 className="mb-1">Audit Log</h4>
                        <p className="text-muted mb-0">Complete activity audit trail — NIST IR 8387 compliant</p>
                    </div>
                    <span className="badge bg-label-primary rounded-pill fs-6 px-3 py-2">{logs.length} entries</span>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header border-bottom">
                        <div className="input-group">
                            <span className="input-group-text"><i className="icon-base ti tabler-search"></i></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filter by action or username..."
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filtered}
                        pagination
                        highlightOnHover
                        responsive
                        noHeader
                        customStyles={{
                            headCells: {
                                style: { fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', color: '#6c757d' }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Log Details Modal */}
            <div className="modal fade" id="logDetailsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header d-flex flex-column pb-1">
                            <h5 className="modal-title w-100 d-flex align-items-center gap-2">
                                {selectedLog && (
                                    <>
                                        <div className={`badge ${ACTION_COLOR[selectedLog.action] || 'bg-label-secondary'} rounded p-2`}>
                                            <i className={`icon-base ti ${ACTION_ICON[selectedLog.action] || 'tabler-file'} ti-sm`}></i>
                                        </div>
                                        {selectedLog.action?.replace(/_/g, ' ')}
                                    </>
                                )}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body pt-3">
                            {selectedLog && (
                                <div className="row g-3">
                                    <div className="col-sm-6">
                                        <label className="text-uppercase small fw-bold text-muted mb-1 d-block">Timestamp</label>
                                        <p className="fw-medium mb-0">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="text-uppercase small fw-bold text-muted mb-1 d-block">ID</label>
                                        <p className="font-monospace text-muted small mb-0">{selectedLog.id}</p>
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="text-uppercase small fw-bold text-muted mb-1 d-block">User</label>
                                        <p className="mb-0">
                                            {selectedLog.username} 
                                            <span className="badge bg-label-info ms-2">{selectedLog.role}</span>
                                        </p>
                                    </div>
                                    <div className="col-sm-6">
                                        <label className="text-uppercase small fw-bold text-muted mb-1 d-block">IP Address</label>
                                        <p className="font-monospace mb-0">{selectedLog.ip || 'unknown'}</p>
                                    </div>
                                    
                                    <div className="col-12 mt-4">
                                        <h6 className="fw-bold text-uppercase text-muted border-bottom pb-2 mb-3">Event specifics</h6>
                                        <div className="row g-3">
                                            {selectedLog.caseNumber && (
                                                <div className="col-sm-6">
                                                    <label className="text-muted small mb-1">Case Number</label>
                                                    <p className="fw-medium mb-0">{selectedLog.caseNumber}</p>
                                                </div>
                                            )}
                                            {selectedLog.evidenceHash && (
                                                <div className="col-sm-6">
                                                    <label className="text-muted small mb-1">Evidence Hash</label>
                                                    <p className="fw-medium font-monospace small mb-0 text-break">{selectedLog.evidenceHash}</p>
                                                </div>
                                            )}
                                            {selectedLog.updates && (
                                                <div className="col-12">
                                                    <label className="text-muted small mb-1">Updated Fields</label>
                                                    <p className="fw-medium mb-0">{selectedLog.updates}</p>
                                                </div>
                                            )}
                                            {selectedLog.from && selectedLog.to && (
                                                <div className="col-12">
                                                    <label className="text-muted small mb-1">Status Progression</label>
                                                    <p className="fw-medium mb-0">{selectedLog.from} &rarr; {selectedLog.to}</p>
                                                </div>
                                            )}
                                            {selectedLog.txHash && (
                                                <div className="col-12">
                                                    <label className="text-muted small mb-1">Blockchain Transaction</label>
                                                    <p className="fw-medium font-monospace small mb-0 text-break">{selectedLog.txHash}</p>
                                                </div>
                                            )}
                                            {selectedLog.new_user && (
                                                <div className="col-sm-6">
                                                    <label className="text-muted small mb-1">New User Account</label>
                                                    <p className="fw-medium mb-0">{selectedLog.new_user}</p>
                                                </div>
                                            )}
                                            {selectedLog.fileName && (
                                                <div className="col-sm-6">
                                                    <label className="text-muted small mb-1">File Name</label>
                                                    <p className="fw-medium mb-0">{selectedLog.fileName}</p>
                                                </div>
                                            )}
                                            {Object.entries(selectedLog).filter(([k]) => !['id', 'timestamp', 'action', 'username', 'role', 'ip', 'evidenceHash', 'caseId', 'caseNumber', 'from', 'to', 'updates', 'new_user', 'txHash', 'fileName', 'fileSize'].includes(k)).map(([k, v]) => (
                                                <div className="col-sm-6" key={k}>
                                                    <label className="text-muted small mb-1 text-capitalize">{k.replace(/_/g, ' ')}</label>
                                                    <p className="fw-medium mb-0">{String(v)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;

