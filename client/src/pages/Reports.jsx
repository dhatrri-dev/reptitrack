import React, { useState } from 'react';
import axios from 'axios';
import { Package, DollarSign, CheckCircle, Truck, Clock, AlertTriangle, Zap, Printer, Search, TrendingUp, ClipboardList } from 'lucide-react';


const API = 'http://localhost:5000/api';

const STATUS_OPTIONS = ['All', 'Booked', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled'];

const getStatusColor = (s) => {
    if (!s) return '#6b7280';
    const l = s.toLowerCase();
    if (l.includes('delivered'))  return '#10b981';
    if (l.includes('transit'))    return '#3b82f6';
    if (l.includes('out for'))    return '#8b5cf6';
    if (l.includes('delayed'))    return '#ef4444';
    if (l.includes('cancelled'))  return '#ef4444';
    return '#f59e0b';
};

export default function Reports() {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [from, setFrom]       = useState(firstOfMonth);
    const [to, setTo]           = useState(today);
    const [status, setStatus]   = useState('All');
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/reports`, {
                params: { from, to, status }
            });
            setData(res.data);
        } catch (err) {
            alert('Failed to generate report: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => window.print();

    const fmt = (v) => v != null ? `₹${parseFloat(v).toFixed(2)}` : '₹0.00';

    const summaryCards = data?.summary ? [
        { label: 'Total Shipments',  value: data.summary.totalShipments || 0, icon: <Package size={24} strokeWidth={2} />, color: '#8cc63f' },
        { label: 'Total Revenue',    value: fmt(data.summary.totalRevenue),    icon: <DollarSign size={24} strokeWidth={2} />, color: '#10b981' },
        { label: 'Delivered',        value: data.summary.delivered || 0,       icon: <CheckCircle size={24} strokeWidth={2} />, color: '#3b82f6' },
        { label: 'In Transit',       value: data.summary.inTransit || 0,       icon: <Truck size={24} strokeWidth={2} />, color: '#8b5cf6' },
        { label: 'Pending / Booked', value: data.summary.pending || 0,         icon: <Clock size={24} strokeWidth={2} />, color: '#f59e0b' },
        { label: 'Issues',           value: data.summary.issues || 0,          icon: <AlertTriangle size={24} strokeWidth={2} />, color: '#ef4444' },
    ] : [];

    return (
        <>
            {/* Print-only header (hidden on screen) */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; color: black !important; }
                    .card { box-shadow: none !important; border: 1px solid #ddd !important; background: white !important; }
                }
                .print-only { display: none; }
            `}</style>

            {/* Print header visible only on paper */}
            <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #8cc63f', paddingBottom: '16px' }}>
                <h1 style={{ margin: 0, color: '#8cc63f', fontSize: '2rem', fontWeight: '800' }}>ReptiTrack — Shipment Report</h1>
                <p style={{ margin: '4px 0 0', color: '#555' }}>
                    Period: {from} → {to} &nbsp;|&nbsp; Status: {status} &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString()}
                </p>
            </div>

            {/* ── Screen UI ── */}
            <div className="no-print">
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>
                        Shipment <span style={{ color: 'var(--accent-primary)' }}>Reports</span>
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Filter by date range and status, then generate a printable summary report.
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From Date</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '2px solid var(--border-color)', outline: 'none',
                            fontFamily: 'inherit', fontSize: '0.95rem',
                            background: 'var(--bg-body)', color: 'var(--text-main)', boxSizing: 'border-box'
                        }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To Date</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '2px solid var(--border-color)', outline: 'none',
                            fontFamily: 'inherit', fontSize: '0.95rem',
                            background: 'var(--bg-body)', color: 'var(--text-main)', boxSizing: 'border-box'
                        }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Filter</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '2px solid var(--border-color)', outline: 'none',
                            fontFamily: 'inherit', fontSize: '0.95rem',
                            background: 'var(--bg-body)', color: 'var(--text-main)', boxSizing: 'border-box', cursor: 'pointer'
                        }}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem', alignSelf: 'flex-end', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? <><Clock size={16} /> Generating...</> : <><Zap size={16} /> Generate Report</>}
                    </button>
                </div>
            </div>

            {/* ── Report Output ── */}
            {data && (
                <div>
                    {/* Print action (screen only) */}
                    <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.3rem', fontWeight: '700' }}>
                            Report Results
                            <span style={{ marginLeft: '12px', color: 'var(--text-muted)', fontWeight: '400', fontSize: '1rem' }}>
                                {from} → {to}
                            </span>
                        </h2>
                        <button onClick={handlePrint} style={{
                            padding: '10px 24px', borderRadius: '12px',
                            background: 'var(--accent-primary)', color: 'white',
                            border: 'none', fontFamily: 'inherit', fontWeight: '700',
                            fontSize: '0.9rem', cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(140,198,63,0.3)',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <Printer size={16} /> Print / Export PDF
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                        {summaryCards.map(card => (
                            <div key={card.label} className="card stat-card" style={{ padding: '20px 16px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                <div className="icon-wrapper" style={{
                                    margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${card.color}20, ${card.color}05)`,
                                    color: card.color, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${card.color}30, inset 0 2px 4px rgba(255,255,255,0.1)`,
                                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    {card.icon}
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: card.color }}>{card.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>{card.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Shipments Table */}
                    <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                        <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', fontWeight: '700' }}>
                            <ClipboardList size={20} color="var(--accent-primary)" style={{ marginRight: '8px' }} /> Shipment Details
                            <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.9rem' }}>
                                {data.shipments.length} record{data.shipments.length !== 1 ? 's' : ''}
                            </span>
                        </h3>

                        {data.shipments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}>
                                    <Search size={48} />
                                </div>
                                <p style={{ fontWeight: '600', marginTop: '12px' }}>No shipments found for this filter.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', whiteSpace: 'nowrap' }}>
                                <thead>
                                    <tr>
                                        {['ID', 'Customer', 'Receiver', 'Booking Date', 'Expected Delivery', 'Status', 'Cost'].map(h => (
                                            <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.shipments.map((s, i) => (
                                        <tr key={s.SHIPMENTID} style={{ background: 'var(--bg-body)' }}>
                                            <td style={{ padding: '14px', fontWeight: '700', color: 'var(--accent-primary)', borderRadius: '12px 0 0 12px', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>#{s.SHIPMENTID}</td>
                                            <td style={{ padding: '14px', color: 'var(--text-main)', fontWeight: '600', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>{s.customer_name || `#${s.CUSTOMERID}`}</td>
                                            <td style={{ padding: '14px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>{s.receiver_name || `#${s.RECEIVERID}`}</td>
                                            <td style={{ padding: '14px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>{new Date(s.BOOKINGDATE).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>{new Date(s.EXPECTEDDELIVERYDATE).toLocaleDateString()}</td>
                                            <td style={{ padding: '14px', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '99px', background: `${getStatusColor(s.CURRENTSTATUS)}18`, color: getStatusColor(s.CURRENTSTATUS), fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(s.CURRENTSTATUS) }}></span>
                                                    {s.CURRENTSTATUS || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px', fontWeight: '700', color: 'var(--text-main)', borderRadius: '0 12px 12px 0', borderTop: '1px solid var(--border-color)', borderBottom: i === data.shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>₹{parseFloat(s.TOTALCOST || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="6" style={{ padding: '16px 14px', color: 'var(--text-muted)', fontWeight: '700', textAlign: 'right', fontSize: '0.9rem' }}>TOTAL REVENUE</td>
                                        <td style={{ padding: '16px 14px', fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>{fmt(data.summary.totalRevenue)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {!data && !loading && (
                <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}>
                        <TrendingUp size={64} />
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Set your filters above and click Generate Report</p>
                    <p style={{ fontSize: '0.9rem' }}>Results can be printed or saved as PDF</p>
                </div>
            )}

            <style>{`
                .stat-card:hover .icon-wrapper {
                    transform: scale(1.05);
                }
            `}</style>
        </>
    );
}
