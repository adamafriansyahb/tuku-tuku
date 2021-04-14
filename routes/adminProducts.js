const express = require('express');
const router = express.Router();

const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const resizeImg = require('resize-img');

const Product = require('../models/Product');
const Category = require('../models/Category');
const { check, validationResult } = require('express-validator');

const correctExt = (image) => {
    const extensions = ['jpeg', 'jpg', 'png'];
    if (image !== '') {
        const imgExt = image.split('.')[1];
        
        if (!(extensions.includes(imgExt))) {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
} 

router.get('/', async (req, res) => {
    const productCount = await Product.count();
    const products = await Product.find();
    res.render('admin/products/main', {products, productCount});
});

router.get('/add', async (req, res) => {
    const categories = await Category.find();
    const title = "";
    const price = "";
    const description = "";

    res.render('admin/products/add', {categories, title, price, description});
});

router.post('/add', async (req, res) => {
    await check('title', 'Title must not be empty.').notEmpty().run(req);
    await check('description', 'Description must not be empty.').notEmpty().run(req);
    await check('price', 'Price must not be empty.').isDecimal().run(req);
    
    const image = req.files !== null ? req.files.image.name : '';
    
    const {title, price, description, category} = req.body;
    const slug = title.replace('/\s+/g', '-').toLowerCase();  
  
    const checkExt = correctExt(image);

    const categories = await Category.find();

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (checkExt == false) {
            req.flash('warning', 'File extension must be .jpg, .jpeg or .png');
            res.render('admin/products/add', {errors: errors.array(), title, price, description, categories});
        }
        else {
            res.render('admin/products/add', {errors: errors.array(), title, slug, price, description, categories});
        }
    } 
    else {
        try {
            if (checkExt == false) {
                req.flash('warning', 'File extension must be .jpg, .jpeg or .png');
                res.render('admin/products/add', {title, price, description, categories});
            }
            else {
                const prevProduct = await Product.findOne({slug: slug});
                if (prevProduct) {
                    req.flash('danger', 'Product already exists. Choose another.');
                    res.redirect('/admin/products');
                } 
                else {
                    const priceFloat = parseFloat(price).toFixed(2);
                    const product = new Product({
                        title: title,
                        slug: slug,
                        description: description,
                        category: category,
                        price: priceFloat,
                        image: image
                    });
    
                    await product.save();
    
                    const path = mkdirp.sync(`public/img/products/${product._id}`);
                    const gallery = mkdirp(`public/img/products/${product._id}/gallery`);
                    const thumbs = mkdirp(`public/img/products/${product._id}/gallery/thumbs`);
    
                    if (image != "") {
                        const productImage = req.files.image;
                        const imgPath = `${path}/${image}`;
                        productImage.mv(imgPath, (err) => {
                            return console.log(err);
                        });
                    }
    
                    req.flash('success', 'Products added.');
                    res.redirect('/admin/products');``
                }
            }
        }
        catch (err) {
            console.log(err);
            res.redirect('/admin/products');
        }
    }

});

router.get('/edit/:id', async (req, res) => {
    let errors;
    if (req.sessions) errors = req.session.errors;
    req.session.errors = null;

    try {
        const categories = await Category.find();
        const product = await Product.findById(req.params.id);

        const galleryPath = `public/img/products/${product.id}/gallery`;
        let galleryImages = null;

        fs.readdir(galleryPath, (err, files) => {
            if (err) {
                console.log(err);
            } else {
                galleryImages = files;
                
                res.render('admin/products/edit', {
                    errors,
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    category: product.category.replace('/\s+/g', '-').toLowerCase(),
                    categories,
                    price: parseFloat(product.price).toFixed(2),
                    image: product.image,
                    galleryImages
                });
            }
        }); 
    }
    catch(err) {
        console.log(err);
        res.redirect('/admin/products');
    }
});

router.put('/:id', async (req, res) => {
    await check('title', 'Title must not be empty.').notEmpty().run(req);
    await check('description', 'Description must not be empty.').notEmpty().run(req);
    await check('price', 'Price must not be empty.').isDecimal().run(req);
    
    const image = req.files !== null ? req.files.image.name : '';

    const id = req.params.id;
    const {title, price, description, category, pimage} = req.body;
    const slug = title.replace('/\s+/g', '-').toLowerCase();  

    const checkExt = correctExt(image);
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors;
        if (checkExt == false) {
            req.flash('warning', 'File extension must be .jpg, .jpeg or .png');
            res.redirect(`/admin/products/edit/${id}`);
        }
        else {
            res.redirect(`/admin/products`);
        }
        console.log(errors);
    }
    else {
        try {
            if (checkExt == false) {
                req.flash('warning', 'File extension must be .jpg, .jpeg or .png');
                res.redirect(`/admin/products/edit/${id}`);
            } 
        
            const prevProduct = await Product.findOne({slug: slug, _id: {'$ne': id}});
            if (prevProduct) {
                req.flash('danger', 'Product already exists.');
                res.redirect(`/admin/products/edit/${id}`);
                console.log(prevProduct)
            } 
            else {
                const product = await Product.findById(id);
                product.title = title;
                product.slug = slug;
                product.description = description;
                product.price = price;
                product.category = category;
    
                console.log(product);
    
                if (image !== '') {
                    product.image = image
                }
    
                await product.save();
    
                if (image !== '') {
                    if (pimage !== '') {
                        fs.remove(`public/img/products/${id}/${pimage}`);
                    }
    
                    const productImage = req.files.image;
                    const path = `public/img/products/${id}/${image}`;
                    productImage.mv(path, (err) => {
                        return console.log(err);
                    });
                } 
                
                req.flash('success', 'Product edited.');
                res.redirect('/admin/products');
            }
        }
        catch(err) {
            console.log(err);
            req.flash('danger', err.message);
            res.redirect('/admin/pages');
        }
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id

        const product = await Product.findById(id);
        await product.remove();

        const path = `public/img/products/${id}`;
        fs.remove(path, (err) => {
            if (err) {
                console.log(err);
                req.flash('danger', err.message);
                res.redirect('/admin/products');
            }
            else {
                req.flash('success', 'Product deleted.');
                res.redirect('/admin/products');
            }
        });
    }
    catch(err) {
        console.log(err);
        req.flash('danger', err.message);
        res.redirect('/admin/products');
    }
});

