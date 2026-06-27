require('dotenv').config();
const { connectDB } = require('../config/db');
const User = require('../models/User');

const migrateRoles = async () => {
  try {
    await connectDB();

    console.log('Migrating user roles from "employee" to "manager"...');
    const result = await User.updateMany(
      { role: 'employee' },
      { $set: { role: 'manager' } }
    );

    console.log(`Migration complete! Updated ${result.modifiedCount} users.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateRoles();
