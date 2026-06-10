import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Truck, Search, Phone, Plus, Edit2, Trash2, Package } from 'lucide-react';

export default function CourierManagement() {
    const [couriers, setCouriers] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ id: null, name: '', phone: '' });

    useEffect(() => {
        fetchCouriers();
    }, []);

    const fetchCouriers = async () => {
        setLoading(true);
        try {
            // We fetch couriers and join shipments to get assignment counts
            const { data, error } = await supabase
                .from('courier')
                .select(`
                    courierid, name, phone,
                    shipment ( shipmentid, currentstatus )
                `)
                .order('courierid', { ascending: false });

            if (error) throw error;

            setCouriers((data || []).map(c => ({
                COURIERID: c.courierid,
                NAME: c.name,
                PHONE: c.phone || '—',
                SHIPMENT_COUNT: c.shipment ? c.shipment.length : 0,
                ACTIVE_SHIPMENTS: c.shipment ? c.shipment.filter(s => s.currentstatus !== 'Delivered' && s.currentstatus !== 'Cancelled').length : 0
            })));
        } catch (err) {
            console.error('Failed to fetch couriers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editForm.id) {
                // Update existing
                const { error } = await supabase
                    .from('courier')
                    .update({ name: editForm.name, phone: editForm.phone })
                    .eq('courierid', editForm.id);
                if (error) throw error;
            } else {
                // Insert new
                const { error } = await supabase
                    .from('courier')
                    .insert([{ name: editForm.name, phone: editForm.phone }]);
                if (error) throw error;
            }
            setIsEditing(false);
            setEditForm({ id: null, name: '', phone: '' });
            fetchCouriers();
        } catch (err) {
            alert('Failed to save courier: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this courier?')) return;
        try {
            const { error } = await supabase
                .from('courier')
                .delete()
                .eq('courierid', id);
            if (error) throw error;
            fetchCouriers();
        } catch (err) {
            alert('Failed to delete courier: ' + err.message);
        }
    };

    const filtered = couriers.filter(c => {
        const q = query.toLowerCase();
        return (
            (c.NAME && c.NAME.toLowerCase().includes(q)) ||
            (c.PHONE && c.PHONE.toLowerCase().includes(q)) ||
            String(c.COURIERID).includes(q)
        );
    });

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>
                        Courier <span style={{ color: 'var(--accent-primary)' }}>Management</span>
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Manage delivery personnel and monitor their active assignments.</p>
                </div>
                <button 
                    onClick={() => { setIsEditing(true); setEditForm({ id: null, name: '', phone: '' }); }}
                    className="btn-primary" 
                    style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
                >
                    <Plus size={18} /> Add New Courier
                </button>
            </div>

            {isEditing && (
                <div className="card" style={{ padding: '24px', marginBottom: '32px', borderLeft: '4px solid var(--accent-primary)' }}>
                    <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)' }}>{editForm.id ? 'Edit Courier' : 'Add New Courier'}</h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Courier Name</label>
                            <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-body)', color: 'var(--text-main)' }} placeholder="e.g., John Doe Logistics" />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Phone Number</label>
                            <input type="text" required value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '2px solid var(--border-color)', outline: 'none', background: 'var(--bg-body)', color: 'var(--text-main)' }} placeholder="+1 234 567 8900" />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button type="submit" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', border: 'none' }}>Save Courier</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Search by name, phone, or ID..."
                        style={{ width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', border: '2px solid var(--border-color)', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', background: 'var(--bg-card)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'} 
                    />
                </div>
            </div>

            <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading couriers...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}><Truck size={48} /></div>
                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>No couriers found matching your search.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                <th style={{ padding: '8px 20px' }}>ID</th>
                                <th style={{ padding: '8px 20px' }}>Name</th>
                                <th style={{ padding: '8px 20px' }}>Phone</th>
                                <th style={{ padding: '8px 20px', textAlign: 'center' }}>Active Jobs</th>
                                <th style={{ padding: '8px 20px', textAlign: 'center' }}>Total Handled</th>
                                <th style={{ padding: '8px 20px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr key={c.COURIERID} style={{ background: 'var(--bg-body)' }}>
                                    <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px', borderTop: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                        #{c.COURIERID}
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-main)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {c.NAME[0].toUpperCase()}
                                            </div>
                                            {c.NAME}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Phone size={14} /> {c.PHONE}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: c.ACTIVE_SHIPMENTS > 0 ? '#3b82f620' : 'transparent', color: c.ACTIVE_SHIPMENTS > 0 ? '#3b82f6' : 'var(--text-muted)', padding: '4px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem' }}>
                                            <Truck size={14} /> {c.ACTIVE_SHIPMENTS}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>
                                            <Package size={14} /> {c.SHIPMENT_COUNT}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', borderRadius: '0 12px 12px 0', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
                                        <button onClick={() => { setIsEditing(true); setEditForm({ id: c.COURIERID, name: c.NAME, phone: c.PHONE }); }} style={{ padding: '6px', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', opacity: 0.7 }} title="Edit"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(c.COURIERID)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }} title="Delete"><Trash2 size={16} /></button>
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
