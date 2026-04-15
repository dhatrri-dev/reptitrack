import React from 'react';
import { Package } from 'lucide-react';
import QuickTrack from '../components/QuickTrack';
import AlertsPanel from '../components/AlertsPanel';

export default function UserDashboard({ logout }) {
    const username = localStorage.getItem('username') || 'User';

    return (
        <div style={{ minHeight: '80vh', background: 'var(--bg-body)', display: 'flex', flexDirection: 'column' }}>

            {}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
                {}
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                        width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--accent-primary), #10b981)',
                        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', boxShadow: '0 12px 24px rgba(140, 198, 63, 0.4)'
                    }}>
                        <Package size={42} strokeWidth={2} color="white" />
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px' }}>
                        Welcome back, {username}!
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Track your shipments instantly below.
                    </p>
                </div>

                <div style={{ width: '100%', maxWidth: '900px', marginBottom: '40px' }}>
                    <AlertsPanel />
                </div>

                <QuickTrack />
            </main>
        </div>
    );
}
