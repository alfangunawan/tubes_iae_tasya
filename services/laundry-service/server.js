const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');
const cors = require('cors');
const { connectDB } = require('./config/database');
const Order = require('./models/Order');

const app = express();
const pubsub = new PubSub();

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:3000', // API Gateway
    'http://localhost:3002', // Frontend
    'http://api-gateway:3000', // Docker container name
    'http://frontend-app:3002' // Docker container name
  ],
  credentials: true
}));

// GraphQL type definitions
const typeDefs = `
  enum OrderStatus {
    PENDING
    WASHING
    DRYING
    IRONING
    READY
    DELIVERED
    CANCELLED
  }

  enum ServiceType {
    WASH
    DRY
    IRON
    WASH_DRY
    WASH_IRON
    FULL_SERVICE
  }

  type Order {
    id: ID!
    customerId: ID!
    customerName: String
    storeId: ID!
    storeName: String
    serviceType: ServiceType!
    weight: Float!
    price: Float!
    status: OrderStatus!
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    orders(customerId: ID, status: OrderStatus): [Order!]!
    order(id: ID!): Order
    myOrders: [Order!]!
  }

  input CreateOrderInput {
    storeId: ID!
    storeName: String!
    serviceType: ServiceType!
    weight: Float!
    price: Float!
    notes: String
  }

  input UpdateOrderInput {
    status: OrderStatus
    notes: String
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    cancelOrder(id: ID!): Boolean!
  }

  type Subscription {
    orderStatusUpdated(customerId: ID!): Order!
    orderCreated: Order!
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    orders: async (_, { customerId, status }, { req }) => {
      console.log('📋 Query: orders called');
      console.log('   User:', req?.user?.email, 'Role:', req?.user?.role);

      let filter = {};
      if (customerId) filter.customerId = customerId;
      if (status) filter.status = status;

      const orderList = await Order.find(filter).sort({ createdAt: -1 });
      console.log('   Returning', orderList.length, 'orders from MongoDB');
      return orderList;
    },

    order: async (_, { id }) => {
      return Order.findById(id);
    },

    myOrders: async (_, __, { req }) => {
      console.log('📋 Query: myOrders called');
      console.log('   User:', req?.user?.email, 'ID:', req?.user?.id);

      if (!req.user) throw new Error('Not authenticated');

      const userOrders = await Order.find({ customerId: req.user.id }).sort({ createdAt: -1 });
      console.log('   Returning', userOrders.length, 'orders for user from MongoDB');
      return userOrders;
    }
  },

  Mutation: {
    createOrder: async (_, { input }, { req }) => {
      console.log('📝 Mutation: createOrder called');
      console.log('   User:', req?.user?.email, 'ID:', req?.user?.id);

      if (!req.user) throw new Error('Authentication required');

      // Trust the price from input (marketplace logic) or re-calculate if strict
      const price = input.price || Order.calculatePrice(input.serviceType, input.weight);

      const newOrder = new Order({
        customerId: req.user.id,
        customerName: req.user.name,
        storeId: input.storeId,
        storeName: input.storeName,
        serviceType: input.serviceType,
        weight: input.weight,
        notes: input.notes || '',
        price,
        status: 'PENDING'
      });

      await newOrder.save();

      console.log('   ✅ Order created:', newOrder.id);
      console.log('   Saved to MongoDB');

      // Notify subscribers
      pubsub.publish('ORDER_CREATED', { orderCreated: newOrder });

      return newOrder;
    },

    updateOrderStatus: async (_, { id, status }, { req }) => {
      console.log('📝 Mutation: updateOrderStatus called');
      console.log('   Order ID:', id, 'New Status:', status);

      const order = await Order.findById(id);
      if (!order) throw new Error('Order not found');

      order.status = status;
      await order.save();

      console.log('   ✅ Order status updated in MongoDB');

      // Notify customer
      pubsub.publish(`ORDER_UPDATED_${order.customerId}`, { orderStatusUpdated: order });

      return order;
    },

    cancelOrder: async (_, { id }, { req }) => {
      const order = await Order.findById(id);
      if (!order) return false;

      if (req.user.id !== order.customerId && req.user.role !== 'admin') {
        throw new Error('Not authorized');
      }

      order.status = 'CANCELLED';
      await order.save();

      return true;
    },
  },

  Subscription: {
    orderStatusUpdated: {
      subscribe: (_, { customerId }) => pubsub.asyncIterator([`ORDER_UPDATED_${customerId}`]),
    },
    orderCreated: {
      subscribe: () => pubsub.asyncIterator(['ORDER_CREATED']),
    }
  },
};

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      console.log('Incoming Headers:', JSON.stringify(req.headers));
      const user = req && req.headers.user ? JSON.parse(req.headers.user) : null;
      console.log('Context User:', user);
      return { req: { ...req, user } };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  const PORT = process.env.PORT || 4000;

  const httpServer = app.listen(PORT, () => {
    console.log(`🚀 Laundry Service (GraphQL) running on port ${PORT}`);
    console.log(`🔗 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`💾 Database: MongoDB`);
    console.log(`📡 Subscriptions ready`);
  });
}

startServer().catch(error => {
  console.error('Failed to start GraphQL server:', error);
  process.exit(1);
});

module.exports = app;