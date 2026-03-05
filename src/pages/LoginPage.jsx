import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LayoutDashboard, Mail, Lock, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const [role, setRole] = useState('hr'); // 'hr' or 'employee'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (isSignUp) {
                // Sign Up Logic
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: role
                        }
                    }
                });

                if (signUpError) throw signUpError;

                if (data.user) {
                    setSuccessMsg("Account created successfully! If email confirmation is enabled, check your inbox. Otherwise, you can sign in now.");
                    setIsSignUp(false);
                }
            } else {
                // Login Logic
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) throw authError;

                // Check if profile role matches the selected tab
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || profile.role !== role) {
                    await supabase.auth.signOut();
                    throw new Error(`Unauthorized. Please login as ${role.toUpperCase()}.`);
                }

                if (role === 'hr') {
                    navigate('/hr/dashboard');
                } else {
                    navigate('/employee/dashboard');
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F9FAFB',
            padding: '24px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '40px'
            }}>
                {/* Logo Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <LayoutDashboard size={24} />
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)' }}>
                        Work<span style={{ color: 'var(--primary)' }}>Nest</span>
                    </span>
                </div>

                <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: 'var(--text-main)',
                    marginBottom: '24px'
                }}>{isSignUp ? 'Create Your Account' : 'Welcome Back'}</h2>

                {/* Tab Selector */}
                <div style={{
                    display: 'flex',
                    background: '#F3F4F6',
                    padding: '4px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <button
                        onClick={() => setRole('hr')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            background: role === 'hr' ? 'white' : 'transparent',
                            color: role === 'hr' ? 'var(--text-main)' : 'var(--text-muted)',
                            boxShadow: role === 'hr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        HR {isSignUp ? 'Signup' : 'Login'}
                    </button>
                    <button
                        onClick={() => setRole('employee')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            background: role === 'employee' ? 'white' : 'transparent',
                            color: role === 'employee' ? 'var(--text-main)' : 'var(--text-muted)',
                            boxShadow: role === 'employee' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        Employee {isSignUp ? 'Signup' : 'Login'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }} />
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    paddingLeft: '40px',
                                    paddingRight: '12px',
                                    paddingTop: '10px',
                                    paddingBottom: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    paddingLeft: '40px',
                                    paddingRight: '12px',
                                    paddingTop: '10px',
                                    paddingBottom: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            fontSize: '13px',
                            color: '#EF4444',
                            background: '#FEF2F2',
                            padding: '10px',
                            borderRadius: '6px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{
                            fontSize: '13px',
                            color: '#059669',
                            background: '#F0FDF4',
                            padding: '10px',
                            borderRadius: '6px',
                            textAlign: 'center'
                        }}>
                            {successMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'opacity 0.2s',
                            marginTop: '8px'
                        }}
                    >
                        {loading && <Loader2 size={20} className="animate-spin" />}
                        {loading ? (isSignUp ? 'Creating Account...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setSuccessMsg(null);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
