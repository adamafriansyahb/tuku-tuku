const express = require('express');
const router = express.Router();

const fs = require('fs-extra');

const Category = require('../models/Category');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
    const products = await Product.find();
    res.render('products', {title: 'Products', products});
});

router.get('/:category', async (req, res) => {
    const categorySlug = req.params.category;
    const category = await Category.findOne({slug: categorySlug});
    const products = await Product.find({category: categorySlug});

    res.render('productsByCategory', {title: category.title, products});
});

router.get('/:category/:product', async (req, res) => {
    let galleryImages = null;
    const product = await Product.findOne({slug: req.params.product});

    const galleryDir = `public/img/products/${product._id}/gallery`;
    fs.readdir(galleryDir, (err, files) => {
        if (err) {
            console.log(err);
        }
        else {
            galleryImages = files;
            res.render('productDetail', {title: product.title, product, galleryImages});
        }
    });

});

module.exports = router;