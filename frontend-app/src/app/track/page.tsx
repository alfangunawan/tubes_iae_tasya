'use client';

import Navbar from '@/components/Navbar';
import { Package, Clock, MapPin, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
    id: string;
    storeName: string;
    serviceType: string;
    serviceLabel: string;
    weight: number;
    totalPrice: number;
    checkInDate: string;
    status: string;
    createdAt: string;
    notes?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
    PENDING: { color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock, label: 'Pending' },
    CONFIRMED: { color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle, label: 'Confirmed' },
    PROCESSING: { color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Loader, label: 'Processing' },
    COMPLETED: { color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle, label: 'Completed' },
    CANCELLED: { color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle, label: 'Cancelled' }
};

export default function TrackOrderPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Decode token to get userId
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserId(payload.id);
            fetchBookings(payload.id, token);
        } catch (err) {
            console.error('Failed to decode token:', err);
            setError('Invalid session. Please login again.');
            setLoading(false);
        }
    }, [router]);

    const fetchBookings = async (userId: string, token: string) => {
        setLoading(true);
        setError('');

        const query = `
            query MyBookings($userId: String!) {
                myBookings(userId: $userId) {
                    id
                    storeName
                    serviceType
                    serviceLabel
                    weight
                    totalPrice
                    checkInDate
                    status
                    createdAt
                    notes
                }
            }
        `;

        try {
            const res = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query,
                    variables: { userId }
                })
            });

            const { data, errors } = await res.json();

            if (errors) {
                throw new Error(errors[0].message);
            }

            setBookings(data.myBookings || []);
        } catch (err: any) {
            console.error('Failed to fetch bookings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        const token = localStorage.getItem('token');
        if (token && userId) {
            fetchBookings(userId, token);
        }
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';

            return date.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="flex items-center justify-center py-20">
                        <Loader className="animate-spin text-[#FF385C]" size={40} />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Track Your Orders</h1>
                        <p className="text-gray-500 mt-1">Monitor the status of your laundry orders</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!error && bookings.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Package className="mx-auto text-gray-300 mb-4" size={64} />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
                        <p className="text-gray-500 mb-6">Start by booking a laundry service from one of our partners.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-[#FF385C] hover:bg-[#E31C5F] text-white font-bold px-6 py-3 rounded-lg transition"
                        >
                            Browse Services
                        </button>
                    </div>
                )}

                {/* Bookings List */}
                {bookings.length > 0 && (
                    <div className="space-y-4">
                        {bookings.map((booking) => {
                            const statusConfig = getStatusConfig(booking.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={booking.id}
                                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
                                >
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                        {/* Left: Order Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-[#FF385C] rounded-xl flex items-center justify-center text-white">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{booking.storeName}</h3>
                                                    <p className="text-gray-500 text-sm">
                                                        {booking.serviceLabel || booking.serviceType} · {booking.weight} kg
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                                                        <Clock size={14} />
                                                        <span>Check-in: {formatDate(booking.checkInDate)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Status & Price */}
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                <StatusIcon size={14} />
                                                {statusConfig.label}
                                            </span>
                                            <span className="text-xl font-bold text-gray-900">
                                                Rp {booking.totalPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            {['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED'].map((step, idx) => {
                                                const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED'];
                                                const currentIdx = steps.indexOf(booking.status);
                                                const isActive = idx <= currentIdx && booking.status !== 'CANCELLED';
                                                const isCancelled = booking.status === 'CANCELLED';

                                                return (
                                                    <div key={step} className="flex flex-col items-center flex-1">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCancelled ? 'bg-red-100 text-red-600' :
                                                            isActive ? 'bg-[#FF385C] text-white' : 'bg-gray-200 text-gray-400'
                                                            }`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className={`text-xs mt-1 text-center ${isActive && !isCancelled ? 'text-gray-700' : 'text-gray-400'}`}>
                                                            {step.charAt(0) + step.slice(1).toLowerCase()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Order ID & Date */}
                                    <div className="mt-4 flex justify-between text-xs text-gray-400">
                                        <span>Order ID: {booking.id.slice(0, 8)}...</span>
                                        <span>Created: {formatDate(booking.createdAt)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
