import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';




const STATUS_COLORS = {
    'Collected': '#3b82f6', 'Processing': '#f59e0b', 'Analyzed': '#a855f7', 'Court-Ready': '#22c55e', 'Archived': '#6b7280', 'Released': '#f43f5e',
};

const Dashboard = () => {
    const { user, userPerms } = useContext(AuthContext);
    const [stats, setStats] = useState(null);


    useEffect(() => {
        fetch('http://localhost:3001/stats', {
            headers: { 'Authorization': `Bearer ${user.token}` }
        }).then(r => r.json()).then(setStats).catch(() => { });
    }, [user]);

    const actions = [
        { id: 'ledger', title: 'Evidence Ledger', desc: 'Browse, search, download, and manage all registered evidence files with full chain of custody.', icon: 'tabler-clipboard-list', color: 'primary', link: '/ledger', enabled: userPerms.includes('Download Evidence') || userPerms.includes('Verify Evidence') },
        { id: 'upload', title: 'Register Evidence', desc: 'Upload new digital evidence with multi-hash fingerprinting (SHA-256 + SHA-1 + MD5) on blockchain.', icon: 'tabler-cloud-upload', color: 'success', link: '/upload', enabled: userPerms.includes('Upload Evidence') },
        { id: 'cases', title: 'Case Management', desc: 'Create investigation cases, set priorities, and link evidence items for organized tracking.', icon: 'tabler-folder-open', color: 'warning', link: '/cases', enabled: userPerms.includes('View Cases') },
        { id: 'verify', title: 'Verify Integrity', desc: 'Compare file hashes against blockchain records. Drag & drop files for instant verification.', icon: 'tabler-shield-check', color: 'info', link: '/verify', enabled: userPerms.includes('Verify Evidence') },
        { id: 'audit', title: 'Audit Log', desc: 'Complete NIST-compliant activity log of all system actions and evidence interactions.', icon: 'tabler-list-check', color: 'secondary', link: '/audit', enabled: userPerms.includes('View Audit Logs') },
    ];

    return (
        <div className="row">
            {/* Welcome banner */}
            <div className="col-12 mb-4">
                <div className="card bg-primary text-white">
                    <div className="card-body p-5">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="card-title text-white mb-2">Welcome back, {user?.username}! 👋</h4>
                                <p className="mb-4">You are currently logged in as a <span className="fw-bold">{user?.role}</span>. <br /> Continue tracking digital evidence and maintain strict chain of custody.</p>
                            </div>
                            <div className="d-none d-sm-block">
                                <span className="badge bg-white text-primary rounded-pill p-2 px-3 fw-bold">DEIS v2.0 - Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hyperledger Status Alert */}
            <div className="col-12 mb-6">
                <div className="alert d-flex align-items-center" role="alert" style={{ border: '1px solid #71dd37', backgroundColor: 'rgba(113, 221, 55, 0.1)' }}>
                    <span className="badge badge-center rounded-pill bg-success p-3 me-3 text-white">
                      <i className="icon-base ti tabler-shield-check fs-5"></i>
                    </span>
                    <div className="d-flex flex-column ps-1">
                        <h6 className="alert-heading d-flex align-items-center fw-bold mb-1" style={{ color: '#53a626' }}>
                            <span className="pulse-dot me-2" style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#71dd37', display: 'inline-block' }}></span>
                            Hyperledger Fabric is connected and working successfully
                        </h6>
                        <span style={{ color: '#53a626' }}>Your private blockchain network is active. All evidence uploaded is being cryptographically anchored to the immutable ledger.</span>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="col-12 mb-6">
                <div className="row g-4">
                    {[
                        { label: 'Evidence', value: stats?.evidence?.total || 0, icon: 'tabler-file-invoice', color: 'primary' },
                        { label: 'Active Cases', value: stats?.cases?.open || 0, icon: 'tabler-folder-open', color: 'warning' },
                        { label: 'Total Cases', value: stats?.cases?.total || 0, icon: 'tabler-folders', color: 'info' },
                        { label: 'Users', value: stats?.users?.total || 0, icon: 'tabler-users', color: 'success' },
                        { label: 'Blockchain', value: 'Connected', icon: 'tabler-link', color: 'primary' },
                    ].map((s, idx) => (
                        <div key={idx} className="col-sm-6 col-xl-2 col-md-4">
                            <div className="card h-100">
                                <div className="card-body text-center">
                                    <div className={`badge rounded bg-label-${s.color} p-2 mb-3 mt-1`}>
                                        <i className={`icon-base ti ${s.icon} ti-md`}></i>
                                    </div>
                                    <h5 className="card-title mb-1">{s.value}</h5>
                                    <p className="mb-0 text-muted">{s.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-12 col-xl-8 mb-6">
                <div className="card h-100">
                    <div className="card-header border-bottom">
                        <h5 className="card-title mb-0">Quick Actions</h5>
                    </div>
                    <div className="card-body pt-4">
                        <div className="row g-4">
                            {actions.filter(a => a.enabled).map(action => (
                                <div key={action.id} className="col-sm-6">
                                    <Link to={action.link} className="card border h-100 text-decoration-none" style={{ transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.12)'}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                                        <div className="card-body">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className={`badge bg-label-${action.color} rounded p-2 flex-shrink-0`}>
                                                    <i className={`icon-base ti ${action.icon} ti-md`}></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-1 text-body">{action.title}</h6>
                                                    <p className="mb-0 text-muted small">{action.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-xl-4 mb-6">
                {stats?.recentActivity?.length > 0 && (
                    <div className="card h-100">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h5 className="card-title m-0 me-2">Activity Logs</h5>
                            <Link to="/audit" className="btn btn-sm btn-label-primary">View All</Link>
                        </div>
                        <div className="card-body">
                            <ul className="timeline pb-0 mb-0">
                                {stats.recentActivity.slice(0, 5).map((act, i) => (
                                    <li key={act.id || i} className={`timeline-item timeline-item-transparent ${i === Math.min(stats.recentActivity.length, 5) - 1 ? 'border-transparent' : 'border-primary'}`}>
                                        <span className="timeline-point timeline-point-primary"></span>
                                        <div className="timeline-event">
                                            <div className="timeline-header mb-1">
                                                <h6 className="mb-0">{act.action?.replace(/_/g, ' ')}</h6>
                                                <small className="text-muted">{new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                            </div>
                                            <p className="mb-2 text-muted">{act.username}</p>
                                            {act.fileName && (
                                                <div className="d-flex align-items-center">
                                                    <i className="icon-base ti tabler-file-description text-primary me-2"></i>
                                                    <span className="fw-medium text-body">{act.fileName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {stats?.evidence?.total > 0 && (
                <div className="col-12">
                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Evidence by Status</h5>
                                </div>
                                <div className="card-body">
                                    <ul className="p-0 m-0">
                                        {Object.entries(stats.evidence.byStatus || {}).filter(([, v]) => v > 0).map(([s, count]) => (
                                            <li key={s} className="d-flex mb-4 align-items-center">
                                                <div className="badge bg-label-primary rounded p-2 me-3"><i className="icon-base ti tabler-chart-pie-2 ti-sm"></i></div>
                                                <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div className="me-2">
                                                        <h6 className="mb-0">{s}</h6>
                                                    </div>
                                                    <div className="user-progress text-center">
                                                        <h6 className="mb-0">{count}</h6>
                                                        <small className="text-muted">{((count / stats.evidence.total) * 100).toFixed(0)}%</small>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card h-100">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">Evidence by Category</h5>
                                </div>
                                <div className="card-body">
                                    <ul className="p-0 m-0">
                                        {Object.entries(stats.evidence.byCategory || {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, count]) => (
                                            <li key={cat} className="d-flex mb-4 align-items-center">
                                                <div className="badge bg-label-info rounded p-2 me-3"><i className="icon-base ti tabler-category ti-sm"></i></div>
                                                <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                                                    <div className="me-2">
                                                        <h6 className="mb-0 text-truncate" style={{maxWidth: '200px'}}>{cat}</h6>
                                                    </div>
                                                    <div className="user-progress text-center">
                                                        <h6 className="mb-0">{count}</h6>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
