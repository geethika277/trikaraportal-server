import mongoose from 'mongoose';
import app from './src/app.js';
import { env } from './src/config/env.js';

const PORT = env.PORT || 5000;

mongoose.connect(env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });