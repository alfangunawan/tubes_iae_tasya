const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const cors = require('cors');
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry_payments';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('💾 Connected to MongoDB (Payment Service)'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// --- GraphQL Schema ---
const typeDefs = gql`
  enum PaymentStatus {
    PENDING
    PAID
    FAILED
    REFUNDED
    EXPIRED
  }

  enum PaymentMethod {
    BANK_TRANSFER
    E_WALLET
    CASH
    CREDIT_CARD
  }

  type Payment {
    id: ID!
    bookingId: String!
    userId: String!
    userName: String!
    userEmail: String!
    storeName: String!
    serviceLabel: String
    weight: Float!
    amount: Float!
    paymentMethod: PaymentMethod!
    status: PaymentStatus!
    invoiceNumber: String!
    paidAt: String
    refundedAt: String
    refundReason: String
    createdAt: String
    updatedAt: String
  }

  type Query {
    payments: [Payment]
    payment(id: ID!): Payment
    paymentByBooking(bookingId: String!): Payment
    myPayments(userId: String!): [Payment]
    paymentHistory(userId: String!): [Payment]
  }

  input CreatePaymentInput {
    bookingId: String!
    userId: String!
    userName: String!
    userEmail: String!
    storeName: String!
    serviceLabel: String
    weight: Float!
    amount: Float!
    paymentMethod: PaymentMethod
  }

  input ProcessPaymentInput {
    paymentId: ID!
    paymentMethod: PaymentMethod!
  }

  input RefundPaymentInput {
    paymentId: ID!
    reason: String!
  }

  type Mutation {
    createPayment(input: CreatePaymentInput!): Payment
    processPayment(input: ProcessPaymentInput!): Payment
    refundPayment(input: RefundPaymentInput!): Payment
  }
`;

// --- Resolvers ---
const resolvers = {
    Query: {
        payments: async () => {
            return await Payment.find().sort({ createdAt: -1 });
        },
        payment: async (_, { id }) => {
            return await Payment.findById(id);
        },
        paymentByBooking: async (_, { bookingId }) => {
            return await Payment.findOne({ bookingId });
        },
        myPayments: async (_, { userId }) => {
            return await Payment.find({ userId }).sort({ createdAt: -1 });
        },
        paymentHistory: async (_, { userId }) => {
            return await Payment.find({
                userId,
                status: { $in: ['PAID', 'REFUNDED'] }
            }).sort({ createdAt: -1 });
        }
    },
    Mutation: {
        createPayment: async (_, { input }) => {
            // Check if payment already exists for this booking
            const existingPayment = await Payment.findOne({ bookingId: input.bookingId });
            if (existingPayment) {
                return existingPayment;
            }

            const newPayment = new Payment({
                ...input,
                status: 'PENDING'
            });
            await newPayment.save();
            console.log('✅ New payment created:', newPayment.invoiceNumber);
            return newPayment;
        },
        processPayment: async (_, { input }) => {
            const payment = await Payment.findById(input.paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status === 'PAID') {
                throw new Error('Payment already processed');
            }

            // Simulate payment processing (no real gateway)
            payment.status = 'PAID';
            payment.paymentMethod = input.paymentMethod;
            payment.paidAt = new Date();
            await payment.save();

            console.log(`💰 Payment ${payment.invoiceNumber} processed successfully`);
            return payment;
        },
        refundPayment: async (_, { input }) => {
            const payment = await Payment.findById(input.paymentId);
            if (!payment) {
                throw new Error('Payment not found');
            }

            if (payment.status !== 'PAID') {
                throw new Error('Can only refund paid payments');
            }

            payment.status = 'REFUNDED';
            payment.refundedAt = new Date();
            payment.refundReason = input.reason;
            await payment.save();

            console.log(`💸 Payment ${payment.invoiceNumber} refunded: ${input.reason}`);
            return payment;
        }
    }
};

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'payment-service',
        database: 'MongoDB',
        timestamp: new Date().toISOString()
    });
});

async function startServer() {
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`🚀 Payment Service running on port ${PORT}`);
        console.log(`🔗 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer();
