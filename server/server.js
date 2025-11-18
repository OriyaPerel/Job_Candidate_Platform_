import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import UserRoutes from './routes/Users.js';
import AuthRoutes from './routes/auth.js';
import JobRoutes from './routes/jobs.js';
import aiRoute from './AI/aiRoute.js';
import ApplicationRoutes from './routes/application.js';
import './passport.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const CLIENT = process.env.CLIENT_URL || 'http://localhost:3002';

const app = express();

// ✅ קודם כל CORS לפני כל דבר אחר
const corsOptions = {
  origin: CLIENT,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // תמיכה ב־preflight של CORS

// ✅ אחרי CORS - נפרש את ה־JSON
app.use(express.json());

// ✅ הדפסת כל בקשה ללוג (לא חובה, רק לדיבוג)
app.use((req, _res, next) => {
  console.log(req.method, req.path);
  next();
});

// ✅ ראוט בדיקה (לא חובה, רק לוודא שהשרת רץ)
app.get('/health', (_req, res) => res.json({ ok: true }));

// ✅ Routes עיקריים
app.use('/api/users', UserRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api', JobRoutes);
app.use('/api', ApplicationRoutes);
app.use('/api/ai', aiRoute);


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' Mongo connected');
    app.listen(PORT, () => {
      console.log(` Server listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error(' Mongo connect error:', err.message);
  });
