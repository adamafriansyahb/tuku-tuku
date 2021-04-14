const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const Category = require('../models/Category');

router.get('/', async (req, res) => {
    const categories = await Category.find();
    res.render('admin/categories/main', {categories});
});

router.get('/add', (req, res) => {
    res.render('admin/categories/add', {title: "", slug: ""});
});

router.post('/add', async (req, res) => {
    await check('title', 'Title must not be empty.').notEmpty().run(req);
    
    const title = req.body.title;
    const slug = title.replace('/\s+/g', '-').toLowerCase();

    const errors = validationResult(req);
    console.log(errors);
    
    if (!errors.isEmpty()) {
        res.render('admin/categories/add', {errors: errors.array(), title});
    } else {
        try {
            const category = await Category.findOne({slug: slug});
            if (category) {
                req.flash('danger', 'Category already exists. Choose another.');
                res.redirect('/admin/categories');
            } else {
                const newCategory = new Category({
                    title: title,
                    slug: slug
                });

                await newCategory.save();

                const categories = await Category.find();
                req.app.locals.categories = categories;

                req.flash('success', 'Category successfully added.');
                res.redirect('/admin/categories');
            }
        }
        catch(err) {
            console.log(err.message);
            req.flash('danger', err.message);
            res.redirect('/admin/categories');
        }
    }
}); 

router.get('/edit/:id', async (req, res) => {
    const category = await Category.findById(req.params.id);
    res.render('admin/categories/edit', {category});
});

router.put('/edit/:id', async (req, res) => {
    await check('title', 'Title must not be empty.').notEmpty().run(req);
    
    const title = req.body.title;
    const slug = title.replace('/\s+/g', '-').toLowerCase();

    const errors = validationResult(req);
    // console.log(errors);
    
    if (!errors.isEmpty()) {
        res.render('admin/categories/edit', {errors: errors.array(), title});
    } else {
        try {
            const prevCategory = await Category.findOne({slug: slug, _id: {'$ne': req.params.id}});
            if (prevCategory) {
                req.flash('danger', 'Category already exists. Choose another.');
                res.render('admin/categories/edit', {title});
            } else {
                const category = await Category.findById(req.params.id);
                category.title = title;
                category.slug = slug;

                await category.save();

                const categories = await Category.find();
                req.app.locals.categories = categories;

                req.flash('success', 'Category successfully edited.');
                res.redirect('/admin/categories');
            }
        }
        catch(err) {
            console.log(err.message);
            req.flash('danger', err.message);
            res.redirect('/admin/categories');
        }
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        await category.remove();

        const categories = await Category.find();
        req.app.locals.categories = categories;

        req.flash('success', 'Category deleted.');
        res.redirect('/admin/categories');
    } 
    catch(err) {
        console.log(err);
        req.flash('danger', err.message);
        res.redirect('/admin/categories');
    }
});


module.exports = router;