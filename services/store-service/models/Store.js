const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Store = sequelize.define('Store', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    ownerId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'owner_id'
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0
    },
    reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'review_count'
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: []
    },
    services: {
        type: DataTypes.JSONB,
        defaultValue: []
    }
}, {
    tableName: 'stores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Seed method
Store.seedDefaultStores = async function () {
    const count = await this.count();
    if (count === 0) {
        const stores = [
            {
                name: 'Clean & Fresh Laundry',
                description: 'We provide premium laundry services using modern machines and eco-friendly detergents.',
                address: 'Jl. Sukabirus No. 12, Dayeuhkolot',
                ownerId: 'owner_123',
                rating: 4.8,
                reviewCount: 124,
                images: [
                    'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?q=80&w=2071&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1517677208171-0bc5e59b2604?q=80&w=2070&auto=format&fit=crop'
                ],
                services: [
                    { type: 'WASH', price: 6000, label: 'Premium Wash' },
                    { type: 'FULL_SERVICE', price: 12000, label: 'Wash, Dry & Fold' }
                ]
            },
            {
                name: 'Mama Laundry Express',
                description: 'Quick and affordable laundry service perfect for students.',
                address: 'Jl. Adhyaksa No. 5',
                ownerId: 'owner_456',
                rating: 4.9,
                reviewCount: 89,
                images: [
                    'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?q=80&w=2070&auto=format&fit=crop'
                ],
                services: [
                    { type: 'WASH_IRON', price: 8000, label: 'Wash & Iron' },
                    { type: 'IRON', price: 4000, label: 'Iron Only' }
                ]
            },
            {
                name: 'Shoes & Care Bandung',
                description: 'Specialist in shoe cleaning and restoration.',
                address: 'Jl. Telekomunikasi No. 1',
                ownerId: 'owner_789',
                rating: 4.7,
                reviewCount: 204,
                images: [
                    'https://images.unsplash.com/photo-1604369847290-7d94944d1891?q=80&w=2069&auto=format&fit=crop'
                ],
                services: [
                    { type: 'FULL_SERVICE', price: 35000, label: 'Deep Clean (Shoes)' },
                    { type: 'DRY', price: 25000, label: 'Fast Clean' }
                ]
            },
            {
                name: 'Berkah Laundry Kiloan',
                description: 'Laundry kiloan murah dan bersih.',
                address: 'Gg. PGA',
                ownerId: 'owner_101',
                rating: 4.5,
                reviewCount: 56,
                images: [
                    'https://images.unsplash.com/photo-1563456019-943e884b2383?q=80&w=2070&auto=format&fit=crop'
                ],
                services: [
                    { type: 'WASH_DRY', price: 5000, label: 'Cuci Kering' },
                    { type: 'WASH_IRON', price: 6500, label: 'Cuci Setrika' }
                ]
            },
            {
                name: 'Elite Dry Cleaners',
                description: 'Professional dry cleaning for suits and delicate garments.',
                address: 'Podium',
                ownerId: 'owner_202',
                rating: 5.0,
                reviewCount: 42,
                images: [
                    'https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?q=80&w=2070&auto=format&fit=crop'
                ],
                services: [
                    { type: 'FULL_SERVICE', price: 25000, label: 'Suit Dry Clean' },
                    { type: 'IRON', price: 10000, label: 'Steam Press' }
                ]
            }
        ];

        await this.bulkCreate(stores);
        console.log('✅ Default stores seeded');
    }
};

module.exports = Store;
