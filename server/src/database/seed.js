const { seedDatabase } = require('./db');

const isClean = process.argv.includes('--clean');
console.log(`Seeding database (forceClean: ${isClean})...`);
seedDatabase(isClean);
console.log('Database updated with authentic railway network schedules!');
