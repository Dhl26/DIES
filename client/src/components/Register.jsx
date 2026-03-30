import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ROLES = [
    { value: 'Case Agent', label: 'Case Agent', desc: 'Can enter case details, upload evidence, and manage information.', icon: 'tabler-folder' },
    { value: 'Evidence Custodian', label: 'Evidence Custodian', desc: 'Can change the status of the current evidence chain of custody steps.', icon: 'tabler-shield-check' }
];

const Register = () => {
    const { user, authFetch } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', role: 'Case Agent' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Confirmation dialog
        const confirm = await Swal.fire({
            title: 'Create User Account?',
            html: `<div style="text-align:left">
                <p><b>Username:</b> ${formData.username}</p>
                <p><b>Role:</b> ${formData.role}</p>
                <p class="text-muted">This user will be able to log into the DEIS platform immediately.</p>
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7367f0',
            cancelButtonColor: '#adb5bd',
            confirmButtonText: 'Yes, Create User',
            cancelButtonText: 'Cancel',
        });
        if (!confirm.isConfirmed) return;

        setLoading(true);
        try {
            const response = await authFetch('http://localhost:3001/register', {
                method: 'POST',
                body: JSON.stringify({ username: formData.username, password: formData.password, role: formData.role }),
            });
            const data = await response.json();
            if (response.ok) {
                setFormData({ username: '', password: '', confirmPassword: '', role: 'Case Agent' });
                await Swal.fire({
                    title: 'User Created!',
                    html: `<p>Account <b>${formData.username}</b> (${formData.role}) has been successfully created.</p>`,
                    icon: 'success',
                    confirmButtonColor: '#7367f0',
                    confirmButtonText: 'OK',
                });
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-12 col-md-8 col-lg-6">
                <div className="card mb-4">
                    <div className="card-header border-bottom">
                        <div className="d-flex align-items-center gap-2">
                            <i className="icon-base ti tabler-user-plus text-primary"></i>
                            <h5 className="card-title mb-0">System User Management</h5>
                        </div>
                        <small className="text-muted">Create new privileged user accounts for the DEIS platform.</small>
                    </div>
                    
                    <div className="card-body pt-4">
                        {error && (
                            <div className="alert alert-danger mb-4" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label" htmlFor="username">Username</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="username" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleChange} 
                                    placeholder="Enter username" 
                                    required 
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label">User Role</label>
                                <div className="row g-3">
                                    {ROLES.map(r => (
                                        <div key={r.value} className="col-md-6">
                                            <div className={`form-check custom-option custom-option-icon ${formData.role === r.value ? 'checked' : ''}`}>
                                                <label className="form-check-label custom-option-content" htmlFor={`role-${r.value}`}>
                                                    <span className="custom-option-body">
                                                        <i className={`icon-base ti ${r.icon} mb-2 ti-md text-primary`}></i>
                                                        <span className="custom-option-title d-block mb-1">{r.label}</span>
                                                        <small className="text-muted leading-tight">{r.desc}</small>
                                                    </span>
                                                    <input 
                                                        name="role" 
                                                        className="form-check-input" 
                                                        type="radio" 
                                                        value={r.value} 
                                                        id={`role-${r.value}`} 
                                                        onChange={handleChange}
                                                        checked={formData.role === r.value} 
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label" htmlFor="password">Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        id="password" 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleChange} 
                                        placeholder="············" 
                                        required 
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        id="confirmPassword" 
                                        name="confirmPassword" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        placeholder="············" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-label-secondary" onClick={() => navigate('/dashboard')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary bg-primary" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
