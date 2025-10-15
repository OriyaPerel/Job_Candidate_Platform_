import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import UserRoutes from './routes/Users.js';
import AuthRoutes from './routes/auth.js';
import JobRoutes from './routes/jobs.js'; 
import './passport.js';

dotenv.config();

const PORT = process.env.PORT || 5001;
const CLIENT = process.env.CLIENT_URL || 'http://localhost:3002';

const app = express();

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(express.json());
app.use(cors({
  origin: CLIENT,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));


app.use((req, _res, next) => {
  console.log(req.method, req.path);
  next();
});

// Routes
app.use('/api/users', UserRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api', JobRoutes);





mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Mongo connected');
    app.listen(PORT, () => {
      console.log('listening on', PORT);
    });
  })
  .catch(err => {
    console.error('Mongo connect error:', err.message);
    // אם את רוצה לבדוק את הראוטים גם בלי DB, אפשר זמנית להאזין בכל זאת:
    // app.listen(PORT, () => console.log('listening on', PORT, '(without DB)'));
  });
