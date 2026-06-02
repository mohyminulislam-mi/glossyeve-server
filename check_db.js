require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');

async function checkDB() {
  const connStr = process.env.MONGODB_URI;
  const dbName = 'aonelube';
  
  try {
    console.log('Connecting to database...');
    await mongoose.connect(connStr, { dbName });
    console.log('Connected!');

    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log('User count:', userCount);
    console.log('Product count:', productCount);
    console.log('Order count:', orderCount);

    if (userCount > 0) {
      const users = await User.find().select('+password');
      console.log('Users in DB:');
      users.forEach(u => {
        console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Password length in DB: ${u.password ? u.password.length : 'N/A'}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('DB check failed:', error);
  }
}

checkDB();
