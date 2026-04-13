import React from 'react';
import QuickTrack from '../components/QuickTrack';

export default function TrackingPage() {
    return (
        <div style={{ padding: '40px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1px', marginBottom: '12px' }}>
                    Shipment Tracking
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Enter your tracking number below to see the current status of your shipment.
                </p>
            </div>
            <QuickTrack />
        </div>
    );
}
