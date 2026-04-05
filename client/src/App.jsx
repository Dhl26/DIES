import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import UploadEvidence from './components/UploadEvidence';
import VerifyEvidence from './components/VerifyEvidence';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import EvidenceLedger from './components/EvidenceLedger';
import EvidenceDetail from './components/EvidenceDetail';
import CaseManagement from './components/CaseManagement';
import AuditLog from './components/AuditLog';
import CreateCase from './components/CreateCase';
import CaseDetail from './components/CaseDetail';
import UserAccess from './components/UserAccess';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
    return children;
};

// ── Sidebar Menu ──
const Sidebar = () => {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    if (!user) return null;

    const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? 'active' : '';

    return (
        <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme" data-bg-class="bg-menu-theme">
            <div className="app-brand demo">
                <Link to="/" className="app-brand-link">
                    <span className="app-brand-logo demo">
                        <span className="text-primary">
                            <svg width="32" height="22" viewBox="0 0 32 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M0.00172773 0V6.85398C0.00172773 6.85398 -0.133178 9.01207 1.98092 10.8388L13.6912 21.9964L19.7809 21.9181L18.8042 9.88248L16.4951 7.17289L9.23799 0H0.00172773Z" fill="currentColor" />
                                <path opacity="0.06" fillRule="evenodd" clipRule="evenodd" d="M7.69824 16.4364L12.5199 3.23696L16.5541 7.25596L7.69824 16.4364Z" fill="#161616" />
                                <path opacity="0.06" fillRule="evenodd" clipRule="evenodd" d="M8.07751 15.9175L13.9419 4.63989L16.5849 7.28475L8.07751 15.9175Z" fill="#161616" />
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.77295 16.3566L23.6563 0H32V6.88383C32 6.88383 31.8262 9.17836 30.6591 10.4057L19.7824 22H13.6938L7.77295 16.3566Z" fill="currentColor" />
                            </svg>
                        </span>
                    </span>
                    <span className="app-brand-text demo menu-text fw-bold ms-2">DEIS</span>
                </Link>
                <a href="javascript:void(0);" className="layout-menu-toggle menu-link text-large ms-auto">
                    <i className="icon-base ti menu-toggle-icon d-none d-xl-block ti-sm align-middle"></i>
                    <i className="icon-base ti tabler-x d-block d-xl-none ti-sm align-middle"></i>
                </a>
            </div>
            <div className="menu-inner-shadow"></div>
            <ul className="menu-inner py-1">
                <li className={`menu-item ${isActive('/dashboard')}`}>
                    <Link to="/dashboard" className="menu-link">
                        <i className="menu-icon icon-base ti tabler-smart-home"></i>
                        <div>Dashboard</div>
                    </Link>
                </li>
                <li className={`menu-item ${isActive('/cases')}`}>
                    <Link to="/cases" className="menu-link">
                        <i className="menu-icon icon-base ti tabler-folder"></i>
                        <div>Cases</div>
                    </Link>
                </li>
                {user.role === 'Admin' && (
                    <>
                        <li className={`menu-item ${isActive('/users') || isActive('/register')}`}>
                            <Link to="/users" className="menu-link">
                                <i className="menu-icon icon-base ti tabler-users"></i>
                                <div>User Access</div>
                            </Link>
                        </li>
                        <li className={`menu-item ${isActive('/audit')}`}>
                            <Link to="/audit" className="menu-link">
                                <i className="menu-icon icon-base ti tabler-list-check"></i>
                                <div>Audit Log</div>
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </aside>
    );
};

// ── Top Navbar ──
const Topbar = () => {
    const { user, logout } = useContext(AuthContext);
    if (!user) return null;

    return (
        <nav className="layout-navbar container-fluid navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme" id="layout-navbar">
            <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
                <a className="nav-item nav-link px-0 me-xl-4" href="javascript:void(0)">
                    <i className="icon-base ti tabler-menu-2 icon-md"></i>
                </a>
            </div>
            <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
                <div className="navbar-nav align-items-center">
                    <div className="nav-item d-flex align-items-center">
                        <i className="icon-base ti tabler-search fs-4 lh-0"></i>
                        <input type="text" className="form-control border-0 shadow-none bg-transparent" placeholder="Search..." aria-label="Search..." />
                    </div>
                </div>
                <ul className="navbar-nav flex-row align-items-center ms-auto">
                    <li className="nav-item navbar-dropdown dropdown-user dropdown">
                        <a className="nav-link dropdown-toggle hide-arrow p-0" href="javascript:void(0);" data-bs-toggle="dropdown">
                            <div className="avatar avatar-online">
                                <div className="w-px-40 h-px-40 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold">
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <a className="dropdown-item mt-0" href="javascript:void(0);">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 me-2">
                                            <div className="avatar avatar-online">
                                                <div className="w-px-40 h-px-40 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-0">{user.username}</h6>
                                            <small className="text-muted">{user.role}</small>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            <li><div className="dropdown-divider my-1 mx-n2"></div></li>
                            <li>
                                <button className="dropdown-item" onClick={logout}>
                                    <i className="icon-base ti tabler-power me-3 icon-md"></i><span className="align-middle">Log Out</span>
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

// ── App Wrapper ──
const LayoutWrapper = ({ children }) => {
    const { user } = useContext(AuthContext);
    
    // Ensure scripts re-initialize layout when page changes
    useEffect(() => {
        if (window.Helpers && window.Helpers.init) {
            window.Helpers.init();
        }
    }, [user]);

    if (!user) {
        return (
            <div className="container-fluid">
                {children}
            </div>
        );
    }

    return (
        <div className="layout-wrapper layout-content-navbar">
            <div className="layout-container">
                <Sidebar />
                <div className="layout-page">
                    <Topbar />
                    <div className="content-wrapper">
                        <div className="container-fluid flex-grow-1 container-p-y">
                            {children}
                        </div>
                        <footer className="content-footer footer bg-footer-theme">
                            <div className="container-fluid">
                                <div className="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
                                    <div className="text-body">
                                        © {new Date().getFullYear()}, DEIS: Digital Evidence Integrity System
                                    </div>
                                    <div className="d-none d-lg-inline-block">
                                        <span className="footer-link me-4">NIST IR 8387 Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </footer>
                        <div className="content-backdrop fade"></div>
                    </div>
                </div>
            </div>
            <div className="layout-overlay layout-menu-toggle"></div>
            <div className="drag-target"></div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <LayoutWrapper>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<ProtectedRoute roles={['Admin']}><Register /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute roles={['Admin']}><UserAccess /></ProtectedRoute>} />
                        <Route path="/verify" element={<VerifyEvidence />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/upload" element={<ProtectedRoute roles={['Case Agent', 'Admin']}><UploadEvidence /></ProtectedRoute>} />
                        <Route path="/ledger" element={<ProtectedRoute><EvidenceLedger /></ProtectedRoute>} />
                        <Route path="/evidence/:hash" element={<ProtectedRoute><EvidenceDetail /></ProtectedRoute>} />
                        <Route path="/cases" element={<ProtectedRoute><CaseManagement /></ProtectedRoute>} />
                        <Route path="/cases/new" element={<ProtectedRoute roles={['Case Agent', 'Admin']}><CreateCase /></ProtectedRoute>} />
                        <Route path="/cases/detail/:id" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
                        <Route path="/audit" element={<ProtectedRoute roles={['Admin']}><AuditLog /></ProtectedRoute>} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </LayoutWrapper>
            </Router>
        </AuthProvider>
    );
}

export default App;
