import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Popconfirm, Tag, message } from 'antd';
import { UserOutlined, CrownOutlined, DeleteOutlined, ArrowUpOutlined } from '@ant-design/icons';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/users`);
            setUsers(res.data);
        } catch (err) {
            console.error('[Fetch Users Error]', err);
            message.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handlePromote = async (id) => {
        try {
            await axios.put(`${API}/users/${id}/promote`);
            message.success('User promoted to admin successfully');
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('[Promote Error]', err);
            message.error(err.response?.data?.error || 'Failed to promote user');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API}/users/${id}`);
            message.success('User deleted successfully');
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error('[Delete Error]', err);
            message.error(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (text) => <strong>#{text}</strong>,
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            render: (text) => (
                <span style={{ fontWeight: 600 }}>
                    <UserOutlined style={{ marginRight: 8, color: 'var(--text-muted)' }} />
                    {text}
                </span>
            ),
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                const isAdmin = role === 'admin';
                return (
                    <Tag 
                        color={isAdmin ? 'purple' : 'blue'} 
                        icon={isAdmin ? <CrownOutlined /> : <UserOutlined />}
                        style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}
                    >
                        {role.toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {record.role === 'user' && (
                        <Popconfirm
                            title="Promote to Admin?"
                            description="This user will get full access to the system."
                            onConfirm={() => handlePromote(record.id)}
                            okText="Yes, Promote"
                            cancelText="Cancel"
                        >
                            <Button type="primary" size="small" icon={<ArrowUpOutlined />} style={{ background: '#10b981', borderColor: '#10b981' }}>
                                Promote
                            </Button>
                        </Popconfirm>
                    )}
                    <Popconfirm
                        title="Delete User?"
                        description="Are you sure you want to delete this user permanently?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="primary" danger size="small" icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ color: 'var(--text-main)', fontSize: '2.4rem', margin: '0 0 8px 0', fontWeight: '700', letterSpacing: '-1px' }}>
                    User <span style={{ color: 'var(--accent-primary)' }}>Management</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
                    View, promote, and manage all users in the system.
                </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <Table 
                    columns={columns} 
                    dataSource={users} 
                    rowKey="id" 
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    style={{ background: 'transparent' }}
                />
            </div>
        </div>
    );
}
