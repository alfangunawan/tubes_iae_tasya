'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, Package, TrendingUp, Plus } from 'lucide-react';

export default function SellerDashboard() {
    const router = useRouter();
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch User
        fetch('http://localhost:3000/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(userData => {
                if (userData.role !== 'SELLER' && userData.role !== 'admin') {
                    router.push('/become-seller');
                    return;
                }
                setUser(userData);

                // Fetch My Stores
                const query = `
                query MyStores($ownerId: ID!) {
                    myStores(ownerId: $ownerId) {
                        id
                        name
                        address
                        rating
                        reviewCount
                    }
                }
            `;

                fetch('http://localhost:3000/graphql-store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        query,
                        variables: { ownerId: userData.id }
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        setStores(data.data.myStores);
                        setLoading(false);
                    });
            })
            .catch(() => router.push('/login'));
    }, [router]);

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
                        <p className="text-gray-500">Welcome back, {user?.name}</p>
                    </div>
                    <button className="bg-[#FF385C] hover:bg-[#E31C5F] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                        <Plus size={16} /> Add New Store
                    </button>
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
                                <div className="text-2xl font-bold text-gray-900">{stores.length}</div>
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
                                <div className="text-2xl font-bold text-gray-900">12</div>
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
                                <div className="text-2xl font-bold text-gray-900">Rp 2.5M</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stores List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Your Stores</h2>
                    </div>
                    {stores.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No stores found. Create your first store to get started!
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {stores.map((store) => (
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
