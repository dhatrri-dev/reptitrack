import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Box,
  Trash2,
  ChevronDown
} from 'lucide-react';
import dayjs from 'dayjs';

export default function MyShipments() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const customerId = localStorage.getItem('customerId');

    const fetchShipments = useCallback(async () => {
        if (!customerId) {
            setError("Could not find your customer information. Please try logging in again.");
            setLoading(false);
            return;
        }
        try {
            let url = `http://localhost:5000/api/shipments/customer/${customerId}`;
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await axios.get(url);
            setShipments(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to fetch shipments.");
        } finally {
            setLoading(false);
        }
    }, [customerId, searchTerm, statusFilter]);

    useEffect(() => {
        fetchShipments();
    }, [fetchShipments]);

    const getStatusClass = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('delivered')) return 'status-delivered';
        if (s.includes('transit')) return 'status-transit';
        if (s.includes('pending') || s.includes('booked')) return 'status-pending';
        if (s.includes('cancelled')) return 'status-cancelled';
        return '';
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete shipment #${id}?`)) return;
        
        try {
            await axios.delete(`http://localhost:5000/api/shipments/${id}`);
            setShipments(prev => prev.filter(s => s.SHIPMENTID !== id));
        } catch (err) {
            alert(err.response?.data?.error || "Failed to delete shipment.");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="shimmer" style={{ width: '60px', height: '60px', borderRadius: '15px', marginBottom: '20px' }}></div>
                <div style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Synchronizing your shipment database...</div>
            </div>
        );
    }

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants} style={{ padding: '0 0 24px 0' }}>
            <div style={{ marginBottom: '48px' }}>
                <h1 style={{ fontSize: '2.8rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-1.5px', margin: 0, lineHeight: 1.1 }}>
                    My Shipping <span style={{ color: 'var(--accent-primary)' }}>Manifest</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '12px', opacity: 0.8 }}>
                    Monitoring your active and completed cargo units
                </p>
            </div>

            <div className="glass" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '20px', marginBottom: '40px', alignItems: 'center', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)', opacity: 0.6 }} />
                    <input 
                        type="text" 
                        placeholder="Search IDs, Names, or Locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchShipments()}
                        style={{ 
                            width: '100%', 
                            padding: '16px 24px 16px 56px', 
                            borderRadius: '16px', 
                            border: '1px solid var(--border-color)', 
                            background: 'var(--bg-body)', 
                            color: 'var(--text-main)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                    />
                </div>
                
                <div style={{ position: 'relative', minWidth: '240px' }}>
                    <Filter size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '16px 24px 16px 56px', 
                            borderRadius: '16px', 
                            border: '1px solid var(--border-color)', 
                            background: 'var(--bg-body)', 
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            appearance: 'none',
                            outline: 'none'
                        }}
                    >
                        <option value="">Global Manifest: All</option>
                        <option value="Booked">Status: Booked</option>
                        <option value="In Transit">Status: In Transit</option>
                        <option value="Out for Delivery">Status: Out for Delivery</option>
                        <option value="Delivered">Status: Delivered</option>
                        <option value="Cancelled">Status: Cancelled</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                </div>

                <button onClick={fetchShipments} className="btn-primary" style={{ padding: '16px 40px', borderRadius: '16px', height: '100%' }}>Refresh</button>
            </div>

            {error && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px 24px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: '600' }}>Protocol Error:</span> {error}
                </motion.div>
            )}

            {shipments.length === 0 ? (
                <motion.div variants={itemVariants} className="card" style={{ padding: '100px 40px', textAlign: 'center', border: '2px dashed var(--border-color)', background: 'transparent' }}>
                    <Box size={48} style={{ marginBottom: '24px', color: 'var(--text-muted)', opacity: 0.3 }} />
                    <h2 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontWeight: '700' }}>No shipments found</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                        Your logistics manifest is currently empty. Start by creating your first shipment!
                    </p>
                </motion.div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ID</th>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Logistics Route</th>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type</th>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transmission Status</th>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Financials</th>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Timestamp</th>
                                    <th style={{ padding: '18px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {shipments.map((s, idx) => {
                                        const isOutgoing = String(s.CUSTOMERID) === String(customerId);
                                        return (
                                        <motion.tr 
                                            layout
                                            key={s.SHIPMENTID} 
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="table-row-hover"
                                            style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                                        >
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                                                    <span style={{ fontWeight: '700', color: 'var(--text-main)', fontFamily: 'JetBrains Mono, monospace' }}>#{s.SHIPMENTID}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{s.customer_name || "Origin"}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                            <MapPin size={10} style={{ marginRight: '4px' }}/> 
                                                            {s.customer_city}{s.customer_state ? `, ${s.customer_state}` : ''}
                                                            {!s.customer_city && !s.customer_state && "—"}
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={14} style={{ color: 'var(--accent-primary)', opacity: 0.5 }} strokeWidth={3} />
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{s.receiver_name || "Destination"}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                            <MapPin size={10} style={{ marginRight: '4px' }}/> 
                                                            {s.receiver_city}{s.receiver_state ? `, ${s.receiver_state}` : ''}
                                                            {!s.receiver_city && !s.receiver_state && "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span className={`status-badge ${isOutgoing ? 'status-transit' : 'status-delivered'}`} style={{ fontSize: '0.65rem' }}>
                                                    {isOutgoing ? 'SENT' : 'RECEIVED'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span className={`status-badge ${getStatusClass(s.CURRENTSTATUS)}`}>
                                                    {s.CURRENTSTATUS?.toLowerCase().includes('delivered') ? <CheckCircle2 size={10} style={{ marginRight: '6px' }} /> : <Clock size={10} style={{ marginRight: '6px' }} />}
                                                    {s.CURRENTSTATUS}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '1rem' }}>₹{parseFloat(s.TOTALCOST || 0).toFixed(2)}</div>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dayjs(s.BOOKINGDATE).format('MMM DD, YYYY')}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.2)' }}>{dayjs(s.BOOKINGDATE).format('hh:mm A')}</div>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleDelete(s.SHIPMENTID)}
                                                    className="btn-icon"
                                                    style={{ color: '#ef4444', padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', cursor: 'pointer' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.1)'; }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
