'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Redirect to login after success
            router.push('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="border-b border-gray-200 px-6 py-4 flex items-center">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex-1 text-center font-bold text-gray-800">Sign up</div>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900">Create an account</h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="border border-gray-400 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-4 outline-none text-gray-900 placeholder-gray-500 border-b border-gray-400"
                                required
                            />
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full p-4 outline-none text-gray-900 placeholder-gray-500 border-b border-gray-400"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-4 outline-none text-gray-900 placeholder-gray-500 border-b border-gray-400"
                                required
                            />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-4 outline-none text-gray-900 placeholder-gray-500"
                                required
                            />
                        </div>

                        <p className="text-xs text-gray-500">
                            By selecting Agree and continue, I agree to Smart Laundry's Terms of Service and Privacy Policy.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-bold py-3.5 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Agree and continue'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account? <Link href="/login" className="text-black font-semibold underline">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
