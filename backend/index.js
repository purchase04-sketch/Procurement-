require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ── API Routes ── */
app.use('/api', apiRoutes);

/* ── Serve React build in production ── */
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html')));
}

/* ── Start server immediately ── */
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

/* ── MongoDB — connect with extended timeouts and disabled buffering ── */
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000, // Reduced from 30s to fail faster if disconnected
  socketTimeoutMS: 45000,
  connectTimeoutMS: 15000,
  bufferCommands: false, // CRITICAL FIX: Disable buffering so it fails immediately instead of timing out after 10000ms
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server running without database — uploads will fail instantly until MongoDB connects');
  });
