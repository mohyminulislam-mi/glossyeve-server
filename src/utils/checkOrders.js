require('dotenv').config();
const { connectDB } = require('../config/db');
const Order = require('../models/Order');

const checkOrders = async () => {
  try {
    await connectDB();
    
    // Get a few orders to check
    const orders = await Order.find().limit(10).lean();
    
    console.log('=== Order samples:');
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1} (${order._id}):`);
      console.log('  user:', order.user);
      console.log('  createdAt:', order.createdAt);
      console.log('  orderStatus:', order.orderStatus);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking orders:', err);
    process.exit(1);
  }
};

checkOrders();
