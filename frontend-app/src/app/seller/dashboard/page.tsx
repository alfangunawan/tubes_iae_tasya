'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { useRouter } from 'next/navigation';
import {
    Store as StoreIcon, Package, TrendingUp, Plus, RefreshCw,
    Edit2, Trash2, X, Save, Calendar, User, DollarSign, Clock,
    Play, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '../../../utils/dateUtils';

interface Service {
    type: string;
    price: number;
    label: string;
}

interface Store {
    id: string;
    name: string;
    description: string;
    address: string;
    rating: number;
    reviewCount: number;
    services: Service[];
}

interface Booking {
    id: string;
    userName: string;
    serviceLabel: string;
    weight: number;
    totalPrice: number;
    status: string;
    checkInDate: string;
    createdAt: string;
    storeName?: string;
}

interface Payment {
    id: string;
    invoiceNumber: string;
    userName: string;
    storeName: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paidAt: string;
}

interface DashboardData {
    stores: Store[];
    activeOrders: number;
    totalRevenue: number;
    recentBookings: Booking[];
    allBookings?: Booking[];
    payments?: Payment[];
}

type ActiveTab = 'stores' | 'orders' | 'payments';

export default function SellerDashboard() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('stores');

    // Modal states
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [editingStore, setEditingStore] = useState<Store | null>(null);
    const [storeForm, setStoreForm] = useState({
        name: '',
        description: '',
        address: '',
        services: [{ type: 'washing', price: 7000, label: 'Washing' }]
    });

    // Extra data for tabs
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const userRes = await fetch('http://localhost:3000/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userRes.json();

            if (userData.role !== 'SELLER' && userData.role !== 'admin') {
                router.push('/become-seller');
                return;
            }
            setUser(userData);

            const dashboardRes = await fetch('http://localhost:3000/api/seller/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard data');

            const data = await dashboardRes.json();
            setDashboardData(data);
            setAllBookings(data.recentBookings || []);

        } catch (err: any) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingsAndPayments = async () => {
        const token = localStorage.getItem('token');
        if (!token || !dashboardData?.stores.length) return;

        const storeIds = dashboardData.stores.map(s => s.id);

        // Fetch all bookings for stores
        try {
            const bookingsPromises = storeIds.map(async (storeId) => {
                const res = await fetch('http://localhost:3000/graphql-booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        query: `query { storeBookings(storeId: "${storeId}") { id userName serviceLabel weight totalPrice status checkInDate createdAt } }`
                    })
                });
                const data = await res.json();
                const storeName = dashboardData.stores.find(s => s.id === storeId)?.name;
                return (data.data?.storeBookings || []).map((b: Booking) => ({ ...b, storeName }));
            });
            const results = await Promise.all(bookingsPromises);
            setAllBookings(results.flat());
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
        }

        // Fetch payments
        try {
            const res = await fetch('http://localhost:3000/graphql-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    query: `query { paymentsByStores(storeIds: ${JSON.stringify(storeIds)}) { id invoiceNumber userName storeName amount status paymentMethod paidAt } }`
                })
            });
            const data = await res.json();
            setPayments(data.data?.paymentsByStores || []);
        } catch (err) {
            console.error('Failed to fetch payments:', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [router]);

    useEffect(() => {
        if (dashboardData && (activeTab === 'orders' || activeTab === 'payments')) {
            fetchBookingsAndPayments();
        }
    }, [activeTab, dashboardData]);

    const handleCreateStore = async () => {
        const token = localStorage.getItem('token');
        if (!token || !user) return;

        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    query: `mutation CreateStore($input: CreateStoreInput!) { createStore(input: $input) { id name } }`,
                    variables: {
                        input: {
                            ...storeForm,
                            ownerId: user.id,
                            images: []
                        }
                    }
                })
            });
            const data = await res.json();
            if (data.errors) throw new Error(data.errors[0].message);

            toast.success('Store created successfully!');
            setShowStoreModal(false);
            resetForm();
            fetchDashboardData();
        } catch (err: any) {
            toast.error('Failed to create store: ' + err.message);
        }
    };

    const handleUpdateStore = async () => {
        const token = localStorage.getItem('token');
        if (!token || !editingStore) return;

        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    query: `mutation UpdateStore($id: ID!, $input: UpdateStoreInput!) { updateStore(id: $id, input: $input) { id name } }`,
                    variables: {
                        id: editingStore.id,
                        input: {
                            name: storeForm.name,
                            description: storeForm.description,
                            address: storeForm.address,
                            services: storeForm.services
                        }
                    }
                })
            });
            const data = await res.json();
            if (data.errors) throw new Error(data.errors[0].message);

            toast.success('Store updated successfully!');
            setShowStoreModal(false);
            setEditingStore(null);
            resetForm();
            fetchDashboardData();
        } catch (err: any) {
            toast.error('Failed to update store: ' + err.message);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        if (!confirm('Are you sure you want to delete this store?')) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    query: `mutation DeleteStore($id: ID!) { deleteStore(id: $id) }`,
                    variables: { id: storeId }
                })
            });
            const data = await res.json();
            if (data.errors) throw new Error(data.errors[0].message);

            toast.success('Store deleted successfully!');
            fetchDashboardData();
        } catch (err: any) {
            toast.error('Failed to delete store: ' + err.message);
        }
    };

    const openEditModal = (store: Store) => {
        setEditingStore(store);
        // Map existing services to match dropdown options
        const mappedServices = (store.services || []).map(s => {
            // Map legacy or different type names to standard dropdown values
            const typeMap: Record<string, string> = {
                'regular': 'washing',
                'Regular Wash': 'washing',
                'Washing': 'washing',
                'Dry Clean': 'dry_clean',
                'Ironing': 'ironing',
                'Shoes': 'shoes',
                'Carpets': 'carpets',
                'Express': 'express'
            };
            const mappedType = typeMap[s.type] || typeMap[s.label] || s.type;
            return { ...s, type: mappedType };
        });
        setStoreForm({
            name: store.name,
            description: store.description,
            address: store.address,
            services: mappedServices.length > 0 ? mappedServices : [{ type: 'washing', price: 7000, label: 'Washing' }]
        });
        setShowStoreModal(true);
    };

    const resetForm = () => {
        setStoreForm({
            name: '',
            description: '',
            address: '',
            services: [{ type: 'washing', price: 7000, label: 'Washing' }]
        });
        setEditingStore(null);
    };

    // Handle order status update
    const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    query: `mutation UpdateBookingStatus($input: UpdateBookingStatusInput!) {
                        updateBookingStatus(input: $input) { id status }
                    }`,
                    variables: { input: { id: bookingId, status: newStatus } }
                })
            });
            const data = await res.json();
            if (data.errors) throw new Error(data.errors[0].message);

            toast.success(`Order status updated to ${newStatus}`);
            // Refresh bookings
            fetchBookingsAndPayments();
        } catch (err: any) {
            toast.error('Failed to update status: ' + err.message);
        }
    };

    const formatCurrency = (amount: number) => {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'CONFIRMED': 'bg-blue-100 text-blue-800',
            'PROCESSING': 'bg-purple-100 text-purple-800',
            'COMPLETED': 'bg-gray-100 text-gray-800',
            'CANCELLED': 'bg-red-100 text-red-800',
            'PAID': 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={20} />
                    <span>Loading Dashboard...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button onClick={fetchDashboardData} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {user?.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchDashboardData} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                            <RefreshCw size={16} /> Refresh
                        </button>
                        <button onClick={() => { resetForm(); setShowStoreModal(true); }} className="bg-[#FF385C] hover:bg-[#E31C5F] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                            <Plus size={16} /> Add New Store
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Clickable */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div
                        onClick={() => setActiveTab('stores')}
                        className={`bg-white p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'stores' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${activeTab === 'stores' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                <StoreIcon size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Stores</div>
                                <div className="text-2xl font-bold text-gray-900">{dashboardData?.stores.length || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => setActiveTab('orders')}
                        className={`bg-white p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'orders' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${activeTab === 'orders' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'}`}>
                                <Package size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Active Orders</div>
                                <div className="text-2xl font-bold text-gray-900">{dashboardData?.activeOrders || 0}</div>
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => setActiveTab('payments')}
                        className={`bg-white p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all hover:shadow-md ${activeTab === 'payments' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${activeTab === 'payments' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-600'}`}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Revenue</div>
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.totalRevenue || 0)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section based on Active Tab */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Stores Tab */}
                    {activeTab === 'stores' && (
                        <>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-900">Your Stores</h2>
                                <span className="text-sm text-gray-500">{dashboardData?.stores.length || 0} stores</span>
                            </div>
                            {!dashboardData?.stores.length ? (
                                <div className="p-8 text-center text-gray-500">
                                    No stores found. Create your first store to get started!
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {dashboardData.stores.map((store) => (
                                        <div key={store.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{store.name}</h3>
                                                <p className="text-sm text-gray-500">{store.address}</p>
                                                <p className="text-xs text-gray-400 mt-1">{store.description}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right mr-4">
                                                    <div className="text-sm font-medium text-gray-900">Rating: {store.rating || 0}</div>
                                                    <div className="text-xs text-gray-500">{store.reviewCount || 0} reviews</div>
                                                </div>
                                                <button onClick={() => openEditModal(store)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteStore(store.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        <>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-900">All Orders</h2>
                                <span className="text-sm text-gray-500">{allBookings.length} orders</span>
                            </div>
                            {!allBookings.length ? (
                                <div className="p-8 text-center text-gray-500">
                                    No orders yet. Orders will appear here when customers book your services.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {allBookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <User size={16} className="text-gray-400" />
                                                            {booking.userName}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{booking.storeName || '-'}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{booking.serviceLabel || '-'}</td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">{booking.weight} kg</td>
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(booking.totalPrice)}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={14} />
                                                            {formatDate(booking.checkInDate)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' ? (
                                                            <select
                                                                value={booking.status}
                                                                onChange={(e) => handleUpdateStatus(booking.id, e.target.value)}
                                                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#FF385C] focus:border-transparent cursor-pointer"
                                                            >
                                                                <option value="PENDING" disabled={booking.status !== 'PENDING'}>Pending</option>
                                                                <option value="CONFIRMED" disabled={booking.status !== 'PENDING' && booking.status !== 'CONFIRMED'}>Confirmed</option>
                                                                <option value="PROCESSING" disabled={booking.status === 'COMPLETED'}>Processing</option>
                                                                <option value="COMPLETED">Completed</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {booking.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <>
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-900">Payment History</h2>
                                <span className="text-sm text-gray-500">{payments.length} payments • {formatCurrency(dashboardData?.totalRevenue || 0)} total</span>
                            </div>
                            {!payments.length ? (
                                <div className="p-8 text-center text-gray-500">
                                    No payments yet. Payments will appear here when orders are paid.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payments.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{payment.invoiceNumber}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{payment.userName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{payment.storeName}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-green-600 flex items-center gap-1">
                                                        <DollarSign size={14} />
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{payment.paymentMethod?.replace('_', ' ')}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {formatDate(payment.paidAt)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Store Modal */}
            {showStoreModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-lg">{editingStore ? 'Edit Store' : 'Create New Store'}</h3>
                            <button onClick={() => { setShowStoreModal(false); setEditingStore(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                <input
                                    type="text"
                                    value={storeForm.name}
                                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                                    placeholder="My Laundry Store"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={storeForm.description}
                                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                                    rows={3}
                                    placeholder="Describe your laundry service..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={storeForm.address}
                                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                                    placeholder="Jl. Example No. 123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
                                {storeForm.services.map((service, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <select
                                            value={service.type}
                                            onChange={(e) => {
                                                const newServices = [...storeForm.services];
                                                const selectedType = e.target.value;
                                                const labels: Record<string, string> = {
                                                    'washing': 'Washing',
                                                    'dry_clean': 'Dry Clean',
                                                    'ironing': 'Ironing',
                                                    'shoes': 'Shoes',
                                                    'carpets': 'Carpets',
                                                    'express': 'Express'
                                                };
                                                newServices[idx].type = selectedType;
                                                newServices[idx].label = labels[selectedType] || selectedType;
                                                setStoreForm({ ...storeForm, services: newServices });
                                            }}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                                        >
                                            <option value="">Select Service</option>
                                            <option value="washing">Washing</option>
                                            <option value="dry_clean">Dry Clean</option>
                                            <option value="ironing">Ironing</option>
                                            <option value="shoes">Shoes</option>
                                            <option value="carpets">Carpets</option>
                                            <option value="express">Express</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={service.price}
                                            onChange={(e) => {
                                                const newServices = [...storeForm.services];
                                                newServices[idx].price = Number(e.target.value);
                                                setStoreForm({ ...storeForm, services: newServices });
                                            }}
                                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF385C] focus:border-transparent"
                                            placeholder="Price (Rp)"
                                            min="0"
                                        />
                                        {storeForm.services.length > 1 && (
                                            <button
                                                onClick={() => {
                                                    const newServices = storeForm.services.filter((_, i) => i !== idx);
                                                    setStoreForm({ ...storeForm, services: newServices });
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => setStoreForm({ ...storeForm, services: [...storeForm.services, { type: '', price: 0, label: '' }] })}
                                    className="text-sm text-[#FF385C] hover:underline"
                                >
                                    + Add Service
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                            <button onClick={() => { setShowStoreModal(false); setEditingStore(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                                Cancel
                            </button>
                            <button
                                onClick={editingStore ? handleUpdateStore : handleCreateStore}
                                className="px-4 py-2 bg-[#FF385C] hover:bg-[#E31C5F] text-white rounded-lg transition flex items-center gap-2"
                            >
                                <Save size={16} />
                                {editingStore ? 'Save Changes' : 'Create Store'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
