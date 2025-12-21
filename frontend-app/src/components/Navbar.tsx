'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, User, Globe, LogOut, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // Fetch profile via API Gateway (port 3000)
                const API_GATEWAY_URL = 'http://localhost:3000';
                const res = await fetch(`${API_GATEWAY_URL}/api/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data);
                } else {
                    // If token is invalid, clear it
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        router.push('/');
        router.refresh();
    };

    const isAdmin = currentUser?.role === 'admin';

    return (
        <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Smart Laundry Logo"
                                width={120}
                                height={20}
                                className="object-contain"
                            />
                        </Link>
                    </div>

                    {/* Middle Navigation */}
                    <div className="hidden md:flex space-x-8">
                        <Link href="/" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                            Home
                        </Link>
                        <Link href="/track" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                            Track Order
                        </Link>
                    </div>

                    {/* Right Menu */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-sm font-medium text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-full cursor-pointer transition">
                            Join as Seller
                        </div>
                        <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer">
                            <Globe size={18} />
                        </div>

                        <div className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition cursor-pointer relative group">
                            <Menu size={18} />
                            <div className={`rounded-full p-1 text-white ${isAdmin ? 'bg-[#FF385C]' : 'bg-gray-500'}`}>
                                <User size={18} fill="white" />
                            </div>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.12)] py-2 hidden group-hover:block border border-gray-100">
                                {isLoading ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                                ) : currentUser ? (
                                    <>
                                        {/* Authenticated Menu */}
                                        <div className="px-4 py-3 hover:bg-gray-50 text-sm font-semibold text-gray-900 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                Hello, {currentUser.name}
                                                {isAdmin && (
                                                    <span className="text-xs bg-[#FF385C] text-white px-2 py-0.5 rounded-full">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 font-normal">{currentUser.email}</div>
                                        </div>

                                        {/* Admin Dashboard Link - Only for admins */}
                                        {isAdmin && (
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-[#FF385C] font-medium"
                                            >
                                                <LayoutDashboard size={14} />
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                                            My Profile
                                        </Link>
                                        <Link href="/track" className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">
                                            Track Orders
                                        </Link>
                                        <div className="border-t border-gray-200 my-2"></div>
                                        <div
                                            onClick={handleLogout}
                                            className="block px-4 py-2 hover:bg-gray-50 text-sm text-red-600 cursor-pointer flex items-center gap-2"
                                        >
                                            <LogOut size={14} /> Log out
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Guest Menu */}
                                        <Link href="/login" className="block px-4 py-2 hover:bg-gray-50 text-sm font-semibold text-gray-900">
                                            Log in
                                        </Link>
                                        <Link href="/register" className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-500">
                                            Sign up
                                        </Link>
                                        <div className="border-t border-gray-200 my-2"></div>
                                        <Link href="/host" className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-500">
                                            Laundry your home
                                        </Link>
                                        <div className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-500">
                                            Help Center
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
