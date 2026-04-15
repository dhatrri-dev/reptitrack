import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  LayoutDashboard,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import AlertsPanel from '../components/AlertsPanel';

const API = 'http://localhost:5000/api';

const CountUp = ({ value, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);
    const target = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;

    useEffect(() => {
        let start = 0;
        const duration = 1500;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, stepTime);
        return () => clearInterval(timer);
    }, [target]);

    return (
        <span>
            {prefix}
            {target % 1 === 0 ? count.toLocaleString() : count.toFixed(1)}
            {suffix}
        </span>
    );
};

export default function Dashboard() {
    const [stats, setStats]         = useState(null);
    const [chartData, setChartData] = useState({ shipmentsPerDay: [], revenuePerDay: [] });
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [statsRes, chartsRes] = await Promise.all([
                    axios.get(`${API}/stats`),
                    axios.get(`${API}/stats/charts`),
                ]);
                setStats(statsRes.data);
                setChartData(chartsRes.data);
            } catch (err) {
                console.error('[Dashboard Error]', err);
                setError(err.response?.data?.error || err.message || 'Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const lineData = chartData.shipmentsPerDay || [];
    const revenueData = chartData.revenuePerDay || [];
    const successData = chartData.successRateTrend || [];

    const barData = [
        { name: 'Booked',           count: stats?.booked || 0,         color: '#f59e0b' },
        { name: 'In Transit',       count: stats?.inTransit || 0,      color: '#3b82f6' },
        { name: 'Out for Delivery', count: stats?.outForDelivery || 0, color: '#8b5cf6' },
        { name: 'Delayed',         count: stats?.overdue || 0,         color: '#ef4444' },
        { name: 'Delivered',       count: stats?.delivered || 0,      color: '#10b981' },
        { name: 'Cancelled',       count: stats?.cancelled || 0,      color: '#6b7280' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const isRate = payload[0].dataKey === 'rate';
            const isRevenue = payload[0].dataKey === 'revenue';
            return (
                <div className="glass" style={{ padding: '12px 16px', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
                    <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{label}</p>
                    <p style={{ margin: 0, color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: '700' }}>
                        {isRevenue ? `₹${payload[0].value.toLocaleString()}` : isRate ? `${payload[0].value}%` : payload[0].value} 
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: '500' }}>
                            {isRevenue ? 'Revenue' : isRate ? 'Success Rate' : 'records'}
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const statCards = [
        { label: 'Active Shipments', value: stats?.totalShipments, icon: Package, sub: 'Live from database', iconBg: 'var(--accent-primary-light)', iconColor: 'var(--accent-primary)' },
        { label: 'Total Customers',  value: stats?.totalCustomers, icon: Users, sub: 'Registered customers', iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6' },
        { label: 'Total Revenue',    value: stats?.totalRevenue, icon: DollarSign, sub: 'From all shipments', prefix: '₹', iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981' },
        { label: 'Success Rate',     value: stats?.successRate, icon: TrendingUp, sub: 'Delivery reliability', suffix: '%', iconBg: 'rgba(249,115,22,0.1)', iconColor: '#f97316' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            {}
            <motion.div variants={itemVariants} style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                      <LayoutDashboard size={18} />
                      Management Dashboard
                    </div>
                    <h1 style={{ color: 'var(--text-main)', fontSize: '2.5rem', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '-1.5px' }}>
                        Operational <span style={{ color: 'var(--accent-primary)' }}>Metrics</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0, lineHeight: 1.5 }}>
                        Live analytic breakdown tracking your logistics data.
                    </p>
                </div>
                {error && (
                    <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 24px', borderRadius: '14px', fontSize: '0.9rem', maxWidth: '360px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}
            </motion.div>

            {}
            <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
              <AlertsPanel />
            </motion.div>

            {}
            <motion.div 
                variants={containerVariants}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}
            >
                {statCards.map(card => {
                    const Icon = card.icon;
                    return (
                        <motion.div key={card.label} variants={itemVariants} className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.iconColor }}>
                                    <Icon size={24} />
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: card.iconColor, background: card.iconBg, padding: '4px 8px', borderRadius: '6px' }}>
                                  LIVE
                                </div>
                            </div>
                            <h2 style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</h2>
                            <div style={{ color: 'var(--text-main)', fontSize: '2.5rem', fontWeight: '700', letterSpacing: '-1px', marginBottom: '8px' }}>
                                {loading ? <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '8px', background: 'var(--border-color)', opacity: 0.5, animation: 'pulse 1.5s infinite' }} />
                                 : error ? <span style={{ fontSize: '1.2rem', color: '#ef4444' }}>Error</span>
                                 : <CountUp value={card.value} prefix={card.prefix} suffix={card.suffix} />}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={14} />
                                {card.sub}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {}
            <motion.div 
                variants={containerVariants}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}
            >
                <motion.div variants={itemVariants} className="card" style={{ padding: '24px', height: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', background: 'var(--accent-primary-light)', borderRadius: '10px', color: 'var(--accent-primary)' }}><History size={18} /></div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>Shipment Booking Trends</h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', background: 'var(--accent-primary-light)', padding: '6px 14px', borderRadius: '99px', fontWeight: '700' }}>LAST 30 DAYS</span>
                    </div>
                    <ResponsiveContainer width="100%" height="75%">
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dx={-10} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-primary)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Line type="monotone" dataKey="count" stroke="var(--accent-primary)" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: 'var(--accent-primary)', stroke: 'white', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div variants={itemVariants} className="card" style={{ padding: '24px', height: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981' }}><DollarSign size={18} /></div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>Revenue Trends (₹)</h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 14px', borderRadius: '99px', fontWeight: '700' }}>FINANCIAL OVERVIEW</span>
                    </div>
                    <ResponsiveContainer width="100%" height="75%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dx={-10} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16,185,129,0.05)' }} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div variants={itemVariants} className="card" style={{ padding: '24px', height: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px', color: '#3b82f6' }}><Activity size={18} /></div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>Success Rate (%)</h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '6px 14px', borderRadius: '99px', fontWeight: '700' }}>OPERATIONAL QUALITY</span>
                    </div>
                    <ResponsiveContainer width="100%" height="75%">
                        <LineChart data={successData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dx={-10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="stepAfter" dataKey="rate" stroke="#3b82f6" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: 'white', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div variants={itemVariants} className="card" style={{ padding: '24px', height: '400px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
                      <div style={{ padding: '8px', background: 'var(--accent-primary-light)', borderRadius: '10px', color: 'var(--accent-primary)' }}><Package size={18} /></div>
                      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '700' }}>Status Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="75%">
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dx={-10} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 197, 94, 0.05)' }} />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </motion.div>
            
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.3; }
                50% { opacity: 0.7; }
                100% { opacity: 0.3; }
              }
            `}</style>
        </motion.div>
    );
}