import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Modal, Form, Input, Select, DatePicker, message, Timeline, Spin } from 'antd';
import { 
  Search, 
  Filter, 
  Plus, 
  Map as MapIcon, 
  History as HistoryIcon, 
  Printer, 
  Edit3, 
  Trash2, 
  MapPin, 
  ArrowRight,
  FileText
} from 'lucide-react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CITY_COORDS = {
    'Chennai': [13.0827, 80.2707],
    'Bangalore': [12.9716, 77.5946],
    'Hyderabad': [17.3850, 78.4867],
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.6139, 77.2090],
    'Pune': [18.5204, 73.8567],
    'Kolkata': [22.5726, 88.3639],
    'Ahmedabad': [23.0225, 72.5714],
    'Jaipur': [26.9124, 75.7873],
};

const API = 'http://localhost:5000/api';

const TABLES = [
  { id: 'shipments', label: 'Shipments', icon: MapIcon },
  { id: 'tracking', label: 'Tracking', icon: HistoryIcon },
  { id: 'payments', label: 'Payments', icon: Printer }
];

export default function TableView() {
    const [table, setTable] = useState('shipments');
    const [data, setData] = useState([]);
    const [schema, setSchema] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const [showTimeline, setShowTimeline] = useState(false);
    const [timelineData, setTimelineData] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [mapData, setMapData] = useState(null);
    const [loadingMap, setLoadingMap] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [formData, setFormData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [customers, setCustomers] = useState([]);
    const [receivers, setReceivers] = useState([]);
   
    const [serviceTypes, setServiceTypes] = useState([]);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [isAddingReceiver, setIsAddingReceiver] = useState(false);
    const [newCustomerForm] = Form.useForm();
    const [newReceiverForm] = Form.useForm();

    const getStatusClass = (status) => {
        const s = status?.toLowerCase();
        if (s?.includes('delivered') || s?.includes('paid') || s?.includes('completed')) return 'status-delivered';
        if (s?.includes('transit')) return 'status-transit';
        if (s?.includes('pending')) return 'status-pending';
        if (s?.includes('cancelled') || s?.includes('failed') || s?.includes('overdue')) return 'status-cancelled';
        return '';
    };

    const fetchData = useCallback(() => {
        let url = `${API}/${table}`;
        const params = new URLSearchParams();
        if (table === 'shipments') {
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
        }
        if (table === 'tracking') {
            params.append('latest', 'true');
        }
        if (params.toString()) url += `?${params.toString()}`;
        
        axios.get(url).then(r => setData(r.data)).catch(err => console.error(err));
    }, [table, searchTerm, statusFilter]);

    useEffect(() => {
        fetchData();
        axios.get(`${API}/${table}/schema/columns`).then(r => setSchema(r.data)).catch(err => console.error(err));
        
        if (table === 'shipments') {
            axios.get(`${API}/customers`).then(r => setCustomers(r.data)).catch(err => console.error(err));
            axios.get(`${API}/receivers`).then(r => setReceivers(r.data)).catch(err => console.error(err));
            axios.get(`${API}/service_types`).then(r => setServiceTypes(r.data)).catch(err => console.error(err));
        }
    }, [table, statusFilter, fetchData]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddRecord = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/${table}`, formData);
            setShowModal(false);
            setFormData({});
            message.success('Record added successfully');
            fetchData();
        } catch (err) {
            message.error('Error adding record');
        }
    };

    const handleDeleteRecord = async (row) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const primaryKey = schema[0];
            const id = row[primaryKey];
            await axios.delete(`${API}/${table}/${id}`);
            message.success('Record deleted successfully');
            fetchData();
        } catch (err) {
            message.error(err.response?.data?.error || 'Error deleting record');
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            if (table === 'payments') {
                const record = data.find(r => r.PAYMENTID === id);
                await axios.put(`${API}/payments/${id}`, { ...record, PAYMENTSTATUS: newStatus });
            } else {
                await axios.patch(`${API}/shipments/${id}/status`, { status: newStatus });
            }
            message.success('Status updated');
            fetchData();
        } catch (err) {
            message.error('Error updating status');
        }
    };

    const handleSaveNewCustomer = async (values) => {
        try {
            const res = await axios.post(`${API}/customers`, { ...values, STATUS: 'Active' });
            message.success('Customer created successfully');
            setIsAddingCustomer(false);
            newCustomerForm.resetFields();
            
           
            const customersRes = await axios.get(`${API}/customers`);
            setCustomers(customersRes.data);
            setFormData(prev => ({ ...prev, CUSTOMERID: res.data.insertId }));
        } catch (err) {
            message.error('Failed to create customer');
        }
    };

    const handleSaveNewReceiver = async (values) => {
        try {
            const res = await axios.post(`${API}/receivers`, values);
            message.success('Receiver created successfully');
            setIsAddingReceiver(false);
            newReceiverForm.resetFields();
            
           
            const receiversRes = await axios.get(`${API}/receivers`);
            setReceivers(receiversRes.data);
            setFormData(prev => ({ ...prev, RECEIVERID: res.data.insertId }));
        } catch (err) {
            message.error('Failed to create receiver');
        }
    };

    const fetchTimeline = async (shipment) => {
        setSelectedShipment(shipment);
        setShowTimeline(true);
        setLoadingTimeline(true);
        try {
            const res = await axios.get(`${API}/shipments/${shipment.SHIPMENTID}/timeline`);
            setTimelineData(res.data);
        } catch (err) {
            message.error('Failed to load tracking data');
        } finally {
            setLoadingTimeline(false);
        }
    };

    const handleViewMap = async (shipment) => {
        setSelectedShipment(shipment);
        setShowMap(true);
        setLoadingMap(true);
        try {
            setMapData({
                sender_city: shipment.customer_city || 'Chennai',
                receiver_city: shipment.receiver_city || 'Bangalore',
                current_location: shipment.customer_city || 'Chennai'
            });
        } catch (err) {
            message.error('Failed to load map data');
        } finally {
            setLoadingMap(false);
        }
    };

    const handleEditClick = (record) => {
        setEditingRecord(record);
        let initialValues = { ...record };
        form.setFieldsValue(initialValues);
        setIsEditModalVisible(true);
    };

    const handleEditSubmit = async (values) => {
        try {
            const primaryKey = schema[0];
            const id = editingRecord[primaryKey];
            await axios.put(`${API}/${table}/${id}`, values);
            message.success('Updated successfully');
            setIsEditModalVisible(false);
            fetchData();
        } catch (err) {
            message.error('Failed to update record');
        }
    };

    let columns = schema.length > 0 ? schema : (data.length ? Object.keys(data[0]) : []);
    if (table === 'shipments') {
        columns = ['SHIPMENTID', 'ROUTE', 'CURRENTSTATUS', 'PRIORITY', 'TOTALCOST', 'BOOKINGDATE'];
    }

    const STATUS_OPTIONS = ['Booked', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled'];

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 }
    };

    return (
        <>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                       <h1 style={{ color: 'var(--text-main)', margin: '0 0 4px', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-1.5px' }}>
                          {table === 'shipments' ? 'Shipment Management' : table === 'customers' ? 'Customer Directory' : 'System Tracker'}
                       </h1>
                       <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Management dashboard for logistics</p>
                    </div>
                    {table === 'shipments' && (
                        <button onClick={() => { 
                          setFormData({ 
                            CURRENTSTATUS: 'Booked', 
                            PRIORITY: 'Normal', 
                            BOOKINGDATE: dayjs().format('YYYY-MM-DD'),
                            TOTALCOST: 0 
                          }); 
                          setShowModal(true); 
                        }} className="btn-primary">
                          <Plus size={20} />
                          Add New Record
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
                    {TABLES.map(t => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => { setTable(t.id); setSearchTerm(''); setStatusFilter(''); }}
                                style={{
                                    padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                    background: table === t.id ? 'var(--bg-card)' : 'transparent',
                                    color: table === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    fontWeight: '600', transition: 'all 0.2s', fontSize: '0.9rem',
                                    boxShadow: table === t.id ? 'var(--shadow-sm)' : 'none',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                <Icon size={16} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                {table === 'shipments' && (
                    <div className="glass" style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center', padding: '16px', borderRadius: '20px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by ID or Sender..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                                style={{ 
                                    width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px', 
                                    background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)',
                                    fontSize: '0.9rem', outline: 'none'
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
                            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                            <Select 
                                placeholder="Status Filter"
                                value={statusFilter || undefined}
                                onChange={(val) => setStatusFilter(val)}
                                allowClear
                                style={{ width: '100%' }}
                            >
                                {STATUS_OPTIONS.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                            </Select>
                        </div>

                        <button className="btn-primary" onClick={fetchData} style={{ padding: '10px 24px' }}>Search</button>
                    </div>
                )}

                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-body)' }}>
                                {columns.map((c) => (
                                    <th key={c} style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                        {c.replace('_', ' ')}
                                    </th>
                                ))}
                                <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <motion.tr key={i} variants={itemVariants} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    {columns.map((c, idx) => (
                                        <td key={c} style={{ padding: '16px 24px', fontSize: '0.9rem' }}>
                                            {c === 'SHIPMENTID' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                                                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>#{row[c]}</span>
                                                </div>
                                            ) : c === 'ROUTE' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.customer_name || "Unknown"}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><MapPin size={10} style={{ marginRight: '4px' }}/>{row.customer_city || "—"}</div>
                                                    </div>
                                                    <ArrowRight size={14} className="text-muted" strokeWidth={3} />
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{row.receiver_name || "Unknown"}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><MapPin size={10} style={{ marginRight: '4px' }}/>{row.receiver_city || "—"}</div>
                                                    </div>
                                                </div>
                                            ) : (c === 'CURRENTSTATUS' || c === 'PAYMENTSTATUS') ? (
                                                <select
                                                    value={row[c] || (c === 'PAYMENTSTATUS' ? 'Pending' : 'Booked')}
                                                    onChange={(e) => handleStatusUpdate(row.SHIPMENTID || row.PAYMENTID, e.target.value)}
                                                    className={`status-badge ${getStatusClass(row[c])}`}
                                                    style={{ appearance: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}
                                                >
                                                    {(c === 'PAYMENTSTATUS' ? ['Pending', 'Paid', 'Completed', 'Failed', 'Overdue'] : STATUS_OPTIONS).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : (c === 'TOTALCOST' || c === 'AMOUNT') ? (
                                                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>₹{parseFloat(row[c] || 0).toFixed(2)}</span>
                                            ) : (c === 'BOOKINGDATE' || c === 'PAYMENTDATE') ? (
                                                <span style={{ color: 'var(--text-muted)' }}>{dayjs(row[c]).format('MMM DD, YYYY')}</span>
                                            ) : String(row[c] ?? '—')}
                                        </td>
                                    ))}
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button title="View Tracking Timeline" onClick={() => fetchTimeline(row)} className="btn-icon-sml"><HistoryIcon size={16} /></button>
                                            <button title="View Route Map" onClick={() => handleViewMap(row)} className="btn-icon-sml"><MapIcon size={16} /></button>
                                            <button title="View Invoice" onClick={() => { setSelectedShipment(row); setShowInvoice(true); }} className="btn-icon-sml"><FileText size={16} /></button>
                                            <button title="Edit Record" onClick={() => handleEditClick(row)} className="btn-icon-sml"><Edit3 size={16} /></button>
                                            <button title="Delete Record" onClick={() => handleDeleteRecord(row)} className="btn-icon-sml danger"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <style>{`
                  .table-row-hover:hover { background: rgba(0,0,0,0.02); }
                  .btn-icon-sml { 
                    width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-color);
                    background: white; color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
                  }
                  .btn-icon-sml:hover { background: var(--accent-primary); color: white; border-color: var(--accent-primary); }
                  .btn-icon-sml.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
                `}</style>

                {}
                {showModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '500px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: '24px' }}>Add {table.replace('_', ' ')}</h2>
                            <form onSubmit={handleAddRecord}>
                               {table === 'shipments' ? (
                                   <>
                                       <div style={{ marginBottom: '16px' }}>
                                           <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sender (Customer)</label>
                                           <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '8px', fontStyle: 'italic' }}>Select existing or create new</p>
                                           <Select 
                                               showSearch 
                                               placeholder="Search for a sender..." 
                                               optionFilterProp="children"
                                               value={formData.CUSTOMERID}
                                               onChange={(val) => setFormData({ ...formData, CUSTOMERID: val })}
                                               style={{ width: '100%' }}
                                               filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                               options={customers.map(c => ({ value: c.CUSTOMERID, label: `${c.NAME} (${c.CITY || 'N/A'})` }))}
                                               dropdownRender={(menu) => (
                                                   <>
                                                       {menu}
                                                       <div style={{ borderTop: '1px solid var(--border-color)', padding: '8px', textAlign: 'center' }}>
                                                           <button type="button" onClick={() => setIsAddingCustomer(true)} className="btn-primary" style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}>
                                                               <Plus size={14} style={{ marginRight: '4px' }} /> Add New Customer
                                                           </button>
                                                       </div>
                                                   </>
                                               )}
                                           />
                                       </div>
                                       <div style={{ marginBottom: '16px' }}>
                                           <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receiver</label>
                                           <p style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginBottom: '8px', fontStyle: 'italic' }}>Select existing or create new</p>
                                           <Select 
                                               showSearch 
                                               placeholder="Search for a receiver..." 
                                               optionFilterProp="children"
                                               value={formData.RECEIVERID}
                                               onChange={(val) => setFormData({ ...formData, RECEIVERID: val })}
                                               style={{ width: '100%' }}
                                               filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                               options={receivers.map(r => ({ value: r.RECEIVERID, label: `${r.NAME} (${r.CITY || r.PINCODE || 'N/A'})` }))}
                                               dropdownRender={(menu) => (
                                                   <>
                                                       {menu}
                                                       <div style={{ borderTop: '1px solid var(--border-color)', padding: '8px', textAlign: 'center' }}>
                                                           <button type="button" onClick={() => setIsAddingReceiver(true)} className="btn-primary" style={{ width: '100%', padding: '4px', fontSize: '0.8rem' }}>
                                                               <Plus size={14} style={{ marginRight: '4px' }} /> Add New Receiver
                                                           </button>
                                                       </div>
                                                   </>
                                               )}
                                           />
                                       </div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                           <div style={{ marginBottom: '16px' }}>
                                               <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</label>
                                               <Select 
                                                   defaultValue="Booked"
                                                   onChange={(val) => setFormData({ ...formData, CURRENTSTATUS: val })}
                                                   style={{ width: '100%' }}
                                                   options={STATUS_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                                               />
                                           </div>
                                           <div style={{ marginBottom: '16px' }}>
                                               <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority</label>
                                               <Select 
                                                   defaultValue="Normal"
                                                   onChange={(val) => setFormData({ ...formData, PRIORITY: val })}
                                                   style={{ width: '100%' }}
                                                   options={['Low', 'Normal', 'High', 'Urgent'].map(opt => ({ value: opt, label: opt }))}
                                               />
                                           </div>
                                       </div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                           <div style={{ marginBottom: '16px' }}>
                                               <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Cost (₹)</label>
                                               <input type="number" step="0.01" name="TOTALCOST" onChange={handleInputChange} className="input-modern" style={{ width: '100%' }} />
                                           </div>
                                           <div style={{ marginBottom: '16px' }}>
                                               <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Booking Date</label>
                                               <DatePicker 
                                                   style={{ width: '100%' }} 
                                                   onChange={(date) => setFormData({ ...formData, BOOKINGDATE: date ? date.format('YYYY-MM-DD') : null })}
                                               />
                                           </div>
                                       </div>
                                   </>
                               ) : (
                                   columns.map((c, idx) => (
                                       idx === 0 ? null : (
                                       <div key={c} style={{ marginBottom: '16px' }}>
                                           <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.replace('_', ' ')}</label>
                                           <input type="text" name={c} onChange={handleInputChange} className="input-modern" style={{ width: '100%' }} />
                                       </div>
                                       )
                                   ))
                               )}
                               <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                   <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                   <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px 24px' }}>Save Record</button>
                               </div>
                            </form>
                        </div>
                    </div>
                )}

                <Modal title="Shipment Journey" open={showTimeline} onCancel={() => setShowTimeline(false)} footer={null} centered>
                    {loadingTimeline ? <Spin /> : (
                      timelineData.length > 0 ? (
                        <Timeline mode="left" style={{ marginTop: '20px' }}>
                            {timelineData.map((item, idx) => (
                                <Timeline.Item 
                                  key={idx} 
                                  color={item.status === 'Cancelled' ? 'red' : item.status === 'Delayed' ? 'orange' : 'green'}
                                >
                                    <div style={{ fontWeight: '700', color: item.status === 'Cancelled' ? '#ef4444' : item.status === 'Delayed' ? '#f59e0b' : 'inherit' }}>
                                      {item.status}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.location} • {dayjs(item.timestamp).format('MMM DD, HH:mm')}</div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                            No tracking updates available for this shipment yet.
                        </div>
                      )
                    )}
                </Modal>

                <Modal title="Interactive Route Map" open={showMap} onCancel={() => setShowMap(false)} footer={null} width={800}>
                    <div style={{ height: '450px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '16px' }}>
                        {mapData && (
                            <MapContainer center={CITY_COORDS[mapData.sender_city] || [20, 78]} zoom={5} style={{ height: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={CITY_COORDS[mapData.sender_city] || [0,0]}><Popup>Sender Origin</Popup></Marker>
                                <Marker position={CITY_COORDS[mapData.receiver_city] || [0,0]}><Popup>Receiver Destination</Popup></Marker>
                                <Polyline positions={[CITY_COORDS[mapData.sender_city] || [0,0], CITY_COORDS[mapData.receiver_city] || [0,0]]} color="var(--accent-primary)" weight={3} dashArray="5, 10" />
                            </MapContainer>
                        )}
                    </div>
                </Modal>

                {showInvoice && selectedShipment && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '600px', padding: '40px', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
                                <h1 style={{ color: 'var(--accent-primary)', margin: 0 }}>INVOICE</h1>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>ReptiTrack Logistics</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{selectedShipment.SHIPMENTID}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '30px' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>SENDER</label>
                                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedShipment.customer_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedShipment.customer_city}</div>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>RECEIVER</label>
                                    <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{selectedShipment.receiver_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedShipment.receiver_city}</div>
                                </div>
                            </div>
                            <div style={{ borderTop: '2px solid var(--accent-primary)', paddingTop: '20px', textAlign: 'right' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>Total: ₹{selectedShipment.TOTALCOST}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                                <button onClick={() => window.print()} className="btn-primary" style={{ flex: 1 }}>Print PDF</button>
                                <button onClick={() => setShowInvoice(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                <Modal title="Edit Record" open={isEditModalVisible} onCancel={() => setIsEditModalVisible(false)} onOk={() => form.submit()} okText="Save Changes">
                    <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
                        {table === 'payments' ? (
                            <>
                                <Form.Item name="PAYMENTSTATUS" label="Payment Status">
                                    <Select>
                                        {['Pending', 'Paid', 'Completed', 'Failed', 'Overdue'].map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item name="PAYMENTMETHOD" label="Payment Method">
                                    <Select>
                                        {['UPI', 'Card', 'Cash', 'Not Set'].map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item name="TRANSACTIONID" label="Transaction ID">
                                    <Input placeholder="e.g. TXN12345678" />
                                </Form.Item>
                                <Form.Item name="SHIPMENTID" label="Shipment ID" hidden><Input /></Form.Item>
                            </>
                        ) : (
                            <>
                                <Form.Item name="CURRENTSTATUS" label="Status"><Select>{STATUS_OPTIONS.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}</Select></Form.Item>
                                <Form.Item name="PRIORITY" label="Priority"><Select>{['Low', 'Normal', 'High', 'Urgent'].map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}</Select></Form.Item>
                                <Form.Item name="TOTALCOST" label="Total Cost"><Input type="number" step="0.01" prefix="₹" /></Form.Item>
                            </>
                        )}
                    </Form>
                </Modal>
            </motion.div>

            <Modal title="Add New Customer" open={isAddingCustomer} onCancel={() => setIsAddingCustomer(false)} onOk={() => newCustomerForm.submit()} okText="Create Customer" centered>
                <Form form={newCustomerForm} layout="vertical" onFinish={handleSaveNewCustomer}>
                    <Form.Item name="NAME" label="Full Name" rules={[{ required: true }]}><Input placeholder="e.g. Rahul Sharma" /></Form.Item>
                    <Form.Item name="EMAIL" label="Email" rules={[{ required: true, type: 'email' }]}><Input placeholder="rahul@example.com" /></Form.Item>
                    <Form.Item name="STREET" label="Street Address" rules={[{ required: true }]}><Input placeholder="123 Park Avenue" /></Form.Item>
                    <Form.Item name="PINCODE" label="Pincode" rules={[{ required: true }]}><Input placeholder="e.g. 600001" /></Form.Item>
                </Form>
            </Modal>

            <Modal title="Add New Receiver" open={isAddingReceiver} onCancel={() => setIsAddingReceiver(false)} onOk={() => newReceiverForm.submit()} okText="Create Receiver" centered>
                <Form form={newReceiverForm} layout="vertical" onFinish={handleSaveNewReceiver}>
                    <Form.Item name="NAME" label="Full Name" rules={[{ required: true }]}><Input placeholder="e.g. Amit Kumar" /></Form.Item>
                    <Form.Item name="EMAIL" label="Email" rules={[{ required: true, type: 'email' }]}><Input placeholder="amit@example.com" /></Form.Item>
                    <Form.Item name="STREET" label="Street Address" rules={[{ required: true }]}><Input placeholder="456 Hill Top" /></Form.Item>
                    <Form.Item name="PINCODE" label="Pincode" rules={[{ required: true }]}><Input placeholder="e.g. 560001" /></Form.Item>
                </Form>
            </Modal>
        </>
    );
}