import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/userModels.js";
import crypto from "crypto"; 

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://drift-backend-3.onrender.com/api/auth/google/callback"
          : "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userModel.findOne({ googleId: profile.id });
        if (!user) {
          user = await userModel.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            fullname: {
              firstname: profile.name.givenName || "GoogleUser",
              lastname: profile.name.familyName || "Default",
            },
            password: await userModel.hashPassword(crypto.randomUUID()),
          });
        }
        return done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userModel.findById(id).then((u) => {
    done(null, u);
  });
});
