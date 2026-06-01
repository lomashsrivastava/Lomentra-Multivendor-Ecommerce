const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/multi_vendor_ecommerce';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB!');
  
  const CategorySchema = new mongoose.Schema({}, { strict: false, collection: 'categories' });
  const Category = mongoose.model('Category', CategorySchema);

  const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
  const Product = mongoose.model('Product', ProductSchema);

  try {
    const totalCategories = await Category.countDocuments();
    const featuredCategories = await Category.countDocuments({ isFeatured: true });
    const level1Categories = await Category.countDocuments({ level: 1 });
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });

    console.log('Total Categories:', totalCategories);
    console.log('Featured Categories:', featuredCategories);
    console.log('Level 1 Categories:', level1Categories);
    console.log('Total Products:', totalProducts);
    console.log('Active Products:', activeProducts);

    const sampleFeatured = await Category.find({ isFeatured: true }).limit(5).lean();
    console.log('Sample Featured Categories:', sampleFeatured.map(c => ({ name: c.name, slug: c.slug, level: c.level, isFeatured: c.isFeatured })));

    const sampleProducts = await Product.find({ status: 'active' }).limit(3).lean();
    console.log('Sample Active Products:', sampleProducts.map(p => ({ name: p.name, category: p.category, price: p.price })));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(console.error);
