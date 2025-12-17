const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://laundry_user:laundry_pass@localhost:5432/laundry_stores';

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connection established (Store Service)');
    } catch (error) {
        console.error('❌ Unable to connect to PostgreSQL:', error);
    }
}

module.exports = { sequelize, testConnection };
