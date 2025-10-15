// server/passport.js
import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from './models/UserModel.js';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

// בדיקת sanity שימושית:
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('Missing Google OAuth envs:', { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL });
  // עדיף לא לזרוק פה כדי לראות את הלוג, אבל אפשר גם:
  // throw new Error('Missing Google OAuth envs');
}

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const fullName = profile.displayName;

      let user = await User.findOne({ googleId });
      if (!user && email) user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          fullName: fullName || 'Google User',
          role: 'candidate',
          email,
          googleId
        });
      } else if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const u = await User.findById(id);
    done(null, u);
  } catch (e) {
    done(e);
  }
});
