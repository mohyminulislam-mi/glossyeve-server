require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function testBcrypt() {
  const connStr = process.env.MONGODB_URI;
  const dbName = 'aonelube';
  
  try {
    await mongoose.connect(connStr, { dbName });
    const user = await User.findOne({ email: 'customer@aonelub.com' }).select('+password');
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('Hash in DB:', user.password);
    const isMatch = await bcrypt.compare('123456', user.password);
    console.log('Match with "123456":', isMatch);
    
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

testBcrypt();
