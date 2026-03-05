import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

    const signup = async (email, password, role) => {
        const data = await api.post('/auth/signup', { email, password, role });
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

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, signup, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
