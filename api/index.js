import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

// Initialize DB connection for serverless environment
let isConnected = false;

if (!isConnected) {
  connectDB().then(() => {
    isConnected = true;
  }).catch(console.error);
}

export default app;
