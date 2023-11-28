const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

// const FacebookStrategy = require('passport-facebook').Strategy
// const FacebookStrategy  =  require('passport-facebook').Strategy


passport.serializeUser((user, done) => {
    done(null, user);
})
passport.deserializeUser(function (user, done) {
    done(null, user);
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CKEY,
    clientSecret: process.env.GOOGLE_SKEY,
    callbackURL: process.env.SERVER_URL + "/user/auth/callback",
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));
