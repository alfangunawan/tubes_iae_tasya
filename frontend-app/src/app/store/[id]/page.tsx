'use client';

import Navbar from '@/components/Navbar';
import { Star, MapPin, Share, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Use basic fetch for simplicity (or can add Apollo Client)
async function fetchStore(id: string) {
    const query = `
    query GetStore($id: ID!) {
      store(id: $id) {
        id
        name
        description
        address
        rating
        reviewCount
        images
        ownerId
        services {
          type
          price
          label
        }
        createdAt
      }
    }
  `;

    // Use the API Gateway /graphql-store endpoint
    // Need to handle auth token if required, but store details likely public
    // Assuming frontend is running where API Gateway is at localhost:3000
    // Browser will fetch relative if proxy set up, or absolute

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('http://localhost:3000/graphql-store', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            query,
            variables: { id }
        })
    });

    const { data, errors } = await res.json();
    if (errors) throw new Error(errors[0].message);
    return data.store;
}

export default function StoreDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [date, setDate] = useState('');
    const [weight, setWeight] = useState(1);
    const [selectedService, setSelectedService] = useState<any>(null);

    useEffect(() => {
        fetchStore(id)
            .then(data => {
                setStore(data);
                if (data.services && data.services.length > 0) {
                    setSelectedService(data.services[0]);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    const handleBooking = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please login to book');
            router.push('/login');
            return;
        }

        if (!selectedService || !date) {
            toast.warning('Please select a date and service');
            return;
        }

        // Decode token to get user info
        let userInfo;
        try {
            userInfo = JSON.parse(atob(token.split('.')[1]));
        } catch (err) {
            toast.error('Invalid session. Please login again.');
            router.push('/login');
            return;
        }

        const mutation = `
            mutation CreateBooking($input: CreateBookingInput!) {
                createBooking(input: $input) {
                    id
                    status
                    totalPrice
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
                    query: mutation,
                    variables: {
                        input: {
                            userId: userInfo.id,
                            userName: userInfo.name,
                            userEmail: userInfo.email,
                            storeId: store.id,
                            storeName: store.name,
                            serviceType: selectedService.type,
                            serviceLabel: selectedService.label,
                            weight: weight,
                            pricePerKg: selectedService.price,
                            checkInDate: date,
                            notes: ''
                        }
                    }
                })
            });

            const { data, errors } = await res.json();

            if (errors) {
                throw new Error(errors[0].message);
            }

            toast.success('Booking created! Redirecting to payment...');
            // Redirect to payment page with booking ID
            router.push(`/payment/${data.createBooking.id}`);

        } catch (err: any) {
            toast.error('Booking failed: ' + err.message);
        }
    };

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen bg-white flex items-center justify-center text-red-500">Error: {error}</div>;
    if (!store) return <div className="min-h-screen bg-white flex items-center justify-center">Store not found</div>;

    const totalPrice = selectedService ? selectedService.price * weight : 0;

    // Use placeholders if no images
    const images = store.images && store.images.length > 0 ? store.images : ['bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600'];
    // Handle if images are just color classes or URLs
    const isUrl = (str: string) => str.startsWith('http');

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h1>
                    <div className="flex justify-between items-center text-sm text-gray-800 font-medium">
                        <div className="flex items-center gap-2">
                            <Star size={14} fill="black" />
                            <span>{store.rating || 'New'}</span>
                            <span className="mx-1">·</span>
                            <span className="underline cursor-pointer">{store.reviewCount || 0} reviews</span>
                            <span className="mx-1">·</span>
                            <span className="flex items-center gap-1 text-gray-500">
                                <MapPin size={14} /> {store.address}
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <button className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded-md underline decoration-1">
                                <Share size={16} /> Share
                            </button>
                            <button className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded-md underline decoration-1">
                                <Heart size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-xl overflow-hidden mb-8">
                    {/* Main Image */}
                    <div className={`col-span-2 row-span-2 relative bg-gray-200 flex items-center justify-center overflow-hidden`}>
                        {store.images && store.images[0] && isUrl(store.images[0]) ?
                            <img src={store.images[0]} alt="Main" className="object-cover w-full h-full" /> :
                            <div className={`w-full h-full ${images[0]}`}></div>
                        }
                    </div>

                    {/* Side Images */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`col-span-1 row-span-1 relative bg-gray-200 overflow-hidden`}>
                            {store.images && store.images[i] && isUrl(store.images[i]) ?
                                <img src={store.images[i]} alt={`Image ${i}`} className="object-cover w-full h-full" /> :
                                <div className={`w-full h-full ${images[i] || 'bg-gray-200'}`}></div>
                            }
                        </div>
                    ))}
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Info */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-6 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Hosted by {store.ownerId}</h2>
                                <p className="text-gray-500">Joined in {store.createdAt ? new Date(parseInt(store.createdAt)).getFullYear() : '2023'}</p>
                            </div>
                            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold">
                                {store.ownerId ? store.ownerId[0].toUpperCase() : 'O'}
                            </div>
                        </div>

                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <p className="text-gray-600 leading-relaxed">{store.description}</p>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-4">Services Offered</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {store.services && store.services.map((service: any, idx: number) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">{service.type.replace('_', ' ')}</div>
                                            <div className="text-sm text-gray-500">{service.label}</div>
                                        </div>
                                        <div className="font-bold">Rp {service.price.toLocaleString()}/kg</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Booking Card */}
                    <div className="relative">
                        <div className="sticky top-32 border border-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.12)] rounded-xl p-6">
                            <div className="flex justify-between items-baseline mb-6">
                                <span className="text-2xl font-bold">Rp {selectedService?.price.toLocaleString() || 0}</span>
                                <span className="text-gray-500"> / kg</span>
                            </div>

                            <div className="border border-gray-400 rounded-lg mb-4">
                                <div className="p-3 border-b border-gray-400">
                                    <label className="block text-xs font-bold text-gray-800">CHECK-IN</label>
                                    <input type="date" className="w-full text-sm outline-none" onChange={(e) => setDate(e.target.value)} />
                                </div>
                                <div className="p-3">
                                    <label className="block text-xs font-bold text-gray-800">WEIGHT (Kg)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={weight}
                                        onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                                        className="w-full text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-800 mb-2">SERVICE TYPE</label>
                                <select
                                    className="w-full p-3 border border-gray-400 rounded-lg bg-white"
                                    onChange={(e) => {
                                        const s = store.services.find((s: any) => s.type === e.target.value);
                                        if (s) setSelectedService(s);
                                    }}
                                >
                                    {store.services && store.services.map((s: any) => (
                                        <option key={s.type} value={s.type}>{s.label || s.type} ({s.type})</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleBooking}
                                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-bold py-3.5 rounded-lg transition mb-4">
                                Book Order
                            </button>

                            <div className="flex justify-between mt-4 font-bold text-lg pt-4 border-t border-gray-200">
                                <span>Total</span>
                                <span>Rp {totalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
