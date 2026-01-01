'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, Package, TrendingUp, Plus, RefreshCw } from 'lucide-react';

interface Store {
    id: string;
    name: string;
    address: string;
    rating: number;
    reviewCount: number;
}

interface DashboardData {
    stores: Store[];
    activeOrders: number;
    totalRevenue: number;
    recentBookings: any[];
}

export default function SellerDashboard() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch user profile first
            const userRes = await fetch('http://localhost:3000/api/users/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userRes.json();

            if (userData.role !== 'SELLER' && userData.role !== 'admin') {
                router.push('/become-seller');
                return;
            }
            setUser(userData);

            // Fetch aggregated dashboard data from single endpoint
            const dashboardRes = await fetch('http://localhost:3000/api/seller/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!dashboardRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await dashboardRes.json();
            setDashboardData(data);
        } catch (err: any) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [router]);

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `Rp ${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `Rp ${(amount / 1000).toFixed(0)}K`;
        }
        return `Rp ${amount.toLocaleString('id-ID')}`;
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
                        <button
                            onClick={fetchDashboardData}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
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
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {user?.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchDashboardData}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                        <button className="bg-[#FF385C] hover:bg-[#E31C5F] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                            <Plus size={16} /> Add New Store
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <StoreIcon size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Stores</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {dashboardData?.stores.length || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <Package size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Active Orders</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {dashboardData?.activeOrders || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Total Revenue</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(dashboardData?.totalRevenue || 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stores List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Your Stores</h2>
                    </div>
                    {!dashboardData?.stores.length ? (
                        <div className="p-8 text-center text-gray-500">
                            No stores found. Create your first store to get started!
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {dashboardData.stores.map((store) => (
                                <div key={store.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div>
                                        <h3 className="font-medium text-gray-900">{store.name}</h3>
                                        <p className="text-sm text-gray-500">{store.address}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">Rating: {store.rating}</div>
                                        <div className="text-xs text-gray-500">{store.reviewCount} reviews</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
