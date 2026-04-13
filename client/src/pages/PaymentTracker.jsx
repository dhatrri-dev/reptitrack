import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CreditCard, DollarSign, CheckCircle, Clock, Search } from 'lucide-react';

const API = 'http://localhost:5000/api';

const STATUS_CONFIG = {
    'Paid':      { color: '#10b981', bg: '#10b98118', label: 'Paid' },
    'Completed': { color: '#10b981', bg: '#10b98118', label: 'Completed' },
    'Pending':   { color: '#f59e0b', bg: '#f59e0b18', label: 'Pending' },
    'Failed':    { color: '#ef4444', bg: '#ef444418', label: 'Failed' },
    'Overdue':   { color: '#ef4444', bg: '#ef444418', label: 'Overdue' },
};

const getStatusStyle = (status) => STATUS_CONFIG[status] || { color: '#6b7280', bg: '#6b728018', label: status || 'Unknown' };

export default function PaymentTracker() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [paymentsRes, summaryRes] = await Promise.all([
                axios.get(`${API}/payments`),
                axios.get(`${API}/payments/summary`),
            ]);
            setPayments(paymentsRes.data);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error('Failed to load payments:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filtered = payments.filter(p => {
        let matchesFilter = filter === 'All';
        if (filter === 'Paid') {
            matchesFilter = p.PAYMENTSTATUS === 'Paid' || p.PAYMENTSTATUS === 'Completed';
        } else if (filter !== 'All') {
            matchesFilter = p.PAYMENTSTATUS === filter;
        }

        const q = search.toLowerCase();
        const matchesSearch = !q ||
            String(p.PAYMENTID).includes(q) ||
            String(p.SHIPMENTID).includes(q) ||
            (p.CUSTOMER_NAME || '').toLowerCase().includes(q) ||
            (p.PAYMENTMETHOD || '').toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    const fmt = (val) => val != null ? `₹${parseFloat(val).toFixed(2)}` : '₹0.00';

    const statCards = summary ? [
        { label: 'Total Payments', value: summary.total || 0, icon: <CreditCard size={28} strokeWidth={1.5} />, color: '#8cc63f', sub: 'All records' },
        { label: 'Total Revenue', value: fmt(summary.totalRevenue), icon: <DollarSign size={28} strokeWidth={1.5} />, color: '#10b981', sub: 'All time' },
        { label: 'Collected', value: fmt(summary.paidRevenue), icon: <CheckCircle size={28} strokeWidth={1.5} />, color: '#3b82f6', sub: 'Paid / Completed' },
        { label: 'Pending', value: fmt(summary.pendingRevenue), icon: <Clock size={28} strokeWidth={1.5} />, color: '#f59e0b', sub: 'Awaiting payment' },
    ] : [];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>
                    Payment <span style={{ color: 'var(--accent-primary)' }}>Tracker</span>
                </h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
                    Monitor all payments, revenue, and outstanding balances in real time.
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {statCards.map(card => (
                        <div key={card.label} className="card stat-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="icon-wrapper" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${card.color}20, ${card.color}05)`,
                                    color: card.color,
                                    boxShadow: `0 4px 16px ${card.color}30, inset 0 2px 4px rgba(255,255,255,0.1)`,
                                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}>
                                    {card.icon}
                                </div>
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%',
                                    background: card.color, boxShadow: `0 0 8px ${card.color}80`
                                }}></div>
                            </div>
                            <div style={{ fontSize: '1.7rem', fontWeight: '800', color: card.color, letterSpacing: '-1px', marginTop: '8px' }}>
                                {card.value}
                            </div>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>{card.label}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{card.sub}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters + Search */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {[
                        { id: 'All', label: 'All Payments' },
                        { id: 'Pending', label: 'Pending' },
                        { id: 'Paid', label: 'Completed' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            style={{
                                padding: '14px 28px', borderRadius: '18px',
                                fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem',
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: filter === f.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                                color: filter === f.id ? 'white' : 'var(--text-muted)',
                                boxShadow: filter === f.id ? '0 6px 16px rgba(140,198,63,0.3)' : 'var(--shadow-soft)',
                                border: filter === f.id ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)'
                            }}
                        >
                            {f.label}
                            <span style={{ marginLeft: '10px', opacity: 0.8, fontSize: '0.8rem', fontWeight: '500' }}>
                                {f.id === 'All' ? payments.length : 
                                 f.id === 'Paid' ? payments.filter(p => p.PAYMENTSTATUS === 'Paid' || p.PAYMENTSTATUS === 'Completed').length :
                                 payments.filter(p => p.PAYMENTSTATUS === f.id).length}
                            </span>
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by ID, customer, method..."
                        style={{
                            padding: '10px 14px 10px 42px', borderRadius: '12px',
                            border: '2px solid var(--border-color)', outline: 'none',
                            fontFamily: 'inherit', fontSize: '0.9rem',
                            background: 'var(--bg-card)', color: 'var(--text-main)',
                            width: '260px',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                    />
                </div>
            </div>

            {/* Payment Table */}
            <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading payments...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}>
                            <CreditCard size={48} />
                        </div>
                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>No payments found for this filter.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', whiteSpace: 'nowrap' }}>
                        <thead>
                            <tr>
                                {['Payment ID', 'Shipment ID', 'Customer', 'Amount', 'Method', 'Date', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p, i) => {
                                const st = getStatusStyle(p.PAYMENTSTATUS);
                                return (
                                    <tr key={p.PAYMENTID} style={{ background: 'var(--bg-body)' }}>
                                        <td style={{ padding: '16px', fontWeight: '700', color: 'var(--accent-primary)', borderRadius: '12px 0 0 12px', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            #{p.PAYMENTID}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            #{p.SHIPMENTID}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '600', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            {p.CUSTOMER_NAME || '—'}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            {fmt(p.AMOUNT)}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            {p.PAYMENTMETHOD || '—'}
                                        </td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            {p.PAYMENTDATE ? new Date(p.PAYMENTDATE).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ padding: '16px', borderRadius: '0 12px 12px 0', borderTop: '1px solid var(--border-color)', borderBottom: i === filtered.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 14px', borderRadius: '99px',
                                                background: st.bg, color: st.color,
                                                fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color }}></span>
                                                {st.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            
            <style>{`
                .stat-card:hover .icon-wrapper {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
