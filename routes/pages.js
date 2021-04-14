const express = require('express');
const router = express.Router();

const Page = require('../models/Page');

router.get('/', async (req, res) => {

    const page = await Page.findOne({slug: 'home'});
    res.render('index', {title: "Home Page", page});
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