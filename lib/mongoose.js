// lib/mongoose.js
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://rrpb3:System64@cluster0.cpec0.mongodb.net/?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      //useNewUrlParser: true,
      //useUnifiedTopology: true,    
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
}

export default connectDB;
