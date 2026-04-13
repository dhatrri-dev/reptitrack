import React, { useState } from 'react';
import axios from 'axios';
import { Package } from 'lucide-react';

export default function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        const endpoint = isRegistering ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';
        const payload = isRegistering ? { email, password, fullName } : { email, password };

        try {
            const res = await axios.post(endpoint, payload);
            
            if (isRegistering) {
                setMessage({ text: 'Account created successfully! You can now log in.', type: 'success' });
                setIsRegistering(false);
                setPassword('');
            } else {
                const role = res.data.role || 'user';
                const customerId = res.data.customer_id;
                localStorage.setItem('auth', 'true');
                localStorage.setItem('role', role);
                localStorage.setItem('username', res.data.username);
                localStorage.setItem('email', res.data.email);
                if (customerId) localStorage.setItem('customerId', customerId);
                onLogin(role, customerId);
            }
        } catch (err) {
            setMessage({ text: err.response?.data?.error || 'Server error occurred', type: 'error' });
        }
    };


    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <div className="card" style={{ width: '400px', maxWidth: '100%', padding: '48px 32px', textAlign: 'center', border: '4px solid var(--accent-primary-light)' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--accent-primary)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 16px rgba(140, 198, 63, 0.4)' }}>
                     <Package size={32} color="white" />
                </div>
                <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
                    ReptiTrack<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
                    {isRegistering ? "Create your new account to access the dashboard." : "Welcome back! Please login to your account."}
                </p>

                {message.text && (
                    <div style={{ 
                        background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', 
                        color: message.type === 'error' ? '#ef4444' : '#16a34a', 
                        padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: '600', border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#bbf7d0'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    {isRegistering && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '14px', 
                                    border: '2px solid var(--border-color)', outline: 'none',
                                    fontFamily: 'Poppins, sans-serif', fontSize: '1rem',
                                    background: 'transparent', color: 'var(--text-main)'
                                }} 
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ 
                                width: '100%', padding: '14px 16px', borderRadius: '14px', 
                                border: '2px solid var(--border-color)', outline: 'none',
                                fontFamily: 'Poppins, sans-serif', fontSize: '1rem',
                                background: 'transparent', color: 'var(--text-main)'
                            }} 
                            placeholder="e.g. name@company.com"
                        />
                    </div>
                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>Password</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ 
                                width: '100%', padding: '14px 16px', borderRadius: '14px', 
                                border: '2px solid var(--border-color)', outline: 'none',
                                fontFamily: 'Poppins, sans-serif', fontSize: '1rem',
                                background: 'transparent', color: 'var(--text-main)'
                            }} 
                            placeholder="Enter your password"
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '16px', marginBottom: '16px' }}>
                        {isRegistering ? "Register Account" : "Access Dashboard"}
                    </button>
                    
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                        {isRegistering ? "Already have an account?" : "Don't have an account?"} 
                        <span 
                            onClick={() => { setIsRegistering(!isRegistering); setMessage({ text: '', type: '' }); }}
                            style={{ color: 'var(--accent-primary)', marginLeft: '6px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            {isRegistering ? "Log in here" : "Sign up"}
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}
