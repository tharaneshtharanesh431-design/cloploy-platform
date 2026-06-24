import mongoose from 'mongoose';

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/cloploy';
  await mongoose.connect(uri);
  
  const projects = await mongoose.connection.db.collection('projects').find({}).toArray();
  console.log('PROJECTS IN CLOPLOY:');
  console.log(JSON.stringify(projects, null, 2));
  
  await mongoose.disconnect();
}

main().catch(console.error);
