const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
    passport.use(new LocalStrategy( async (username, password, done) => {
        const user = await User.findOne({username: username});

        if (!user) {
            return done(null, false, {message: `User doesn't exist.`});
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.log(err);
            }

            if (isMatch) {
                return done(null, user);
            }
            else {
                return done(null, false, {message: "Incorrect password."});
            }
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
    });
}
