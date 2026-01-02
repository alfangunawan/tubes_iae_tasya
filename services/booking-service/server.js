const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry_bookings';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('💾 Connected to MongoDB (Booking Service)'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// --- GraphQL Schema ---
const typeDefs = gql`
  enum BookingStatus {
    PENDING
    CONFIRMED
    PROCESSING
    READY
    COMPLETED
    CANCELLED
  }

  type Booking {
    id: ID!
    userId: String!
    userName: String!
    userEmail: String!
    storeId: String!
    storeName: String!
    serviceType: String!
    serviceLabel: String
    weight: Float!
    pricePerKg: Float!
    totalPrice: Float!
    checkInDate: String!
    status: BookingStatus!
    notes: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    bookings: [Booking]
    booking(id: ID!): Booking
    myBookings(userId: String!): [Booking]
    storeBookings(storeId: String!): [Booking]
  }

  input CreateBookingInput {
    userId: String!
    userName: String!
    userEmail: String!
    storeId: String!
    storeName: String!
    serviceType: String!
    serviceLabel: String
    weight: Float!
    pricePerKg: Float!
    checkInDate: String!
    notes: String
  }

  input UpdateBookingStatusInput {
    id: ID!
    status: BookingStatus!
  }

  type Mutation {
    createBooking(input: CreateBookingInput!): Booking
    updateBookingStatus(input: UpdateBookingStatusInput!): Booking
    cancelBooking(id: ID!): Booking
  }
`;

// --- Resolvers ---
const resolvers = {
    // Field resolvers for Booking type to ensure proper date serialization
    Booking: {
        checkInDate: (parent) => parent.checkInDate ? new Date(parent.checkInDate).toISOString() : null,
        createdAt: (parent) => parent.createdAt ? new Date(parent.createdAt).toISOString() : null,
        updatedAt: (parent) => parent.updatedAt ? new Date(parent.updatedAt).toISOString() : null,
    },
    Query: {
        bookings: async () => {
            return await Booking.find().sort({ createdAt: -1 });
        },
        booking: async (_, { id }) => {
            return await Booking.findById(id);
        },
        myBookings: async (_, { userId }) => {
            return await Booking.find({ userId }).sort({ createdAt: -1 });
        },
        storeBookings: async (_, { storeId }) => {
            return await Booking.find({ storeId }).sort({ createdAt: -1 });
        }
    },
    Mutation: {
        createBooking: async (_, { input }) => {
            const totalPrice = input.weight * input.pricePerKg;
            const newBooking = new Booking({
                ...input,
                totalPrice,
                checkInDate: new Date(input.checkInDate),
                status: 'PENDING'
            });
            await newBooking.save();
            console.log('✅ New booking created:', newBooking.id);
            return newBooking;
        },
        updateBookingStatus: async (_, { input }) => {
            const booking = await Booking.findByIdAndUpdate(
                input.id,
                { status: input.status },
                { new: true }
            );
            if (!booking) {
                throw new Error('Booking not found');
            }
            console.log(`✅ Booking ${input.id} status updated to ${input.status}`);
            return booking;
        },
        cancelBooking: async (_, { id }) => {
            const booking = await Booking.findByIdAndUpdate(
                id,
                { status: 'CANCELLED' },
                { new: true }
            );
            if (!booking) {
                throw new Error('Booking not found');
            }
            console.log(`❌ Booking ${id} cancelled`);
            return booking;
        }
    }
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'booking-service',
        database: 'MongoDB',
        timestamp: new Date().toISOString()
    });
});

async function startServer() {
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4002;
    app.listen(PORT, () => {
        console.log(`🚀 Booking Service running on port ${PORT}`);
        console.log(`🔗 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer();
