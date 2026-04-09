import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AVAILABLE_PERMS = ['Dashboard', 'View Cases', 'Create Case', 'Close Case', 'Update Case', 'Upload Evidence', 'Download Evidence', 'Change Status', 'View Report', 'View Audit Logs', 'User Management', 'Verify Evidence'];

const PERM_DEPENDENCIES = {
    'Create Case': ['View Cases', 'Dashboard'],
    'Update Case': ['View Cases', 'Dashboard'],
    'Close Case': ['View Cases', 'Dashboard'],
    'Upload Evidence': ['Dashboard'],
    'Download Evidence': ['Dashboard'],
    'Change Status': ['Dashboard'],
    'View Report': ['Dashboard'],
    'Verify Evidence': ['Dashboard'],
    'View Cases': ['Dashboard'],
    'View Audit Logs': ['Dashboard'],
    'User Management': ['Dashboard']
};

const ROLES = ['Admin', 'Case Agent', 'Evidence Custodian'];

const UserAccess = () => {
    const { authFetch } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [permissionsMap, setPermissionsMap] = useState({});
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 8;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, permsRes] = await Promise.all([
                    authFetch('http://localhost:3001/users'),
                    authFetch('http://localhost:3001/permissions')
                ]);
                if (usersRes.ok && permsRes.ok) {
                    const uData = await usersRes.json();
                    setUsers(uData);
                    const rawPerms = await permsRes.json();
                    
                    // Normalize existing permissions to ensure dependencies are met
                    const normalizedPerms = {};
                    Object.keys(rawPerms).forEach(roleKey => {
                        const rolePerms = rawPerms[roleKey] || [];
                        const expanded = new Set(rolePerms);
                        rolePerms.forEach(p => {
                            if (PERM_DEPENDENCIES[p]) {
                                PERM_DEPENDENCIES[p].forEach(dep => expanded.add(dep));
                            }
                        });
                        normalizedPerms[roleKey] = Array.from(expanded);
                    });
                    
                    setPermissionsMap(normalizedPerms);
                    
                    if (selectedUser) {
                        const updatedSelected = uData.find(u => u.username === selectedUser.username);
                        if (updatedSelected) setSelectedUser(updatedSelected);
                    }
                } else {
                    setError('Failed to fetch data');
                }
            } catch (err) {
                setError('Connection error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [authFetch]);

    const handleRoleChange = async (newRole) => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const res = await authFetch('http://localhost:3001/users/role', {
                method: 'PUT',
                body: JSON.stringify({ username: selectedUser.username, role: newRole })
            });
            if (res.ok) {
                const [usersRes] = await Promise.all([authFetch('http://localhost:3001/users')]);
                if (usersRes.ok) {
                    const uData = await usersRes.json();
                    setUsers(uData);
                    setSelectedUser(uData.find(u => u.username === selectedUser.username));
                    Swal.fire({ title: 'Role Updated!', text: `Changed to ${newRole}`, icon: 'success', timer: 1500, showConfirmButton: false });
                }
            } else {
                Swal.fire('Error', 'Failed to update role', 'error');
            }
        } catch {
            Swal.fire('Error', 'Connection failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePerm = (role, perm) => {
        setPermissionsMap(prev => {
            const rolePerms = prev[role] || [];
            if (rolePerms.includes(perm)) {
                // Toggling OFF: also toggle off everything that depends on this permission
                const permsToTurnOff = [perm];
                Object.entries(PERM_DEPENDENCIES).forEach(([key, deps]) => {
                    if (deps.includes(perm)) {
                        permsToTurnOff.push(key);
                    }
                });
                return { ...prev, [role]: rolePerms.filter(p => !permsToTurnOff.includes(p)) };
            } else {
                // Toggling ON: auto-check dependencies like 'View Cases' for 'Create Case'
                const permsToTurnOn = new Set([perm]);
                if (PERM_DEPENDENCIES[perm]) {
                    PERM_DEPENDENCIES[perm].forEach(dep => permsToTurnOn.add(dep));
                }
                const newPerms = new Set([...rolePerms, ...permsToTurnOn]);
                return { ...prev, [role]: Array.from(newPerms) };
            }
        });
    };

    const handleSavePermissions = async () => {
        setSaving(true);
        try {
            const res = await authFetch('http://localhost:3001/permissions', {
                method: 'PUT',
                body: JSON.stringify(permissionsMap)
            });
            if (res.ok) {
                Swal.fire({ title: 'Saved!', text: 'Role permissions have been instantly updated.', icon: 'success', timer: 2000, showConfirmButton: false });
            } else {
                Swal.fire('Error', 'Failed to save permissions', 'error');
            }
        } catch {
            Swal.fire('Error', 'Connection failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center mt-5">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const paginatedUsers = users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

    return (
        <div className="row">
            <div className="col-12 mb-4 d-flex justify-content-between align-items-center flex-wrap">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
                        <li className="breadcrumb-item active">User Access & Roles</li>
                    </ol>
                </nav>
                <div className="d-flex gap-2 mt-2 mt-md-0">
                    <Link to="/register" className="btn btn-primary">
                        <i className="icon-base ti tabler-user-plus me-2"></i>Create New User
                    </Link>
                </div>
            </div>

            {error && (
                <div className="col-12 mb-4">
                    <div className="alert alert-danger">{error}</div>
                </div>
            )}

            <div className="col-12 col-xl-5 mb-4">
                <div className="card h-100 shadow-sm border-0 d-flex flex-column">
                    <div className="card-header border-bottom bg-light py-3">
                        <h5 className="card-title mb-0 text-primary fw-bold">System Directories</h5>
                    </div>
                    <div className="card-body p-0 flex-grow-1">
                        <div className="list-group list-group-flush h-100">
                            {paginatedUsers.map(u => (
                                <button 
                                    key={u.username}
                                    type="button"
                                    onClick={() => setSelectedUser(u)}
                                    className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-bottom-0 border-top-0 ${selectedUser?.username === u.username ? 'bg-primary-subtle border-start border-4 border-primary' : ''}`}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`avatar ${selectedUser?.username === u.username ? 'avatar-online' : ''}`}>
                                            <div className="w-px-40 h-px-40 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5 shadow-sm">
                                                {u.username.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="text-start">
                                            <h6 className={`mb-0 fw-semibold ${selectedUser?.username === u.username ? 'text-primary' : ''}`}>{u.username}</h6>
                                            <small className="text-muted d-block">{u.role}</small>
                                        </div>
                                    </div>
                                    <i className="icon-base ti tabler-chevron-right text-muted"></i>
                                </button>
                            ))}
                            {users.length === 0 && (
                                <div className="text-center py-5 text-muted">No users found.</div>
                            )}
                        </div>
                        {totalPages > 1 && (
                            <div className="card-footer border-top px-3 py-2 d-flex justify-content-between align-items-center bg-white mt-auto">
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><i className="ti tabler-chevron-left ti-xs"></i></button>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><i className="ti tabler-chevron-right ti-xs"></i></button>
                                    </li>
                                </ul>
                                <small className="text-muted">pg {currentPage} / {totalPages}</small>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12 col-xl-7 mb-4">
                <div className="card h-100 shadow-sm border-0 border-top border-4 border-primary">
                    {!selectedUser ? (
                        <div className="card-body d-flex flex-column align-items-center justify-content-center text-center py-5 h-100 bg-lighter">
                            <i className="icon-base ti tabler-user-search text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                            <h4 className="fw-semibold text-body">Select a User</h4>
                            <p className="text-muted w-75">Click on any user from the directory to view their current access level or modify their role configuration.</p>
                        </div>
                    ) : (
                        <>
                            <div className="card-header border-bottom py-3 d-flex justify-content-between align-items-center bg-light">
                                <h5 className="card-title mb-0 fw-bold d-flex align-items-center gap-2">
                                    <i className="icon-base ti tabler-settings text-primary"></i>
                                    Access Configuration: <span className="text-primary">{selectedUser.username}</span>
                                </h5>
                                <button onClick={handleSavePermissions} disabled={saving} className="btn btn-sm btn-success">
                                    {saving ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="icon-base ti tabler-device-floppy me-1"></i>}
                                    Save Changes
                                </button>
                            </div>
                            <div className="card-body">
                                <div className="mb-4 bg-lighter rounded-3 p-3 border">
                                    <label className="form-label fw-bold text-uppercase small text-muted mb-2">Assigned System Role</label>
                                    <select 
                                        className="form-select form-select-lg border-primary text-primary fw-medium"
                                        value={selectedUser.role} 
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                    >
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <div className="form-text mt-2">
                                        <i className="icon-base ti tabler-info-circle me-1 ti-xs"></i>
                                        Changing the role above immediately affects what the user can do across the platform.
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <h6 className="fw-bold text-uppercase text-muted border-bottom pb-2 mb-3 d-flex align-items-center gap-2">
                                        <i className="icon-base ti tabler-list-check text-success"></i>
                                        Functional Privileges for '{selectedUser.role}'
                                    </h6>
                                    <div className="row g-3">
                                        {AVAILABLE_PERMS.map(perm => {
                                            const isChecked = (permissionsMap[selectedUser.role] || []).includes(perm);
                                            return (
                                                <div className="col-12 col-md-6" key={perm}>
                                                    <div className={`form-check form-switch p-3 rounded-3 border ${isChecked ? 'bg-primary-subtle border-primary text-primary' : 'bg-light border-light text-muted'}`}>
                                                        <input 
                                                            className="form-check-input ms-0 mt-1" 
                                                            type="checkbox" 
                                                            role="switch" 
                                                            id={`perm-${perm}`} 
                                                            checked={isChecked}
                                                            onChange={() => handleTogglePerm(selectedUser.role, perm)}
                                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                        />
                                                        <label className="form-check-label ms-10 fw-medium d-block" htmlFor={`perm-${perm}`} style={{ cursor: 'pointer', lineHeight: '1.5' }}>
                                                            {perm}
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserAccess;
