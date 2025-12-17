import React from 'react';

interface ServiceCardProps {
    type: string;
    price: number;
    description: string;
    imageColor: string;
}

export default function ServiceCard({ type, price, description, imageColor }: ServiceCardProps) {
    return (
        <div className="group cursor-pointer">
            <div className={`relative aspect-square overflow-hidden rounded-xl bg-gray-200 mb-3 ${imageColor}`}>
                {/* Placeholder for Image */}
                <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold text-2xl">
                    {type.substring(0, 1)}
                </div>

                {/* Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                    <span className="text-xs font-bold text-gray-800">Service</span>
                </div>
            </div>

            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-900 group-hover:underline">{type.replace('_', ' ')}</h3>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">★ 4.9</span>
                    <span className="text-gray-500 text-sm">(120)</span>
                </div>
            </div>

            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{description}</p>

            <div className="mt-2 flex items-baseline gap-1">
                <span className="font-semibold text-black">Rp {price.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">/ kg</span>
            </div>
        </div>
    );
}
