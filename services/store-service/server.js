const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const mongoose = require('mongoose');
const Store = require('./models/Store');

const app = express();
app.use(cors());

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry_stores';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('💾 Connected to MongoDB (Store Service)'))
  .catch(err => console.error('Error connecting only MongoDB:', err));

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
    stores: [Store]
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
    stores: async () => {
      return await Store.find().sort({ createdAt: -1 });
    },
    store: async (_, { id }) => {
      return await Store.findById(id);
    },
    myStores: async (_, { ownerId }) => {
      return await Store.find({ ownerId });
    }
  },
  Mutation: {
    createStore: async (_, { input }) => {
      const newStore = new Store(input);
      await newStore.save();
      return newStore;
    }
  }
};

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`🚀 Store Service running on port ${PORT}`);
    console.log(`🔗 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
