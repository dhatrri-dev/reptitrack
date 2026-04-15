import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, User, MapPin, Shield } from 'lucide-react';

export default function CreateShipment() {
    const navigate = useNavigate();
    const customerId = localStorage.getItem('customerId');
    
    const [serviceTypes, setServiceTypes] = useState([
        { SERVICETYPEID: 1, SERVICENAME: 'Standard', DELIVERYDAYS: 5 },
        { SERVICETYPEID: 2, SERVICENAME: 'Express', DELIVERYDAYS: 2 },
        { SERVICETYPEID: 3, SERVICENAME: 'Same Day', DELIVERYDAYS: 1 }
    ]);
    const [senderInfo, setSenderInfo] = useState(null);
    const [formData, setFormData] = useState({
        senderStreet: '',
        senderCity: '',
        senderState: '',
        senderPincode: '',
        receiverName: '',
        receiverEmail: '',
        receiverStreet: '',
        receiverCity: '',
        receiverState: '',
        receiverPincode: '',
        serviceTypeId: '1',
        priority: 'Normal'
    });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSender = async () => {
            if (!customerId) return;
            try {
                const res = await axios.get(`http://localhost:5000/api/customers/${customerId}`);
                const data = res.data;
                setSenderInfo(data);
                setFormData(prev => ({ 
                    ...prev, 
                    senderStreet: data.STREET || '',
                    senderPincode: data.PINCODE || '',
                    senderCity: data.CITY || '',
                    senderState: data.STATE || ''
                }));
            } catch (err) {
                console.error('Failed to fetch sender');
            }
        };

        const fetchServices = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/service_types');
                if (res.data && res.data.length > 0) {
                    setServiceTypes(res.data);
                    setFormData(prev => ({ ...prev, serviceTypeId: res.data[0].SERVICETYPEID.toString() }));
                }
            } catch (err) {
                console.error('Failed to fetch service types');
            }
        };

        fetchSender();
        fetchServices();
    }, [customerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const payload = {
            customerId,
            sender: {
                street: formData.senderStreet,
                city: formData.senderCity,
                state: formData.senderState,
                pincode: formData.senderPincode
            },
            receiver: {
                name: formData.receiverName,
                email: formData.receiverEmail,
                street: formData.receiverStreet,
                city: formData.receiverCity,
                state: formData.receiverState,
                pincode: formData.receiverPincode
            },
            serviceTypeId: formData.serviceTypeId,
            priority: formData.priority
        };

        try {
            const res = await axios.post('http://localhost:5000/api/shipments/create-with-receiver', payload);
            setSuccess(`Shipment created successfully! ID: ${res.data.shipmentId}`);
            
            setTimeout(() => {
                navigate('/my-shipments');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create shipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Create New Shipment</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Fill in the details below to book your courier instantly.</p>
            </div>

            {error && (
                <div style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #fecaca' }}>
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #bbf7d0' }}>
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                    {}
                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px' }}>
                                <Shield size={24} color="#22c55e" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Your Details (Sender)</h3>
                        </div>

                        {senderInfo && (
                            <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-body)', borderRadius: '10px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Booking as: </span>
                                <strong style={{ color: 'var(--text-main)' }}>{senderInfo.NAME}</strong>
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Street Address</label>
                            <input 
                                type="text" name="senderStreet" value={formData.senderStreet} 
                                onChange={handleChange} required placeholder="Building no, Street name"
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>City</label>
                                <input 
                                    type="text" name="senderCity" value={formData.senderCity} 
                                    onChange={handleChange} required placeholder="City"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>State</label>
                                <input 
                                    type="text" name="senderState" value={formData.senderState} 
                                    onChange={handleChange} required placeholder="State"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Pincode</label>
                            <input 
                                type="text" name="senderPincode" value={formData.senderPincode} 
                                onChange={handleChange} required placeholder="Pincode"
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>

                    {}
                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '10px' }}>
                                <User size={24} color="#7c3aed" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Receiver Details</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Full Name</label>
                                <input 
                                    type="text" name="receiverName" value={formData.receiverName} 
                                    onChange={handleChange} required placeholder="Receiver's name"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Email Address</label>
                                <input 
                                    type="email" name="receiverEmail" value={formData.receiverEmail} 
                                    onChange={handleChange} required placeholder="receiver@example.com"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Street Address</label>
                            <input 
                                type="text" name="receiverStreet" value={formData.receiverStreet} 
                                onChange={handleChange} required placeholder="Building no, Street name"
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>City</label>
                                <input 
                                    type="text" name="receiverCity" value={formData.receiverCity} 
                                    onChange={handleChange} required placeholder="City"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>State</label>
                                <input 
                                    type="text" name="receiverState" value={formData.receiverState} 
                                    onChange={handleChange} required placeholder="State"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Pincode</label>
                            <input 
                                type="text" name="receiverPincode" value={formData.receiverPincode} 
                                onChange={handleChange} required placeholder="Pincode"
                                style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>
                </div>

                {}
                <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                            <MapPin size={24} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>Shipment Options</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Service Type</label>
                            <select 
                                name="serviceTypeId" value={formData.serviceTypeId} 
                                onChange={handleChange} required
                                style={{ width: '100%', height: '56px', padding: '0 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
                            >
                                {serviceTypes.map(s => (
                                    <option key={s.SERVICETYPEID} value={s.SERVICETYPEID}>
                                        {s.SERVICENAME} ({s.DELIVERYDAYS} Days)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>Priority</label>
                            <select 
                                name="priority" value={formData.priority} 
                                onChange={handleChange} required
                                style={{ width: '100%', height: '56px', padding: '0 18px', borderRadius: '12px', background: 'var(--bg-body)', border: '2px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
                            >
                                <option value="Normal">Normal</option>
                                <option value="High">High (Express)</option>
                                <option value="Urgent">Urgent (Next Day)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" disabled={loading} className="btn-primary"
                    style={{ width: '100%', height: '64px', fontSize: '1.2rem', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)' }}
                >
                    {loading ? 'Processing...' : 'Confirm & Create Shipment'}
                </button>
            </form>
        </div>
    );
}
