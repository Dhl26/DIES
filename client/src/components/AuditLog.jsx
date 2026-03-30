import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Action</th>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Details</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">No audit entries found</td>
                                    </tr>
                                ) : filtered.map((log, i) => (
                                    <tr key={log.id || i}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className={`badge ${ACTION_COLOR[log.action] || 'bg-label-secondary'} rounded p-2`}>
                                                    <i className={`icon-base ti ${ACTION_ICON[log.action] || 'tabler-file'} ti-sm`}></i>
                                                </div>
                                                <span className="fw-semibold">{log.action?.replace(/_/g, ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="fw-semibold">{log.username}</td>
                                        <td><span className="badge bg-label-info">{log.role}</span></td>
                                        <td>
                                            {log.evidenceHash && (
                                                <small className="text-muted font-monospace me-2">{log.evidenceHash.substring(0, 10)}…</small>
                                            )}
                                            {log.txHash && (
                                                <span className="badge bg-label-success">TX ✓</span>
                                            )}
                                            {log.new_user && (
                                                <small className="text-muted">Created: {log.new_user}</small>
                                            )}
                                        </td>
                                        <td>
                                            <small className="text-muted">{new Date(log.timestamp).toLocaleString()}</small>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card-footer text-muted text-center">
                        Showing {filtered.length} of {logs.length} entries
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditLog;
