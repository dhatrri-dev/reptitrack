import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Truck, Zap, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';


export default function ShipmentTimeline({ shipmentId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const defaultSteps = [
        { status: 'Booked', icon: <ClipboardList size={18} />, description: 'Shipment has been booked' },
        { status: 'Dispatched', icon: <Truck size={18} />, description: 'Package left the branch' },
        { status: 'In Transit', icon: <Zap size={18} />, description: 'On the way to destination' },
        { status: 'Out for Delivery', icon: <Package size={18} />, description: 'Courier is arriving soon' },
        { status: 'Delivered', icon: <CheckCircle size={18} />, description: 'Successfully delivered' }
    ];

   
    const isCancelled = history.some(h => h.status.toLowerCase() === 'cancelled');
    const isDelayed = history.some(h => h.status.toLowerCase() === 'delayed');

   
    const steps = [...defaultSteps];
    
   
    if (isCancelled) {
        const deliveredIdx = steps.findIndex(s => s.status === 'Delivered');
        if (deliveredIdx !== -1) {
            steps[deliveredIdx] = { status: 'Cancelled', icon: <AlertCircle size={18} />, description: 'Shipment has been cancelled' };
        }
    }

   
    if (isDelayed) {
        const transitIdx = steps.findIndex(s => s.status === 'In Transit');
        if (transitIdx !== -1) {
            steps.splice(transitIdx + 1, 0, { status: 'Delayed', icon: <Clock size={18} />, description: 'Temporary delay in transit' });
        }
    }

    useEffect(() => {
        const fetchHistory = async () => {
            if (!shipmentId) return;
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/shipments/${shipmentId}/timeline`);
                setHistory(res.data || []);
            } catch (err) {
                console.error('[Timeline Fetch Error]', err);
                setError('Failed to load tracking history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [shipmentId]);

    if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '20px' }}>Loading timeline...</div>;
    if (error) return <div style={{ color: '#ef4444', fontSize: '0.9rem', padding: '20px' }}>{error}</div>;

   
   
    const getStepStatus = (stepName) => {
        return history.find(h => h.status.toLowerCase() === stepName.toLowerCase());
    };

   
    let lastCompletedIndex = -1;
    steps.forEach((step, idx) => {
        if (getStepStatus(step.status)) {
            lastCompletedIndex = idx;
        }
    });

    return (
        <div style={{ marginTop: '32px', position: 'relative', paddingLeft: '40px' }}>
            {}
            <div style={{ 
                position: 'absolute', left: '15px', top: '10px', bottom: '10px', 
                width: '3px', background: 'var(--border-color)', borderRadius: '2px' 
            }}></div>

            {steps.map((step, idx) => {
                const stepData = getStepStatus(step.status);
                const isCompleted = idx <= lastCompletedIndex;
                const isCurrent = idx === lastCompletedIndex;

                return (
                    <div key={idx} style={{ position: 'relative', marginBottom: '32px' }}>
                        {}
                        <div style={{
                            position: 'absolute', left: '-40px', top: '0', 
                            width: '34px', height: '34px', borderRadius: '12px',
                            background: isCompleted ? 'var(--accent-primary)' : 'var(--bg-card)',
                            border: `3px solid ${isCompleted ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', zject: '1', boxShadow: isCurrent ? '0 0 15px rgba(140, 198, 63, 0.5)' : 'none',
                            transition: 'all 0.3s ease'
                        }}>
                            {isCompleted ? '✓' : idx + 1}
                        </div>

                        {}
                        <div style={{ opacity: isCompleted ? 1 : 0.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h4 style={{ 
                                    margin: 0, fontSize: '1.1rem', fontWeight: '800', 
                                    color: isCurrent ? 'var(--accent-primary)' : 'var(--text-main)',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    {step.icon} {step.status}
                                    {isCurrent && <span style={{ 
                                        fontSize: '0.65rem', background: 'var(--accent-primary)', 
                                        color: 'white', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' 
                                    }}>Current</span>}
                                </h4>
                                {stepData && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                        {new Date(stepData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                            
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {stepData ? stepData.location : step.description}
                            </p>
                            
                            {stepData && stepData.remarks && (
                                <p style={{ 
                                    margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--accent-primary)', 
                                    fontStyle: 'italic', background: 'var(--accent-primary-light)', 
                                    padding: '4px 10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)'
                                }}>
                                    "{stepData.remarks}"
                                </p>
                            )}

                            {stepData && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {new Date(stepData.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
