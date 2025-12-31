'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { Store, MapPin, AlignLeft, Loader2 } from 'lucide-react';

export default function BecomeSeller() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Fetch user profile to get ID
        fetch('http://localhost:3000/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.role === 'SELLER' || data.role === 'admin') {
                    router.push('/seller/dashboard'); // Already a seller
                }
                setUser(data);
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            // 1. Create Store via GraphQL
            const query = `
                mutation CreateStore($input: CreateStoreInput!) {
                    createStore(input: $input) {
                        id
                        name
                    }
                }
            `;

            const storeRes = await fetch('http://localhost:3000/graphql-store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query,
                    variables: {
                        input: {
                            name: formData.name,
                            description: formData.description,
                            address: formData.address,
                            ownerId: user.id,
                            services: [], // Start with empty services, add later in dashboard
                            images: []
                        }
                    }
                })
            });

            const storeData = await storeRes.json();
            if (storeData.errors) throw new Error(storeData.errors[0].message);

            // 2. Update User Role to SELLER
            const userRes = await fetch(`http://localhost:3000/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: 'SELLER' })
            });

            if (!userRes.ok) throw new Error('Failed to update user role');

            // Success! Redirect to dashboard
            router.push('/seller/dashboard');
            router.refresh();

        } catch (error) {
            console.error(error);
            alert('Failed to register store. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Become a Laundry Seller</h1>
                        <p className="text-gray-500 mt-2">Start your laundry business journey with Smart Laundry</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Store className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                                    placeholder="e.g. Berkah Laundry"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <div className="relative">
                                <div className="absolute top-3 left-3 pointer-events-none">
                                    <AlignLeft className="h-5 w-5 text-gray-400" />
                                </div>
                                <textarea
                                    required
                                    rows={4}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                                    placeholder="Tell us about your services..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-[#FF385C] focus:border-[#FF385C]"
                                    placeholder="Full address of your laundry store"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#FF385C] hover:bg-[#E31C5F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF385C] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Creating Store...
                                </>
                            ) : (
                                'Register Store'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
