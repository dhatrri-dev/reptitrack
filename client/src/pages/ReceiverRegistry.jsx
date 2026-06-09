import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { MapPin, Search, Mail, Home, Package } from 'lucide-react';

export default function ReceiverRegistry() {
    const [receivers, setReceivers] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReceivers();
    }, []);

    const fetchReceivers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('receiver')
                .select(`
                    receiverid, name, email, street, 
                    receiver_pincode:pincode(city, state, pincode),
                    shipment:shipment(shipmentid)
                `)
                .order('receiverid', { ascending: false });

            if (error) throw error;

            setReceivers((data || []).map(r => ({
                RECEIVERID: r.receiverid,
                NAME: r.name,
                EMAIL: r.email || '—',
                STREET: r.street || '—',
                CITY: r.receiver_pincode?.city || '—',
                STATE: r.receiver_pincode?.state || '—',
                PINCODE: r.receiver_pincode?.pincode || '—',
                SHIPMENT_COUNT: r.shipment ? r.shipment.length : 0
            })));
        } catch (err) {
            console.error('Failed to fetch receivers:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = receivers.filter(r => {
        const q = query.toLowerCase();
        return (
            (r.NAME && r.NAME.toLowerCase().includes(q)) ||
            (r.EMAIL && r.EMAIL.toLowerCase().includes(q)) ||
            (r.CITY && r.CITY.toLowerCase().includes(q)) ||
            String(r.RECEIVERID).includes(q)
        );
    });

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>
                    Receivers <span style={{ color: 'var(--accent-primary)' }}>Registry</span>
                </h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Manage and search all registered delivery endpoints.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Search by name, email, city, or ID..."
                        style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', border: '2px solid var(--border-color)', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} 
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading registry...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}><MapPin size={48} /></div>
                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>No receivers found matching your search.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                <th style={{ padding: '8px 20px' }}>ID</th>
                                <th style={{ padding: '8px 20px' }}>Name</th>
                                <th style={{ padding: '8px 20px' }}>Email</th>
                                <th style={{ padding: '8px 20px' }}>Location</th>
                                <th style={{ padding: '8px 20px', textAlign: 'center' }}>Total Shipments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.RECEIVERID} style={{ background: 'var(--bg-body)' }}>
                                    <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px', borderTop: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                        #{r.RECEIVERID}
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-main)' }}>
                                        {r.NAME}
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Mail size={14} /> {r.EMAIL}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Home size={14} />
                                            {r.CITY}, {r.STATE} <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>({r.PINCODE})</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', borderRadius: '0 12px 12px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem' }}>
                                            <Package size={14} /> {r.SHIPMENT_COUNT}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