router.post('/gallery/:id', (req, res) => {
    const id = req.params.id;
    const productImages = req.files.file;
    const productImgName = req.files.file.name;

    console.log(id);
    console.log(productImages);
    console.log(productImgName);

    const path = `public/img/products/${id}/gallery/${productImgName}`;
    const thumbsPath = `public/img/products/${id}/gallery/thumbs/${productImgName}`;

    productImages.mv(path, (err) => {
        if (err) {
            console.log(err);
        }

        resizeImg(fs.readFileSync(path), {width: 100, height: 100})
            .then((buf) => {
                fs.writeFileSync(thumbsPath, buf);
            })
    });

    res.sendStatus(200);
});

// Delete images in gallery 
router.delete('/gallery/:image', (req, res) => {
    const productId = req.query.id;
    const image = req.params.image;

    const originalImage = `public/img/products/${productId}/gallery/${image}`;
    const thumbImage = `public/img/products/${productId}/gallery/thumbs/${image}`;

    fs.remove(originalImage, (err) => {
        if (err) {
            console.log(err);
            req.flash('danger', err.message);
            res.redirect(`/admin/products/edit/${productId}`);
        } 
        else {
            fs.remove(thumbImage, (err) => {
                if (err) {
                    console.log(err);
                    req.flash('danger', err.message);
                    res.redirect(`/admin/products/edit/${productId}`);
                }
                else {
                    req.flash('success', 'Image deleted.');
                    res.redirect(`/admin/products/edit/${productId}`);
                }
            });
        }
    });
});

module.exports = router;