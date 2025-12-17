'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Save token (in real app, use httpOnly cookies or secure storage)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Force reload to update Navbar state (simple approach)
            window.location.href = '/';
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
                <div className="flex-1 text-center font-bold text-gray-800">Log in</div>
                <div className="w-10"></div>
            </header>

            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900">Welcome back</h1>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="border border-gray-400 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-black focus-within:border-transparent">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 outline-none text-gray-900 placeholder-gray-500 border-b border-gray-400"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 outline-none text-gray-900 placeholder-gray-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-bold py-3.5 rounded-lg transition disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Continue'}
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="px-4 text-xs text-gray-500 font-medium">or</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account? <Link href="/register" className="text-black font-semibold underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
