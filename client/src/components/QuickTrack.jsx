import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search } from 'lucide-react';

import ShipmentTimeline from './ShipmentTimeline';

export default function QuickTrack() {
    const [trackingId, setTrackingId] = useState('');
    const [trackingData, setTrackingData] = useState(null);
    const [tracking, setTracking] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!trackingId.trim()) return;
        setTracking(true);
        setError('');
        setTrackingData(null);
        try {
            const id = parseInt(trackingId.trim());
            if (isNaN(id)) throw new Error('Please enter a valid numeric Shipment ID.');

            const { data: shipment, error: shipErr } = await supabase
                .from('shipment')
                .select(`
                    shipmentid,
                    currentstatus,
                    bookingdate,
                    customer:customerid ( name, customer_pincode:pincode ( city ) ),
                    receiver:receiverid ( name, receiver_pincode:pincode ( city ) )
                `)
                .eq('shipmentid', id)
                .single();

            if (shipErr || !shipment) throw new Error('Shipment not found. Please check the ID.');

            // Get latest tracking location
            const { data: latestTracking } = await supabase
                .from('tracking')
                .select('location, timestamp')
                .eq('shipmentid', id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .maybeSingle();

            setTrackingData({
                SHIPMENTID: shipment.shipmentid,
                CURRENTSTATUS: shipment.currentstatus,
                customer_name: shipment.customer?.name || 'Unknown',
                customer_city: shipment.customer?.customer_pincode?.city || '—',
                receiver_name: shipment.receiver?.name || 'Unknown',
                receiver_city: shipment.receiver?.receiver_pincode?.city || '—',
                LAST_LOCATION: latestTracking?.location || 'Processing...',
                LAST_UPDATED: latestTracking?.timestamp || shipment.bookingdate
            });
        } catch (err) {
            setError(err.message || 'Shipment not found. Please check the ID.');
        } finally {
            setTracking(false);
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '40px' }}>
                <h2 style={{ margin: '0 0 8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '700' }}><Search size={22} style={{ marginRight: '8px', color: 'var(--accent-primary)' }} /> Track Your Shipment</h2>
                <p style={{ margin: '0 0 28px', color: 'var(--text-muted)', fontSize: '1rem' }}>
                    Enter your shipment tracking ID to get a live status update.
                </p>

                <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                    <input
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="e.g. 1001"
                        style={{
                            flex: 1, padding: '14px 16px', borderRadius: '14px',
                            border: '2px solid var(--border-color)', outline: 'none',
                            fontFamily: 'Poppins, sans-serif', fontSize: '1rem',
                            background: 'transparent', color: 'var(--text-main)'
                        }}
                    />
                    <button type="submit" title="Search Shipment Database" className="btn-primary" style={{ padding: '14px 24px', fontSize: '1rem', borderRadius: '14px' }}>
                        {tracking ? '...' : 'Track'}
                    </button>
                </form>

                {error && (
                    <div style={{
                        background: '#fef2f2', color: '#ef4444', padding: '12px 16px',
                        borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600',
                        border: '1px solid #fca5a5', marginBottom: '16px'
                    }}>
                        {error}
                    </div>
                )}

                {trackingData && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px', marginTop: '16px' }}>
                        {}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800' }}>Live Shipment Info</p>
                                <p style={{ margin: '8px 0 0', fontWeight: '900', fontSize: '1.8rem', color: 'var(--text-main)', letterSpacing: '-1px' }}>#{trackingData.SHIPMENTID}</p>
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '10px',
                                padding: '12px 24px', borderRadius: '99px',
                                background: 'var(--accent-primary-light)', color: 'var(--accent-primary)',
                                fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase',
                                boxShadow: '0 4px 12px rgba(140, 198, 63, 0.2)'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}></span>
                                {trackingData.CURRENTSTATUS}
                            </div>
                        </div>

                        {}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px', background: 'var(--bg-body)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                            <div>
                                <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Route Visualization</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{trackingData.customer_name || 'Sender'}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>({trackingData.customer_city || '—'})</span>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: '900', fontSize: '1.2rem' }}>⟶</span>
                                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{trackingData.receiver_name || 'Receiver'}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>({trackingData.receiver_city || '—'})</span>
                                </div>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Current Location</p>
                                <div style={{ color: 'var(--text-main)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem' }}>📍</span>
                                    {trackingData.LAST_LOCATION || 'Processing...'}
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <strong>Last Updated:</strong> {trackingData.LAST_UPDATED ? new Date(trackingData.LAST_UPDATED).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                </span>
                                <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '700' }}>Live Tracking Active</span>
                            </div>
                        </div>

                        <ShipmentTimeline shipmentId={trackingData.SHIPMENTID} />
                    </div>
                )}
            </div>
        </div>
    );
}
