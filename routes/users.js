const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const {check, validationResult} = require('express-validator');

router.get('/register', (req, res) => {
    res.render('auth/register', {title: "Register"});
});

router.post('/register', async (req, res) => {
    const {name, email, username, password1, password2} = req.body;

    await check('name', 'Name is required.').notEmpty().run(req);
    await check('email', 'Email is required.').notEmpty().run(req);
    await check('email', 'Email must be in correct format.').isEmail().run(req);
    await check('username', 'Username is required.').notEmpty().run(req);
    await check('password1', 'Password is required.').notEmpty().run(req);
    await check('password1', 'Password must be at least 6 characters long.').isLength({min: 6}).run(req);
    await check('password2', 'Confirm password is required.').notEmpty().run(req);
    await check('password2', 'Passwords do not match.').equals(password1).run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('ada error gan..');
        console.log(errors);
        res.render('auth/register', {errors: errors.array(), title: "Register"});
    } 
    else {
        try {
            const user = await User.findOne({username: username});
            if (user) {
                req.flash('danger', 'Username is already used.');
                res.redirect('/');
            }
            else {
                const newUser = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password1,
                    admin: 1
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, async (err, hash) => {
                        if (err) console.log(err);
                        
                        newUser.password = hash;
                        await newUser.save();

                        req.flash('success', 'You have successfully registered.');
                        res.redirect('/users/login');
                    });
                })
            }
        }
        catch(err) {
            console.log(err);
            req.flash('danger', err.message);
            res.redirect('/');
        }
    }
});

router.get('/login', (req, res) => {
    res.render('auth/login', {title: "Login"});
});

module.exports = router;