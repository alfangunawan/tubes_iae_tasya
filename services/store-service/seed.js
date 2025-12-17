const mongoose = require('mongoose');
const Store = require('./models/Store');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry_stores';

const SAMPLE_STORES = [
    {
        name: 'Clean & Fresh Laundry',
        description: 'We provide premium laundry services using modern machines and eco-friendly detergents. Your clothes are guaranteed clean, fragrant, and tidy. We specialize in delicate fabrics and suits.',
        address: 'Jl. Sukabirus No. 12, Dayeuhkolot',
        ownerId: 'owner_123',
        rating: 4.8,
        reviewCount: 124,
        images: [
            'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?q=80&w=2071&auto=format&fit=crop', // Washing machines row
            'https://images.unsplash.com/photo-1517677208171-0bc5e59b2604?q=80&w=2070&auto=format&fit=crop', // Folded towels/clothes
            'https://images.unsplash.com/photo-1582735689369-4fe89db6304d?q=80&w=2070&auto=format&fit=crop'  // Laundry basket
        ],
        services: [
            { type: 'WASH', price: 6000, label: 'Premium Wash' },
            { type: 'FULL_SERVICE', price: 12000, label: 'Wash, Dry & Fold' }
        ]
    },
    {
        name: 'Mama Laundry Express',
        description: 'Quick and affordable laundry service perfect for students. We offer same-day delivery and free pickup for orders over 5kg.',
        address: 'Jl. Adhyaksa No. 5',
        ownerId: 'owner_456',
        rating: 4.9,
        reviewCount: 89,
        images: [
            'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?q=80&w=2070&auto=format&fit=crop', // Laundromat vibe
            'https://images.unsplash.com/photo-1626806775807-445633a83204?q=80&w=2070&auto=format&fit=crop'  // Ironing
        ],
        services: [
            { type: 'WASH_IRON', price: 8000, label: 'Wash & Iron' },
            { type: 'IRON', price: 4000, label: 'Iron Only' }
        ]
    },
    {
        name: 'Shoes & Care Bandung',
        description: 'Specialist in shoe cleaning and restoration. We handle all types of shoes from sneakers to leather boots with professional care.',
        address: 'Jl. Telekomunikasi No. 1',
        ownerId: 'owner_789',
        rating: 4.7,
        reviewCount: 204,
        images: [
            'https://images.unsplash.com/photo-1604369847290-7d94944d1891?q=80&w=2069&auto=format&fit=crop', // Shoes cleaning
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1974&auto=format&fit=crop'  // Sneakers
        ],
        services: [
            { type: 'FULL_SERVICE', price: 35000, label: 'Deep Clean (Shoes)' },
            { type: 'DRY', price: 25000, label: 'Fast Clean' }
        ]
    },
    {
        name: 'Berkah Laundry Kiloan',
        description: 'Laundry kiloan murah dan bersih. Menggunakan deterjen berkualitas dan air PDAM yang difilter. Bisa antar jemput.',
        address: 'Gg. PGA',
        ownerId: 'owner_101',
        rating: 4.5,
        reviewCount: 56,
        images: [
            'https://images.unsplash.com/photo-1563456019-943e884b2383?q=80&w=2070&auto=format&fit=crop', // Clothes on hanger
            'https://images.unsplash.com/photo-1489247671295-6b71f9227f4e?q=80&w=2070&auto=format&fit=crop' // Towels
        ],
        services: [
            { type: 'WASH_DRY', price: 5000, label: 'Cuci Kering' },
            { type: 'WASH_IRON', price: 6500, label: 'Cuci Setrika' }
        ]
    },
    {
        name: 'Elite Dry Cleaners',
        description: 'Professional dry cleaning for your suits, dresses, and delicate garments. We use eco-friendly solvents.',
        address: 'Podium',
        ownerId: 'owner_202',
        rating: 5.0,
        reviewCount: 42,
        images: [
            'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?q=80&w=2070&auto=format&fit=crop', // Suits/Hangers
            'https://images.unsplash.com/photo-1582735689369-4fe89db6304d?q=80&w=2070&auto=format&fit=crop'
        ],
        services: [
            { type: 'FULL_SERVICE', price: 25000, label: 'Suit Dry Clean' },
            { type: 'IRON', price: 10000, label: 'Steam Press' }
        ]
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        await Store.deleteMany({});
        console.log('Cleared existing stores');

        await Store.insertMany(SAMPLE_STORES);
        console.log('✅ Seeded sample stores');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
