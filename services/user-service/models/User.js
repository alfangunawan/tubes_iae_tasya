const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'CUSTOMER', 'staff'),
        defaultValue: 'CUSTOMER'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 10);
            }
        }
    }
});

// Instance method to check password
User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Class method to find by email
User.findByEmail = async function (email) {
    return this.findOne({ where: { email } });
};

// Seed default users
User.seedDefaultUsers = async function () {
    const adminExists = await this.findByEmail('admin@smartlaundry.com');
    if (!adminExists) {
        await this.create({
            email: 'admin@smartlaundry.com',
            password: 'admin123',
            name: 'Admin Laundry',
            role: 'admin',
            phone: '081234567890'
        });
        console.log('✅ Default admin user created');
    }

    const customerExists = await this.findByEmail('customer@smartlaundry.com');
    if (!customerExists) {
        await this.create({
            email: 'customer@smartlaundry.com',
            password: 'customer123',
            name: 'Customer Demo',
            role: 'CUSTOMER',
            phone: '089876543210'
        });
        console.log('✅ Default customer user created');
    }
};

module.exports = User;
