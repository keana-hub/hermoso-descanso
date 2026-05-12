const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-db';

const roomSchema = new mongoose.Schema({ number: Number, status: String, housekeepingStatus: String });
const inventorySchema = new mongoose.Schema({ name: String, quantity: Number, category: String });

const Room = mongoose.model('Room', roomSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);

const inventoryItems = [
  { name: "Chef's Knife", quantity: 10, category: 'Kitchen Tools' },
  { name: 'Paring Knife', quantity: 15, category: 'Kitchen Tools' },
  { name: 'Cutting Board', quantity: 8, category: 'Kitchen Tools' },
  { name: 'Mixing Bowl', quantity: 12, category: 'Kitchen Tools' },
  { name: 'Wooden Spoon', quantity: 20, category: 'Kitchen Tools' },
  { name: 'Spatula', quantity: 15, category: 'Kitchen Tools' },
  { name: 'Colander', quantity: 6, category: 'Kitchen Tools' },
  { name: 'Measuring Cup', quantity: 10, category: 'Kitchen Tools' },
  { name: 'Whisk', quantity: 8, category: 'Kitchen Tools' },
  { name: 'Tongs', quantity: 10, category: 'Kitchen Tools' },
  { name: 'Chicken Breast', quantity: 45, category: 'Kitchen Ingredients' },
  { name: 'Ground Beef', quantity: 32, category: 'Kitchen Ingredients' },
  { name: 'Pork Chops', quantity: 25, category: 'Kitchen Ingredients' },
  { name: 'Fresh Salmon', quantity: 15, category: 'Kitchen Ingredients' },
  { name: 'Tomatoes', quantity: 50, category: 'Kitchen Ingredients' },
  { name: 'Onions', quantity: 40, category: 'Kitchen Ingredients' },
  { name: 'Garlic', quantity: 30, category: 'Kitchen Ingredients' },
  { name: 'Carrots', quantity: 35, category: 'Kitchen Ingredients' },
  { name: 'Potatoes', quantity: 60, category: 'Kitchen Ingredients' },
  { name: 'Rice', quantity: 100, category: 'Kitchen Ingredients' },
  { name: 'Pasta', quantity: 75, category: 'Kitchen Ingredients' },
  { name: 'Olive Oil', quantity: 25, category: 'Kitchen Ingredients' },
  { name: 'Salt', quantity: 15, category: 'Kitchen Ingredients' },
  { name: 'Black Pepper', quantity: 12, category: 'Kitchen Ingredients' },
  { name: 'Butter', quantity: 20, category: 'Kitchen Ingredients' },
  { name: 'Milk', quantity: 50, category: 'Kitchen Ingredients' },
  { name: 'Eggs', quantity: 200, category: 'Kitchen Ingredients' },
  { name: 'Shampoo', quantity: 120, category: 'Housekeeping' },
  { name: 'Bath Towels', quantity: 80, category: 'Housekeeping' },
  { name: 'Hand Soap', quantity: 100, category: 'Housekeeping' },
  { name: 'Toilet Paper', quantity: 150, category: 'Housekeeping' },
  { name: 'Bed Sheets', quantity: 60, category: 'Housekeeping' },
  { name: 'Pillowcases', quantity: 80, category: 'Housekeeping' },
  { name: 'Office Supplies', quantity: 22, category: 'Admin' },
  { name: 'Guest Welcome Kits', quantity: 18, category: 'Admin' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB at', MONGODB_URI);
  for (let i = 1; i <= 150; i++) {
    await Room.updateOne(
      { number: i },
      {
        $setOnInsert: {
          number: i,
          status: i % 3 === 0 ? 'Occupied' : 'Available',
          housekeepingStatus: i % 3 === 0 ? 'Pending' : 'Clean',
        },
      },
      { upsert: true }
    );
  }
  for (const item of inventoryItems) {
    await Inventory.updateOne({ name: item.name }, { $set: item }, { upsert: true });
  }
  console.log('Database seeding completed.');
  mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
