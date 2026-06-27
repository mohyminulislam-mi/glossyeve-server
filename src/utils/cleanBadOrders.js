require('dotenv').config();
const { connectDB } = require('../config/db');
const Order = require('../models/Order');

const cleanBadOrders = async () => {
  try {
    await connectDB();
    
    console.log('=== Finding bad orders...');
    
    // Find bad orders
    const badOrders = await Order.find({
      $or: [
        { user: { $exists: false } },
        { user: null },
        { createdAt: { $exists: false } },
        { createdAt: null },
        { orderStatus: { $exists: false } },
        { orderStatus: null }
      ]
    }).lean();
    
    if (badOrders.length === 0) {
      console.log('✅ No bad orders found!');
      process.exit(0);
    }
    
    console.log(`\n⚠️ Found ${badOrders.length} bad orders:`);
    const badOrderIds = badOrders.map(order => order._id.toString());
    badOrderIds.forEach(id => console.log(`- ${id}`));
    
    console.log('\n⚠️ WARNING: These orders will be PERMANENTLY DELETED!');
    console.log('Please review the IDs above carefully.');
    console.log('To proceed with deletion, run this script again with the --confirm flag.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking bad orders:', err);
    process.exit(1);
  }
};

const deleteBadOrders = async () => {
  try {
    await connectDB();
    
    console.log('=== Deleting bad orders...');
    
    const badOrders = await Order.find({
      $or: [
        { user: { $exists: false } },
        { user: null },
        { createdAt: { $exists: false } },
        { createdAt: null },
        { orderStatus: { $exists: false } },
        { orderStatus: null }
      ]
    }).lean();
    
    if (badOrders.length === 0) {
      console.log('✅ No bad orders found!');
      process.exit(0);
    }
    
    const badOrderIds = badOrders.map(order => order._id);
    const deleteResult = await Order.deleteMany({ _id: { $in: badOrderIds } });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} bad orders!`);
    console.log('Deleted order IDs:');
    badOrderIds.forEach(id => console.log(`- ${id}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error deleting bad orders:', err);
    process.exit(1);
  }
};

// Check for --confirm flag
const shouldDelete = process.argv.includes('--confirm');

if (shouldDelete) {
  deleteBadOrders();
} else {
  cleanBadOrders();
}
