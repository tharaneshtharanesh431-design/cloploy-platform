import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from '../config/env.js';
import User from '../models/User.js';

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ['user:email', 'repo', 'workflow', 'admin:repo_hook']
      },
      async (_accessToken, _refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value || `${profile.username}@users.noreply.github.com`;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email,
            githubId: profile.id,
            githubUsername: profile.username,
            githubAccessToken: _accessToken,
            isEmailVerified: true
          });
        } else {
          user.githubId = profile.id;
          user.githubUsername = profile.username;
          user.githubAccessToken = _accessToken;
          await user.save();
        }
        return done(null, user);
      }
    )
  );
}
