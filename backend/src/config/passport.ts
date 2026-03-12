import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { UserModel } from '../models/User';
import { bootstrapVault } from '../services/vault.service';
import { env } from './env';

export const configurePassport = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL:  env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email found in Google profile'));

          let user = await UserModel.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (user) {
            // Link Google to existing email-registered account
            if (!user.googleId) {
              user.googleId = profile.id;
              user.isEmailVerified = true;
              await user.save();
            }
            return done(null, user);
          }

          // Brand new user via Google
          user = await UserModel.create({
            email,
            googleId:        profile.id,
            displayName:     profile.displayName,
            avatar:          profile.photos?.[0]?.value,
            isEmailVerified: true,
            authProvider:    'google',
          });

          await bootstrapVault(user._id.toString());
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // We use JWT (stateless) so sessions aren't needed.
  // Passport still requires these stubs when passport.initialize() is called.
  passport.serializeUser((user: any, done) => done(null, user._id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UserModel.findById(id).select('-password -refreshTokens');
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
