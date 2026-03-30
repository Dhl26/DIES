import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';

const CreateCase = () => {
    const { user, authFetch } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        caseNumber: '',
        description: '',
        priority: 'Medium'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        const confirm = await Swal.fire({
            title: 'Create New Case?',
            html: `<div style="text-align:left">
                <p><b>Title:</b> ${formData.title}</p>
                <p><b>Priority:</b> ${formData.priority}</p>
                ${formData.caseNumber ? `<p><b>Case No:</b> ${formData.caseNumber}</p>` : ''}
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7367f0',
            cancelButtonColor: '#adb5bd',
            confirmButtonText: 'Yes, Create Case',
            cancelButtonText: 'Cancel',
        });
        if (!confirm.isConfirmed) return;

        setLoading(true);
        setError('');
        try {
            const res = await authFetch('http://localhost:3001/cases', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const newCase = await res.json();
                Swal.fire({ title: 'Created', text: 'Case created successfully', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
                navigate(`/cases/detail/${newCase.id}`);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create case');
            }
        } catch {
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
                {/* Breadcrumb */}
                <nav aria-label="breadcrumb" className="mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link to="/cases">Cases</Link></li>
                        <li className="breadcrumb-item active">Create New Case</li>
                    </ol>
                </nav>

                <div className="card mb-4">
                    <div className="card-header border-bottom">
                        <h5 className="card-title mb-0">New Investigation Case</h5>
                        <small className="text-muted">Open a new case to start tracking evidence and chain of custody.</small>
                    </div>
                    <div className="card-body pt-4">
                        {error && (
                            <div className="alert alert-danger mb-4" role="alert">{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row g-4">
                                <div className="col-12">
                                    <label className="form-label" htmlFor="caseTitle">Case Title <span className="text-danger">*</span></label>
                                    <input
                                        id="caseTitle"
                                        type="text"
                                        className="form-control"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Cyber Fraud Investigation"
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label" htmlFor="caseNumber">Case / FIR Number</label>
                                    <input
                                        id="caseNumber"
                                        type="text"
                                        className="form-control"
                                        value={formData.caseNumber}
                                        onChange={e => setFormData({ ...formData, caseNumber: e.target.value })}
                                        placeholder="Auto-generated if left blank"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label d-block mb-2">Priority Level <span className="text-danger">*</span></label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {[
                                            { label: 'Critical', color: 'danger', icon: 'tabler-alert-octagon' },
                                            { label: 'High', color: 'warning', icon: 'tabler-alert-triangle' },
                                            { label: 'Medium', color: 'primary', icon: 'tabler-circle-check' },
                                            { label: 'Low', color: 'success', icon: 'tabler-circle' }
                                        ].map(p => (
                                            <button 
                                                key={p.label}
                                                type="button" 
                                                className={`btn d-flex align-items-center gap-1 py-1 px-3 ${formData.priority === p.label ? `btn-${p.color} shadow-sm scale-up` : `btn-label-${p.color}`}`}
                                                onClick={() => setFormData({ ...formData, priority: p.label })}
                                            >
                                                <i className={`icon-base ti ${p.icon} ti-xs`}></i>
                                                <span>{p.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-12">
                                    <label className="form-label" htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        className="form-control"
                                        rows="4"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief summary of the investigation..."
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                                <button type="button" className="btn btn-label-secondary" onClick={() => navigate('/cases')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Creating...</>
                                    ) : (
                                        <><i className="icon-base ti tabler-plus me-2"></i>Create Case</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCase;
