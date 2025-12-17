'use client';

import Navbar from '../../components/Navbar';
import { User, Package, Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch User Profile
                const profileRes = await fetch('http://localhost:3000/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (profileRes.ok) {
                    const userData = await profileRes.json();
                    setUser(userData);
                }

                // Fetch User Orders
                const ordersQuery = `
          query MyOrders {
            myOrders {
              id
              storeName
              serviceType
              weight
              price
              status
              createdAt
            }
          }
        `;

                const ordersRes = await fetch('http://localhost:3000/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ query: ordersQuery })
                });

                const { data, errors } = await ordersRes.json();
                if (data && data.myOrders) {
                    setOrders(data.myOrders);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User Info Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-[#FF385C] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                                    {user?.name?.[0]?.toUpperCase()}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

                                <div className="w-full border-t border-gray-100 pt-4">
                                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                                        <User size={16} />
                                        <span className="text-sm">Member since {new Date(user?.createdAt).getFullYear()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking History */}
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking History</h2>
                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                                    No bookings yet.
                                </div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{order.storeName}</h3>
                                                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                                    <Package size={14} /> {order.serviceType} · {order.weight} kg
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'READY' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <Clock size={12} />
                                                {new Date(parseInt(order.createdAt)).toLocaleDateString()}
                                            </div>
                                            <span className="font-bold text-gray-900">Rp {order.price?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
