import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';
        const fontSize = localStorage.getItem('fontSize') || 'medium';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-font-size', fontSize);

        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await api.get('/auth/me');
                    setUser(userData);
                    setProfile(userData); // In local setup, profile is the same as user for now
                } catch (err) {
                    console.error('Auth initialization failed', err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setProfile(data.user);
        return data;
    };

    const signOut = () => {
        localStorage.removeItem('token');
        setUser(null);
        setProfile(null);
    };

    const value = { user, profile, loading, login, signOut };
    console.log('AuthProvider rendered with value:', value);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        console.error('useAuth must be used within an AuthProvider');
        return {};
    }
    return context;
};
