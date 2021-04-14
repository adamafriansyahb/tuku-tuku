if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const path = require('path');
const app = express();

// File upload handler
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// Method override
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.set('view engine', 'ejs');

// Global error variable
app.locals.errors = null;

// Session
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));

// Express Messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Passport
const passport = require('passport');
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// Database 
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', (error) => {
    console.log(error);
});
db.once('open', () => {
    console.log('Connected to database.');
});

// Pages
const Page = require('./models/Page');
Page.find({}).sort({sorting: 1}).exec((err, pages) => {
    if (err) {
        console.log(err);
    }
    else {
        app.locals.pages = pages;
    }
});

// Categories
const Category = require('./models/Category');
Category.find((err, categories) => {
    if (err) {
        console.log(err);
    }
    else {
        app.locals.categories = categories;
    }
});

// Cart Session
app.get("*", (req, res, next) => {
    res.locals.cart = req.session.cart;
    next();
});

// Routes
const cartRoute = require('./routes/cart');
const pagesRoute = require('./routes/pages');
const productsRoute = require('./routes/products');
const userRoute = require('./routes/users');
const adminPagesRoute = require('./routes/adminPages');
const adminCategoriesRoute = require('./routes/adminCategories');
const adminProductsRoute = require('./routes/adminProducts');

app.use('/admin/pages', adminPagesRoute);
app.use('/admin/categories', adminCategoriesRoute);
app.use('/admin/products', adminProductsRoute);
app.use('/products', productsRoute);
app.use('/cart', cartRoute);
app.use('/users', userRoute);
app.use('/', pagesRoute);

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running...');
});