const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-db';

const inventorySchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  category: String,
});

mongoose.connect(uri).then(async() => {
  const Inventory = mongoose.model('Inventory', inventorySchema);
  
  const updates = [
    ['Meat & Seafood', 'Kitchen Meat & Seafood'],
    ['Rice, Pasta & Bread', 'Kitchen Rice, Pasta & Bread'],
    ['Vegetables', 'Kitchen Vegetables'],
    ['Fruits', 'Kitchen Fruits'],
    ['Dairy Products', 'Kitchen Dairy Products'],
    ['Baking Ingredients', 'Kitchen Baking Ingredients'],
    ['Soup & Sauce', 'Kitchen Soup & Sauce'],
    ['Seasonings & Spices', 'Kitchen Seasonings & Spices'],
    ['Frozen & Ready-Made', 'Kitchen Frozen & Ready-Made'],
    ['Garnish & Extras', 'Kitchen Garnish & Extras']
  ];
  
  for (const [old, newCat] of updates) {
    const result = await Inventory.updateMany({ category: old }, { category: newCat });
    console.log(`Updated ${old} → ${newCat}: ${result.modifiedCount} items`);
  }
  
  console.log('All categories updated successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
