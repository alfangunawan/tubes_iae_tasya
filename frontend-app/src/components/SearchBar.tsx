'use client';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
    onSearch?: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        if (onSearch) {
            onSearch(query);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex justify-center w-full max-w-4xl mx-auto my-6">
            <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-md hover:shadow-lg transition cursor-pointer w-full">

                {/* Pickup Location */}
                <div className="flex-1 px-8 py-3 hover:bg-gray-100 rounded-l-full transition">
                    <label className="block text-xs font-bold text-gray-800">Alamat</label>
                    <input
                        type="text"
                        placeholder="Cari destinasi laundry"
                        className="w-full bg-transparent text-sm text-gray-600 focus:outline-none placeholder-gray-400 truncate"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Search Button */}
                <div className="pr-2 pl-2">
                    <button
                        className="bg-[#FF385C] hover:bg-[#E31C5F] text-white p-3 rounded-full transition flex items-center justify-center"
                        onClick={handleSearch}
                    >
                        <Search size={20} strokeWidth={2.5} />
                        <span className="hidden">Cari</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
