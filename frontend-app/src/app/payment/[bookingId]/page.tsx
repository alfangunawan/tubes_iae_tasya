'use client';

import Navbar from '@/components/Navbar';
import { CreditCard, Wallet, Building2, Banknote, CheckCircle, ArrowLeft, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';

interface BookingData {
    id: string;
    storeId: string;
    storeName: string;
    serviceType: string;
    serviceLabel: string;
    weight: number;
    pricePerKg: number;
    totalPrice: number;
    checkInDate: string;
    status: string;
}

interface PaymentData {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    paymentMethod: string;
}

const PAYMENT_METHODS = [
    { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: Building2, description: 'Transfer via BCA, Mandiri, BNI, BRI' },
    { id: 'E_WALLET', name: 'E-Wallet', icon: Wallet, description: 'GoPay, OVO, DANA, ShopeePay' },
    { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCard, description: 'Visa, Mastercard, JCB' },
    { id: 'CASH', name: 'Cash on Delivery', icon: Banknote, description: 'Pay when laundry is ready' },
];

export default function PaymentPage() {
    const router = useRouter();
    const params = useParams();
    const bookingId = params.bookingId as string;

    const [booking, setBooking] = useState<BookingData | null>(null);
    const [payment, setPayment] = useState<PaymentData | null>(null);
    const [selectedMethod, setSelectedMethod] = useState('BANK_TRANSFER');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchBookingAndPayment(bookingId, token);
    }, [bookingId, router]);

    const fetchBookingAndPayment = async (bookingId: string, token: string) => {
        setLoading(true);
        try {
            // Fetch booking details
            const bookingQuery = `
                query GetBooking($id: ID!) {
                    booking(id: $id) {
                        id
                        storeId
                        storeName
                        serviceType
                        serviceLabel
                        weight
                        pricePerKg
                        totalPrice
                        checkInDate
                        status
                    }
                }
            `;

            const bookingRes = await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: bookingQuery,
                    variables: { id: bookingId }
                })
            });

            const bookingData = await bookingRes.json();
            if (bookingData.errors) {
                throw new Error(bookingData.errors[0].message);
            }
            setBooking(bookingData.data.booking);

            // Check if payment already exists
            const paymentQuery = `
                query PaymentByBooking($bookingId: String!) {
                    paymentByBooking(bookingId: $bookingId) {
                        id
                        invoiceNumber
                        amount
                        status
                        paymentMethod
                    }
                }
            `;

            const paymentRes = await fetch('http://localhost:3000/graphql-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: paymentQuery,
                    variables: { bookingId }
                })
            });

            const paymentData = await paymentRes.json();
            if (!paymentData.errors && paymentData.data.paymentByBooking) {
                setPayment(paymentData.data.paymentByBooking);
                if (paymentData.data.paymentByBooking.status === 'PAID') {
                    toast.success('This booking has already been paid!');
                    router.push('/track');
                }
            }

        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        const token = localStorage.getItem('token');
        if (!token || !booking) return;

        setProcessing(true);
        try {
            // Decode user info
            const userInfo = JSON.parse(atob(token.split('.')[1]));

            // Step 1: Create payment if not exists
            let paymentId = payment?.id;

            if (!paymentId) {
                const createPaymentMutation = `
                    mutation CreatePayment($input: CreatePaymentInput!) {
                        createPayment(input: $input) {
                            id
                            invoiceNumber
                            amount
                            status
                        }
                    }
                `;

                const createRes = await fetch('http://localhost:3000/graphql-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        query: createPaymentMutation,
                        variables: {
                            input: {
                                bookingId: booking.id,
                                userId: userInfo.id,
                                userName: userInfo.name,
                                userEmail: userInfo.email,
                                storeId: booking.storeId,
                                storeName: booking.storeName,
                                serviceLabel: booking.serviceLabel,
                                weight: booking.weight,
                                amount: booking.totalPrice,
                                paymentMethod: selectedMethod
                            }
                        }
                    })
                });

                const createData = await createRes.json();
                if (createData.errors) {
                    throw new Error(createData.errors[0].message);
                }
                paymentId = createData.data.createPayment.id;
            }

            // Step 2: Process payment
            const processPaymentMutation = `
                mutation ProcessPayment($input: ProcessPaymentInput!) {
                    processPayment(input: $input) {
                        id
                        invoiceNumber
                        status
                        paidAt
                    }
                }
            `;

            const processRes = await fetch('http://localhost:3000/graphql-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: processPaymentMutation,
                    variables: {
                        input: {
                            paymentId: paymentId,
                            paymentMethod: selectedMethod
                        }
                    }
                })
            });

            const processData = await processRes.json();
            if (processData.errors) {
                throw new Error(processData.errors[0].message);
            }

            // Step 3: Update booking status to CONFIRMED
            const updateBookingMutation = `
                mutation UpdateBookingStatus($input: UpdateBookingStatusInput!) {
                    updateBookingStatus(input: $input) {
                        id
                        status
                    }
                }
            `;

            await fetch('http://localhost:3000/graphql-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    query: updateBookingMutation,
                    variables: {
                        input: {
                            id: booking.id,
                            status: 'CONFIRMED'
                        }
                    }
                })
            });

            toast.success('Payment successful! 🎉');
            router.push('/track');

        } catch (err: any) {
            toast.error('Payment failed: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="pt-28 pb-12 px-4 flex items-center justify-center">
                    <Loader className="animate-spin text-[#FF385C]" size={40} />
                </div>
            </main>
        );
    }

    if (error || !booking) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="pt-28 pb-12 px-4 max-w-2xl mx-auto text-center">
                    <p className="text-red-500 mb-4">{error || 'Booking not found'}</p>
                    <button
                        onClick={() => router.back()}
                        className="text-[#FF385C] flex items-center gap-2 mx-auto"
                    >
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft size={18} /> Back to Store
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Order Summary */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Store</span>
                                <span className="font-medium">{booking.storeName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Service</span>
                                <span className="font-medium">{booking.serviceLabel || booking.serviceType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Weight</span>
                                <span className="font-medium">{booking.weight} kg</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Price per kg</span>
                                <span className="font-medium">Rp {booking.pricePerKg.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Check-in Date</span>
                                <span className="font-medium">
                                    {new Date(booking.checkInDate).toLocaleDateString('id-ID', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-[#FF385C]">Rp {booking.totalPrice.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Method */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-xl font-bold mb-6">Payment Method</h2>

                        <div className="space-y-3">
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <div
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${selectedMethod === method.id
                                            ? 'border-[#FF385C] bg-red-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${selectedMethod === method.id ? 'bg-[#FF385C] text-white' : 'bg-gray-100'
                                            }`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold">{method.name}</div>
                                            <div className="text-sm text-gray-500">{method.description}</div>
                                        </div>
                                        {selectedMethod === method.id && (
                                            <CheckCircle className="text-[#FF385C]" size={20} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={processing}
                            className="w-full mt-6 bg-[#FF385C] hover:bg-[#E31C5F] disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Pay Rp {booking.totalPrice.toLocaleString()}
                                </>
                            )}
                        </button>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            By clicking pay, you agree to our terms and conditions.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
