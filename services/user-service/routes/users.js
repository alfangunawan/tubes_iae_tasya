const express = require('express');
const { Op } = require('sequelize');
const { validateUser, validateUserUpdate } = require('../middleware/validation');
const User = require('../models/User');

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    address: user.address,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

// GET /api/users/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userHeader = req.headers['user'];
    if (!userHeader) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userData = JSON.parse(userHeader);
    const user = await User.findByPk(userData.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const { page, limit, role, search } = req.query;

    let whereClause = {};

    // Filter by role
    if (role) {
      whereClause.role = role;
    }

    // Search by name or email
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // If pagination params provided, return paginated response
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      return res.json({
        users: rows.map(sanitizeUser),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalUsers: count,
          hasNext: offset + rows.length < count,
          hasPrev: offset > 0
        }
      });
    }

    // Otherwise return all users
    const users = await User.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json(users.map(sanitizeUser));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${req.params.id} does not exist`
      });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user
router.post('/', validateUser, async (req, res) => {
  try {
    const { name, email, role = 'CUSTOMER', phone, address } = req.body;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }

    const password = req.body.password || 'password123';

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address
    });

    res.status(201).json({
      message: 'User created successfully',
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', validateUserUpdate, async (req, res) => {
  try {
    const { name, email, role, phone, address } = req.body;

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${req.params.id} does not exist`
      });
    }

    // Check if email already exists (excluding current user)
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A user with this email already exists'
        });
      }
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${req.params.id} does not exist`
      });
    }

    const deletedUser = sanitizeUser(user);
    await user.destroy();

    res.json({
      message: 'User deleted successfully',
      user: deletedUser
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;