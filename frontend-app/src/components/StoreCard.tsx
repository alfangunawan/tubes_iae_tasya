import React from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';

interface StoreCardProps {
    id: string;
    name: string;
    address: string;
    rating: number;
    reviewCount: number;
    image?: string;
    priceStart?: number;
}

export default function StoreCard({ id, name, address, rating, reviewCount, image, priceStart }: StoreCardProps) {
    return (
        <Link href={`/store/${id}`}>
            <div className="group cursor-pointer">
                <div className="relative aspect-[20/19] overflow-hidden rounded-xl bg-gray-200 mb-3">
                    {image ? (
                        <img
                            src={image}
                            alt={name}
                            className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-2xl">
                            Store
                        </div>
                    )}

                    {/* Superhost Badge (Mock) */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                        <span className="text-xs font-bold text-gray-800">Super Laundry</span>
                    </div>
                </div>

                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 group-hover:underline truncate">{name}</h3>
                    <div className="flex items-center gap-1">
                        <Star size={14} fill="currentColor" className="text-black" />
                        <span className="text-sm font-light">{rating}</span>
                    </div>
                </div>

                <p className="text-gray-500 text-sm mt-0 line-clamp-1">{address}</p>
                <p className="text-gray-500 text-sm mt-0">2 km away</p>

                <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-semibold text-black">Rp {priceStart ? priceStart.toLocaleString() : '5,000'}</span>
                    <span className="text-gray-900 text-sm font-light"> / kg</span>
                </div>
            </div>
        </Link>
    );
}
