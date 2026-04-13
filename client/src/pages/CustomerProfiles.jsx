import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, Phone, Package, CheckCircle, DollarSign, ClipboardList, User, MapPin } from 'lucide-react';


const API = 'http://localhost:5000/api';

const getStatusColor = (status) => {
    const s = status?.toLowerCase();
    if (s?.includes('delivered')) return '#10b981';
    if (s?.includes('transit')) return '#3b82f6';
    if (s?.includes('out for')) return '#8b5cf6';
    if (s?.includes('delayed')) return '#ef4444';
    if (s?.includes('cancelled')) return '#6b7280';
    return '#f59e0b';
};

export default function CustomerProfiles() {
    const [view, setView] = useState('all'); // 'all' or 'search'
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [shipments, setShipments] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingShipments, setLoadingShipments] = useState(false);
    const [allCustomers, setAllCustomers] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);

    useEffect(() => {
        if (view === 'all') {
            fetchAllCustomers();
        }
    }, [view]);

    const fetchAllCustomers = async () => {
        setLoadingAll(true);
        try {
            const res = await axios.get(`${API}/customers`);
            setAllCustomers(res.data);
        } catch (err) {
            console.error('Failed to fetch customers:', err);
        } finally {
            setLoadingAll(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoadingSearch(true);
        setSelected(null);
        setShipments([]);
        try {
            const res = await axios.get(`${API}/customers/search?q=${encodeURIComponent(query)}`);
            setResults(res.data);
        } catch (err) {
            alert('Search failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSelect = async (customer) => {
        setSelected(customer);
        setResults([]);
        setQuery(customer.NAME || '');
        setLoadingShipments(true);
        try {
            const res = await axios.get(`${API}/customers/${customer.CUSTOMERID}/shipments`);
            setShipments(res.data);
        } catch (err) {
            alert('Could not load shipments: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoadingShipments(false);
        }
    };

    const totalSpent = shipments.reduce((sum, s) => sum + (parseFloat(s.TOTALCOST) || 0), 0);
    const delivered = shipments.filter(s => s.CURRENTSTATUS?.toLowerCase().includes('delivered')).length;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ color: 'var(--text-main)', margin: '0 0 8px', fontSize: '2rem', fontWeight: '700', letterSpacing: '-1px' }}>
                    Customer <span style={{ color: 'var(--accent-primary)' }}>Profiles</span>
                </h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
                    Search any customer to view their complete shipment history.
                </p>
            </div>

            {/* Contextual Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <button 
                    onClick={() => setView('all')}
                    style={{
                        padding: '12px 24px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                        background: view === 'all' ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: view === 'all' ? 'white' : 'var(--text-muted)',
                        fontWeight: '600', transition: 'all 0.2s', fontSize: '0.95rem',
                        boxShadow: view === 'all' ? '0 6px 12px rgba(140,198,63,0.3)' : 'var(--shadow-soft)'
                    }}
                >
                    All Customers
                </button>
                <button 
                    onClick={() => setView('search')}
                    style={{
                        padding: '12px 24px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                        background: view === 'search' ? 'var(--accent-primary)' : 'var(--bg-card)',
                        color: view === 'search' ? 'white' : 'var(--text-muted)',
                        fontWeight: '600', transition: 'all 0.2s', fontSize: '0.95rem',
                        boxShadow: view === 'search' ? '0 6px 12px rgba(140,198,63,0.3)' : 'var(--shadow-soft)'
                    }}
                >
                    Search Profiles
                </button>
            </div>

            {view === 'all' ? (
                <div className="card" style={{ padding: '24px', overflowX: 'auto' }}>
                    <h3 style={{ margin: '0 0 24px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} color="var(--accent-primary)" /> Master Customer Directory
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>({allCustomers.length} total)</span>
                    </h3>
                    {loadingAll ? (
                        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>Loading directory...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '8px 20px' }}>ID</th>
                                    <th style={{ padding: '8px 20px' }}>Name</th>
                                    <th style={{ padding: '8px 20px' }}>Email</th>
                                    <th style={{ padding: '8px 20px' }}>City</th>
                                    <th style={{ padding: '8px 20px' }}>Status</th>
                                    <th style={{ padding: '8px 20px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCustomers.map(c => (
                                    <tr key={c.CUSTOMERID} style={{ background: 'var(--bg-body)' }}>
                                        <td style={{ padding: '16px 20px', borderRadius: '12px 0 0 12px', borderTop: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--accent-primary)' }}>#{c.CUSTOMERID}</td>
                                        <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-main)' }}>{c.NAME}</td>
                                        <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{c.EMAIL || '—'}</td>
                                        <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{c.CITY || '—'}</td>
                                        <td style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '99px', background: c.STATUS === 'Active' ? '#10b98120' : '#6b728020', color: c.STATUS === 'Active' ? '#10b981' : '#6b7280', fontSize: '0.75rem', fontWeight: '800' }}>
                                                {c.STATUS?.toUpperCase() || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', borderRadius: '0 12px 12px 0', borderTop: '1px solid var(--border-color)' }}>
                                            <button 
                                                onClick={() => { setView('search'); handleSelect(c); }}
                                                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--accent-primary)', background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <>
            {/* Search Bar */}
            <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '600px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or customer ID..."
                            style={{
                                width: '100%', padding: '16px 16px 16px 50px',
                                borderRadius: '16px', border: '2px solid var(--border-color)',
                                outline: 'none', fontFamily: 'inherit', fontSize: '1rem',
                                background: 'var(--bg-card)', color: 'var(--text-main)',
                                boxSizing: 'border-box', transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '16px 28px', borderRadius: '16px', fontSize: '1rem', whiteSpace: 'nowrap' }}>
                        {loadingSearch ? '...' : 'Search'}
                    </button>
                </div>

                {/* Dropdown Suggestions */}
                {results.length > 0 && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: '120px',
                        background: 'var(--bg-card)', border: '2px solid var(--border-color)',
                        borderRadius: '16px', marginTop: '8px', zIndex: 100,
                        overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                    }}>
                        {results.map(customer => (
                            <div
                                key={customer.CUSTOMERID}
                                onClick={() => handleSelect(customer)}
                                style={{
                                    padding: '16px 20px', cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-primary-light)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: 'var(--accent-primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: '700', fontSize: '0.95rem', flexShrink: 0
                                }}>
                                    {(customer.NAME || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>{customer.NAME}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        ID: {customer.CUSTOMERID} • {customer.EMAIL || 'No email'}
                                        {customer.CITY && ` • ${customer.CITY}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {results.length === 0 && query && !loadingSearch && !selected && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: '120px', background: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', marginTop: '8px', padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No customers found. Try a different search.
                    </div>
                )}
            </form>

            {/* Selected Customer Profile */}
            {selected && (
                <div>
                    {/* Customer Card */}
                    <div className="card" style={{ padding: '28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '24px',
                            background: 'var(--accent-primary)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '1.8rem', flexShrink: 0,
                            boxShadow: '0 8px 20px rgba(140, 198, 63, 0.3)'
                        }}>
                            {(selected.NAME || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ margin: '0 0 4px', color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '700' }}>{selected.NAME}</h2>
                            <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                ID: <strong style={{ color: 'var(--accent-primary)' }}>#{selected.CUSTOMERID}</strong>
                                {selected.EMAIL && <> &nbsp;•&nbsp; {selected.EMAIL}</>}
                                {selected.PHONENO && <> &nbsp;•&nbsp; <Phone size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {selected.PHONENO}</>}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <MapPin size={14} />
                                {selected.STREET && `${selected.STREET}, `}
                                {selected.CITY || '—'}{selected.STATE ? `, ${selected.STATE}` : ''}
                                {selected.PINCODE && ` [${selected.PINCODE}]`}
                            </div>
                        </div>
                        {/* Quick Stats */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Total Shipments', value: shipments.length, icon: <Package size={24} strokeWidth={2} />, color: '#8cc63f' },
                                { label: 'Delivered', value: delivered, icon: <CheckCircle size={24} strokeWidth={2} />, color: '#10b981' },
                                { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, icon: <DollarSign size={24} strokeWidth={2} />, color: '#3b82f6' },
                            ].map(stat => (
                                <div key={stat.label} className="stat-box" style={{
                                    background: 'var(--bg-body)', borderRadius: '16px', padding: '16px 20px',
                                    textAlign: 'center', minWidth: '130px', border: '1px solid var(--border-color)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div className="icon-wrapper" style={{
                                        margin: '0 auto 12px', width: '48px', height: '48px', borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}05)`,
                                        color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 12px ${stat.color}30, inset 0 2px 4px rgba(255,255,255,0.1)`,
                                        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}>
                                        {stat.icon}
                                    </div>
                                    <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)', margin: '4px 0 2px' }}>{stat.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipment History */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 20px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', fontSize: '1.1rem', fontWeight: '700' }}>
                            <ClipboardList size={20} color="var(--accent-primary)" style={{ marginRight: '8px' }} /> Shipment History
                            <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>
                                {shipments.length} record{shipments.length !== 1 ? 's' : ''} found
                            </span>
                        </h3>

                        {loadingShipments ? (
                            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading shipments...</div>
                        ) : shipments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                No shipments found for this customer.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', whiteSpace: 'nowrap' }}>
                                <thead>
                                    <tr>
                                        {['Shipment ID', 'Receiver', 'Booking Date', 'Expected Delivery', 'Status', 'Total Cost'].map(h => (
                                            <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {shipments.map((s, i) => (
                                        <tr key={s.SHIPMENTID} style={{ background: 'var(--bg-body)', borderRadius: '12px' }}>
                                            <td style={{ padding: '16px', fontWeight: '700', color: 'var(--accent-primary)', borderRadius: '12px 0 0 12px', borderTop: '1px solid var(--border-color)', borderBottom: i === shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                #{s.SHIPMENTID}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: '600', borderTop: '1px solid var(--border-color)', borderBottom: i === shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                {s.receiver_name || `Receiver #${s.RECEIVERID}`}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                {new Date(s.BOOKINGDATE).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', borderBottom: i === shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                {new Date(s.EXPECTEDDELIVERYDATE).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid var(--border-color)', borderBottom: i === shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '5px 12px', borderRadius: '99px',
                                                    background: `${getStatusColor(s.CURRENTSTATUS)}18`,
                                                    color: getStatusColor(s.CURRENTSTATUS),
                                                    fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase'
                                                }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(s.CURRENTSTATUS) }}></span>
                                                    {s.CURRENTSTATUS || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', fontWeight: '700', color: 'var(--text-main)', borderRadius: '0 12px 12px 0', borderTop: '1px solid var(--border-color)', borderBottom: i === shipments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                ${parseFloat(s.TOTALCOST || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {!selected && !loadingSearch && (
                <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: 0.3 }}>
                        <User size={48} />
                    </div>
                    <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Search for a customer above to view their profile</p>
                    <p style={{ fontSize: '0.9rem' }}>Search by customer name or ID</p>
                </div>
            )}
            </>
            )}

            <style>{`
                .stat-box:hover .icon-wrapper {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
}
