import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import 'dotenv/config';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback', // Must match Google Console
      proxy: true // Trust proxy from Render/Heroku
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user); // User found, log them in
        }

        // 2. If not, check if email exists (e.g., they signed up with email first)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Email exists, link the Google ID
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // 3. If user and email don't exist, create new user
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          // No password needed for Google OAuth
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// We are using JWT, so we don't need to serialize/deserialize
// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(err, user)));