'use client';

import { WashingMachine, Sparkles, Shirt, Footprints, Armchair, Zap } from 'lucide-react';

interface CategoryFilterProps {
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
}

const categories = [
    { name: 'Washing', icon: WashingMachine },
    { name: 'Dry Clean', icon: Sparkles },
    { name: 'Ironing', icon: Shirt },
    { name: 'Shoes', icon: Footprints },
    { name: 'Carpets', icon: Armchair },
    { name: 'Express', icon: Zap },
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
    return (
        <div className="flex gap-8 overflow-x-auto pb-4 hide-scrollbar justify-center">
            {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                    <button
                        key={cat.name}
                        onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                        className={`flex flex-col items-center gap-2 min-w-[64px] cursor-pointer pb-2 transition
                            ${isSelected
                                ? 'opacity-100 border-b-2 border-black'
                                : 'opacity-60 hover:opacity-100 hover:border-b-2 hover:border-gray-400'
                            }`}
                    >
                        <Icon size={24} strokeWidth={1.5} />
                        <span className="text-xs font-semibold">{cat.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
