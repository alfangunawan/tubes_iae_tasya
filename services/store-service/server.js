const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const Store = require('./models/Store');

const app = express();
app.use(cors());

const { Op } = require('sequelize');

// --- GraphQL Schema ---
const typeDefs = gql`
  type Service {
    type: String!
    price: Float!
    label: String
  }

  type Store {
    id: ID!
    name: String!
    description: String!
    address: String!
    ownerId: String!
    images: [String]
    rating: Float
    reviewCount: Int
    services: [Service]
    createdAt: String
  }

  type Query {
    stores(search: String): [Store]
    store(id: ID!): Store
    myStores(ownerId: ID!): [Store]
  }

  input ServiceInput {
    type: String!
    price: Float!
    label: String
  }

  input CreateStoreInput {
    name: String!
    description: String!
    address: String!
    ownerId: String!
    services: [ServiceInput]!
    images: [String]
  }

  type Mutation {
    createStore(input: CreateStoreInput!): Store
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    stores: async (_, { search }) => {
      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const stores = await Store.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      return stores.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        address: s.address,
        ownerId: s.ownerId,
        images: s.images,
        rating: parseFloat(s.rating),
        reviewCount: s.reviewCount,
        services: s.services,
        createdAt: s.created_at
      }));
    },
    store: async (_, { id }) => {
      const store = await Store.findByPk(id);
      if (!store) return null;
      return {
        id: store.id,
        name: store.name,
        description: store.description,
        address: store.address,
        ownerId: store.ownerId,
        images: store.images,
        rating: parseFloat(store.rating),
        reviewCount: store.reviewCount,
        services: store.services,
        createdAt: store.created_at
      };
    },
    myStores: async (_, { ownerId }) => {
      const stores = await Store.findAll({
        where: { ownerId },
        order: [['created_at', 'DESC']]
      });
      return stores.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        address: s.address,
        ownerId: s.ownerId,
        images: s.images,
        rating: parseFloat(s.rating),
        reviewCount: s.reviewCount,
        services: s.services,
        createdAt: s.created_at
      }));
    }
  },
  Mutation: {
    createStore: async (_, { input }) => {
      const newStore = await Store.create(input);
      return {
        id: newStore.id,
        name: newStore.name,
        description: newStore.description,
        address: newStore.address,
        ownerId: newStore.ownerId,
        images: newStore.images,
        rating: parseFloat(newStore.rating),
        reviewCount: newStore.reviewCount,
        services: newStore.services,
        createdAt: newStore.created_at
      };
    }
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'store-service',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  // Test database connection
  await testConnection();

  // Sync database
  await sequelize.sync({ alter: true });
  console.log('✅ Database models synchronized');

  // Seed default stores
  await Store.seedDefaultStores();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`🚀 Store Service running on port ${PORT}`);
    console.log(`🔗 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`💾 Database: PostgreSQL`);
  });
}

startServer();
