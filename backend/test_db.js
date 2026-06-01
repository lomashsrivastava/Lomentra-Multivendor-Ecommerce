const mongoose = require('mongoose');
const dns = require('dns');

try {
  const servers = dns.getServers();
  // If we only have local/loopback DNS, add public DNS servers as fallbacks for SRV lookups
  if (servers.includes('127.0.0.1') || servers.length === 0) {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...servers]);
  }
} catch (e) {
  // Ignore DNS config errors
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi_vendor_ecommerce';

async function main() {
  console.log('Connecting to:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // redact credentials in console logs
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB!');
  
  const CategorySchema = new mongoose.Schema({}, { strict: false, collection: 'categories' });
  const Category = mongoose.model('Category', CategorySchema);

  try {
    const cat = await Category.findOne({ slug: 'electronics-audio-headphones' }).lean();
    console.log('Category electronics-audio-headphones:', cat);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(console.error);
