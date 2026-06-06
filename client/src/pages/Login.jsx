import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Package, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        
        if (isRegistering && !termsAccepted) {
            setMessage({ text: 'You must accept the Terms of Service to register.', type: 'error' });
            return;
        }

        if (isRegistering && password !== confirmPassword) {
            setMessage({ text: 'Passwords do not match.', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            if (isResettingPassword) {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                setMessage({ text: 'Password reset link sent! Check your inbox.', type: 'success' });
            } else if (isRegistering) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } }
                });
                if (error) throw error;
                setMessage({ text: 'Account created successfully! You can now log in.', type: 'success' });
                setIsRegistering(false);
                setPassword('');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err) {
            setMessage({ text: err.message || 'Authentication error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
            if (error) throw error;
        } catch (err) {
            setMessage({ text: err.message || 'Google Auth failed', type: 'error' });
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering); 
        setIsResettingPassword(false);
        setConfirmPassword('');
        setMessage({ text: '', type: '' }); 
    };

    const toggleResetMode = () => {
        setIsResettingPassword(!isResettingPassword);
        setIsRegistering(false);
        setMessage({ text: '', type: '' });
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
            <div className="card" style={{ width: '400px', maxWidth: '100%', padding: '48px 32px', textAlign: 'center', border: '4px solid var(--accent-primary-light)' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--accent-primary)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 16px rgba(140, 198, 63, 0.4)' }}>
                     <Package size={32} color="white" />
                </div>
                <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
                    ReptiTrack<span style={{ color: 'var(--accent-primary)' }}>.</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '32px' }}>
                    {isResettingPassword 
                        ? "Enter your email to reset your password." 
                        : isRegistering 
                            ? "Create your new account to access the dashboard." 
                            : "Welcome back! Please login to your account."}
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
                    {isRegistering && !isResettingPassword && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>Full Name</label>
                            <input 
                                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid var(--border-color)', outline: 'none', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', background: 'transparent', color: 'var(--text-main)' }} 
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>Email Address</label>
                        <input 
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2px solid var(--border-color)', outline: 'none', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', background: 'transparent', color: 'var(--text-main)' }} 
                            placeholder="e.g. name@company.com"
                        />
                    </div>

                    {!isResettingPassword && (
                        <div style={{ marginBottom: '16px', position: 'relative' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>
                                Password
                                {!isRegistering && (
                                    <span onClick={toggleResetMode} style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}>Forgot password?</span>
                                )}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: '14px', border: '2px solid var(--border-color)', outline: 'none', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', background: 'transparent', color: 'var(--text-main)' }} 
                                    placeholder="Enter your password"
                                />
                                <div 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </div>
                            </div>
                        </div>
                    )}

                    {isRegistering && !isResettingPassword && (
                        <div style={{ marginBottom: '16px', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.9rem' }}>
                                Verify Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: '14px', border: '2px solid var(--border-color)', outline: 'none', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', background: 'transparent', color: 'var(--text-main)' }} 
                                    placeholder="Verify your password"
                                />
                            </div>
                        </div>
                    )}

                    {isRegistering && !isResettingPassword && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '8px' }}>
                            <input 
                                type="checkbox" 
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', margin: 0 }}>
                                I agree to the Terms of Service & Privacy Policy
                            </label>
                        </div>
                    )}

                    {!isRegistering && !isResettingPassword && (
                        <div style={{ marginBottom: '24px' }}></div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '16px', marginBottom: '16px', opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Please wait..." : isResettingPassword ? "Send Reset Link" : isRegistering ? "Register Account" : "Access Dashboard"}
                    </button>

                    {!isResettingPassword && (
                        <button type="button" onClick={handleGoogleLogin} style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '16px', marginBottom: '24px', background: 'transparent', border: '2px solid var(--border-color)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                            Continue with Google
                        </button>
                    )}
                    
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
                        {isResettingPassword ? "Remember your password?" : isRegistering ? "Already have an account?" : "Don't have an account?"} 
                        <span 
                            onClick={isResettingPassword ? toggleResetMode : toggleMode}
                            style={{ color: 'var(--accent-primary)', marginLeft: '6px', cursor: 'pointer', fontWeight: '700' }}
                        >
                            {isResettingPassword ? "Log in here" : isRegistering ? "Log in here" : "Sign up"}
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}
