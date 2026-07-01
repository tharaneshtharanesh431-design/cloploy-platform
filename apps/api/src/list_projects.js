import mongoose from 'mongoose';

async function main() {
  const uri = 'mongodb://127.0.0.1:27018/cloploy';
  await mongoose.connect(uri);
  
  const adminDb = mongoose.connection.db.admin();
  const dbs = await adminDb.listDatabases();
  console.log('DATABASES ON 27018:', JSON.stringify(dbs, null, 2));

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('COLLECTIONS ON CLOPLOY DB:', collections.map(c => c.name));
  
  const projects = await mongoose.connection.db.collection('projects').find({}).toArray();
  console.log('PROJECTS IN CLOPLOY DB:');
  console.log(JSON.stringify(projects, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
