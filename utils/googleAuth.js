import passport from "passport";
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import userModel from "../models/userModels.js";

passport.use(
    
    new GoogleStrategy(
        {
            
            clientID: process.env.GOOGLE_CLIENT_ID, 
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
        callbackURL: '/api/auth/google/callback',
        },

        async(accessToken, refreshToken, Profiler, done)=>{
            let user= await userModel.findOne({googleId: Profiler.id});
            if(!user){
                user = await userModel.create({
                    googleId: Profiler.id,
                    name: Profiler.displayName,
                    email: Profiler.emails[0].value, 
                    fullname: {
                        firstname: Profiler.name.givenName || 'GoogleUser',
                        lastname: Profiler.name.familyName || 'Default'
                    },
                    password: await userModel.hashPassword(crypto.randomUUID()), 
                });
            }
            return done(null, user);
            
        }
    )
);

passport.serializeUser((user, done)=>{
    done(null, user.id)
});

passport.deserializeUser((id, done)=>{
    userModel.findById(id).then((u)=>{
        done(null,u)
    });
});