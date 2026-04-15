import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Spin, List, Button } from 'antd';
import { WarningOutlined, SyncOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AlertsPanel() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/alerts`);
            setAlerts(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('[Alerts Fetch Error]', err);
            setError('Failed to load alerts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const d = new Date(dateString);
        return d.toLocaleDateString() + (d.getHours() > 0 ? ` at ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` : '');
    };

    const delayed = alerts.filter(a => a.type === 'delayed');
    const cancelled = alerts.filter(a => a.type === 'cancelled');

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ThunderboltOutlined style={{ color: 'var(--accent-primary)' }} />
                    Live Shipment Alerts
                </h3>
                <Button 
                    type="text" 
                    icon={<SyncOutlined spin={loading} />} 
                    onClick={fetchAlerts}
                    title="Refresh Live Alerts"
                    style={{ color: 'var(--text-muted)' }}
                >
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin /> <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Checking for alerts...</span>
                </div>
            ) : error ? (
                <Alert message="Error" description={error} type="error" showIcon />
            ) : alerts.length === 0 ? (
                <Alert 
                    message="All Clear" 
                    description="No urgent notifications at this time!" 
                    type="success" 
                    showIcon 
                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '16px' }}
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                    {}
                    {delayed.length > 0 && (
                        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <WarningOutlined /> Delayed ({delayed.length})
                            </h4>
                            <List
                                itemLayout="horizontal"
                                dataSource={delayed}
                                style={{ maxHeight: '250px', overflowY: 'auto' }}
                                renderItem={item => (
                                    <List.Item style={{ padding: '12px', background: 'var(--bg-body)', borderRadius: '12px', marginBottom: '8px' }}>
                                        <List.Item.Meta
                                            avatar={<div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle color="#ef4444" size={20} /></div>}
                                            title={<span style={{ fontWeight: '700', color: 'var(--text-main)' }}>#{item.shipmentId}</span>}
                                            description={<span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>Since: {formatDate(item.date)}</span>}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}

                    {}
                    {cancelled.length > 0 && (
                        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
                            <h4 style={{ color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <WarningOutlined /> Cancelled ({cancelled.length})
                            </h4>
                            <List
                                itemLayout="horizontal"
                                dataSource={cancelled}
                                style={{ maxHeight: '250px', overflowY: 'auto' }}
                                renderItem={item => (
                                    <List.Item style={{ padding: '12px', background: 'var(--bg-body)', borderRadius: '12px', marginBottom: '8px' }}>
                                        <List.Item.Meta
                                            avatar={<div style={{ width: '36px', height: '36px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle color="#ef4444" size={20} /></div>}
                                            title={<span style={{ fontWeight: '700', color: 'var(--text-main)' }}>#{item.shipmentId}</span>}
                                            description={<span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>Date: {formatDate(item.date)}</span>}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
