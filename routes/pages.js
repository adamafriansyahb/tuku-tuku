const express = require('express');
const router = express.Router();

const Page = require('../models/Page');
const Category = require('../models/Category');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
    const page = await Page.findOne({slug: 'home'});
    const categories = await Category.find();
    const products = await Product.find().limit(12);
    res.render('index', {title: "Home", page, categories, products});
});

router.get('/:slug', async (req, res) => {
    const page = await Page.findOne({slug: req.params.slug});
    if (!page) {
        res.redirect('/');
    } 
    else {
        res.render('index', {title: page.title, page});
    }
});

module.exports = router;