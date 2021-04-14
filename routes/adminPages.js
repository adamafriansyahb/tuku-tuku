const express = require('express');
const router = express.Router();

const Page = require('../models/Page');

const {check, validationResult} = require('express-validator');

router.get('/', async (req, res) => {
    try {
        const pages = await Page.find({}).sort({sorting: 1}).exec();
        res.render('admin/pages/main', {pages});
    }
    catch(err) {
        console.log(err.message);
        res.redirect('/admin/pages');
    }
});

router.get('/add', (req, res) => {
    res.render('admin/pages/addPage', {title:"", slug:"", content:""});
});

router.post('/add', async (req, res) => {
    await check('title', 'Title field is required.').notEmpty().run(req);
    await check('content', 'Content field is required.').notEmpty().run(req);
    
    const {title, content} = req.body;
    let slug;
    if (req.body.slug) {
        slug = req.body.slug.replace('/\s+/g', '-').toLowerCase();
    } else {
        slug = title.replace('/\s+/g', '-').toLowerCase();
    }

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        res.render('admin/pages/addPage', {errors: errors.array(), title, slug, content});
    } else {
        try {
            const page = await Page.findOne({slug: slug});
            if (page) {
                req.flash('danger', 'Slug already exists. Choose another.');
                res.render('admin/pages/addPage', {title, slug, content});
            } else {
                const newPage = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                });

                await newPage.save();

                const pages = await Page.find({}).sort({sorting: 1}).exec();
                req.app.locals.pages = pages;

                req.flash('success', 'Page successfully added.');
                res.redirect('/admin/pages');
            }
        }
        catch(err) {
            console.log(err.message);
            req.flash('danger', err.message);
            res.redirect('/admin/pages');
        }
    }
});

router.get('/edit/:id', async (req, res) => {
    try  {
        const page = await Page.findById(req.params.id);
        res.render('admin/pages/editPage', {
            id: page.id,
            title: page.title,
            slug: page.slug,
            content: page.content
        });
    }
    catch(err) {
        console.log(err.message);
        res.redirect('/admin/pages');
    }
});

router.put('/:id', async (req, res) => {
    await check('title', 'Title field is required.').notEmpty().run(req);
    await check('content', 'Content field is required.').notEmpty().run(req);
    
    const title = req.body.title;
    let slug;
    if (req.body.slug) {
        slug = req.body.slug.replace('/\s+/g', '-').toLowerCase();
    } else {
        slug = title.replace('/\s+/g', '-').toLowerCase();
    }
    const content = req.body.content;

    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        res.render('admin/pages/editPage', {errors: errors.array(), title, slug, content});
    } else {
        let page;
        try {
            page = await Page.findOne({slug: slug, _id: {'$ne': req.params.id}});
            if (page) {
                req.flash('danger', 'Slug already exists. Choose another.');
                res.render(`admin/pages/editPage`, {id: req.params.id, title, slug, content});
                console.log(page);
            } else {
                page = await Page.findById(req.params.id);
                page.title = title;
                page.slug = slug;
                page.content = content; 

                await page.save();

                const pages = await Page.find({}).sort({sorting: 1}).exec();
                req.app.locals.pages = pages;

                req.flash('success', 'Page successfully edited.');
                res.redirect('/admin/pages');
            }
        }
        catch(err) {
            console.log(err.message);
            req.flash('danger', err.message);
            res.redirect('/admin/pages');
        }
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const page = await Page.findById(req.params.id);
        await page.remove();

        const pages = await Page.find({}).sort({sorting: 1}).exec();
        req.app.locals.pages = pages;
        
        req.flash('success', 'Page has been deleted.');
        res.redirect('/admin/pages');
    }
    catch(err) {
        console.log(err)
        req.flash('danger', err.message);
        res.redirect('/admin/pages');
    }
});

router.post('/reorder-page', (req, res) => {
    const ids = req.body['id'];

    sortPages(ids, async () => {
        const pages = await Page.find({}).sort({sorting: 1}).exec();
        req.app.locals.pages = pages;
    });
});

const sortPages = (ids, callback) => {
    let count = 0;

    for (let i=0; i<ids.length; i++) {
        const id = ids[i];
        count++;

        (async (count) => {
            try {
                const page = await Page.findById(id);
                page.sorting = count;
                await page.save()
                ++count;
                if (count >= ids.length) {
                    callback();
                }
            }
            catch(err) {
                console.log(err.message);
            }
        })(count);
    }
}

module.exports = router;