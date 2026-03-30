import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                login({ token: data.token, role: data.role, username: formData.username });
                navigate('/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Failed to connect to server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-xxl">
            <div className="authentication-wrapper authentication-basic container-p-y">
                <div className="authentication-inner py-6">
                    {/* Login */}
                    <div className="card">
                        <div className="card-body">
                            {/* Logo */}
                            <div className="app-brand justify-content-center mb-6">
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
                                    <span className="app-brand-text demo text-heading fw-bold">DEIS</span>
                                </Link>
                            </div>
                            {/* /Logo */}
                            <h4 className="mb-1">Welcome to DEIS! 👋</h4>

                            {error && (
                                <div className="alert alert-danger mb-4" role="alert">
                                    {error}
                                </div>
                            )}

                            <form id="formAuthentication" className="mb-4" onSubmit={handleSubmit}>
                                <div className="mb-6 form-control-validation">
                                    <label htmlFor="username" className="form-label">Username</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Enter your username"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div className="mb-6 form-password-toggle form-control-validation">
                                    <label className="form-label" htmlFor="password">Password</label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type="password"
                                            id="password"
                                            className="form-control"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                            aria-describedby="password"
                                            required
                                        />
                                        <span className="input-group-text cursor-pointer"><i className="icon-base ti tabler-eye-off"></i></span>
                                    </div>
                                </div>
                                <div className="my-8">
                                    <div className="d-flex justify-content-between">
                                        <div className="form-check mb-0 ms-2">
                                            <input className="form-check-input" type="checkbox" id="remember-me" />
                                            <label className="form-check-label" htmlFor="remember-me"> Remember Me </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <button className="btn btn-primary d-grid w-100" type="submit" disabled={loading}>
                                        {loading ? 'Signing in...' : 'Login'}
                                    </button>
                                </div>
                            </form>

                            <p className="text-center mt-4">
                                <span>Secured by DEIS Blockchain</span>
                            </p>
                        </div>
                    </div>
                    {/* /Login */}
                </div>
            </div>
        </div>
    );
};

export default Login;
