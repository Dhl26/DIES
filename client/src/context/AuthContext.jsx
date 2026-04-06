import React, { createContext, useState, useEffect, useCallback } from 'react';

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

export const AuthContext = createContext();

// Decode JWT payload without a library (just base64 decode the middle part)
const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return null;
    }
};

const isTokenValid = (token) => {
    if (!token) return false;
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    // Check if token expires within the next 30 seconds
    return decoded.exp * 1000 > Date.now() + 30000;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userPerms, setUserPerms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');
            const username = localStorage.getItem('username');

            if (token && isTokenValid(token)) {
                setUser({ token, role, username });
                try {
                    const headers = { 'Authorization': `Bearer ${token}` };
                    const res = await fetch('http://localhost:3001/permissions', { headers });
                    if (res.ok) {
                        const permsMap = await res.json();
                        const basePerms = permsMap[role] || [];
                        const expanded = new Set(basePerms);
                        basePerms.forEach(p => {
                            if (PERM_DEPENDENCIES[p]) PERM_DEPENDENCIES[p].forEach(dep => expanded.add(dep));
                        });
                        setUserPerms(Array.from(expanded));
                    }
                } catch (err) {
                    console.error("Failed to fetch permissions", err);
                }
            } else if (token) {
                // Token exists but is expired — clear it
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('username', userData.username);
        setUser(userData);
        try {
            const headers = { 'Authorization': `Bearer ${userData.token}` };
            const res = await fetch('http://localhost:3001/permissions', { headers });
            if (res.ok) {
                const permsMap = await res.json();
                const basePerms = permsMap[userData.role] || [];
                const expanded = new Set(basePerms);
                basePerms.forEach(p => {
                    if (PERM_DEPENDENCIES[p]) PERM_DEPENDENCIES[p].forEach(dep => expanded.add(dep));
                });
                setUserPerms(Array.from(expanded));
            }
        } catch (err) {
            console.error("Failed to load perms on login", err);
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setUser(null);
        setUserPerms([]);
    }, []);

    /**
     * A wrapper around fetch that automatically logs out on 401 responses.
     * Use this instead of raw fetch() for all authenticated API calls.
     */
    const authFetch = useCallback(async (url, options = {}) => {
        const currentToken = localStorage.getItem('token');
        
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${currentToken}`,
        };

        // Only set JSON content-type if not already set and NOT a FormData object
        if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token expired or invalid — force logout and redirect
            logout();
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }

        return response;
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, userPerms, login, logout, loading, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
};
