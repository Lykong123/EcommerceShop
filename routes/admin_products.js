var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var auth = require('../config/auth');
var isAdmin = auth.isAdmin;

// Get Product model
var Product = require('../models/product');

// Get Category model
var Category = require('../models/category');

//get product index
router.get('/', function (req, res) {
    var count;
    Product.count(function (err, c) {
        count = c;
    });
    Product.find(function (err, products) {
        res.render('products', {
            products: products,
            count: count
        });
    });
});

//get add product
router.get('/add-product', function (req, res) {
    var title = "";
    var desc = "";
    var price = "";
    var instockAt = "";
    var quantity = "";
    Category.find(function (err, categories) {
        res.render('add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price,
            instockAt: instockAt,
            quantity: quantity
        });
    });
});


 //post add product
router.post('/add-product', function (req, res) {
    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('instockAt', 'Must fill in stock at').notEmpty();
    req.checkBody('quantity', 'Must input total quantity of each product').notEmpty();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);
    
    var category = req.body.category;
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var quantity = req.body.quantity;
    var desc = req.body.desc;
    var instockAt = req.body.instockAt;
    var price = req.body.price;

    //var title = req.body.title;
    //var slug = title.replace(/\s+/g, '-').toLowerCase();
    //var desc = req.body.desc;
   // var price = req.body.price;
    //var category = req.body.category;
    //var instockAt = req.body.instockAt;
   // var quantity = req.body.quantity;

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price,
                instockAt: instockAt,
                quantity: quantity
            });
        });
    } else {
        Product.findOne({slug: slug}, function (err, product) {
            if (product) {
                req.flash('danger', 'Product title exists, choose another.');
                Category.find(function (err, categories) {
                    res.render('add_product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price,
                        instockAt: instockAt,
                        quantity: quantity
                    });
                });
            } else {
                var price2 = parseFloat(price).toFixed(2);
                var product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile,
                    instockAt: instockAt,
                    quantity: quantity
                });

                product.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/product_images/' + product._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var productImage = req.files.image;
                        var path = 'public/product_images/' + product._id + '/' + imageFile;

                        productImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }
                    req.flash('success', 'Product added!');
                    res.redirect('/admin/products');
                });
            }
        });
    }
});

//get edit product
router.get('/edit-product/:id', function (req, res) {
    var errors;
    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;
    Category.find(function (err, categories) {
        Product.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('products');
            } else {
                var galleryDir = 'public/product_images/' + p._id + '/gallery';
                var galleryImages = null;
                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;
                        res.render('edit_product', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price).toFixed(2),
                            quantity: parseInt(p.quantity).toFixed(2),
                            instockAt: p.instockAt,
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });
    });
});

//post edit product
router.post('/edit-product/:id', function (req, res) {
    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    req.checkBody('image', 'You must upload an image').isImage(imageFile);
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var quantity = req.body.quantity;
    var instockAt = req.body.instockAt;
    var pimage = req.body.pimage;
    var id = req.params.id;
    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('edit-product' + id);
    } else {
        Product.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'Product title exists, choose another.');
                res.redirect('edit-product' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    p.instockAt = instockAt;
                    p.quantity = quantity;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }
                    p.save(function (err) {
                        if (err)
                            console.log(err);
                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/product_images/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });
                        }
                        req.flash('success', 'Product edited!');
                        res.redirect('/admin/products/edit-product/' + id);
                    });

                });
            }
        });
    }

});

//post product gallery
router.post('/product-gallery/:id', function (req, res) {
    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);
});

//get delete image
router.get('/delete-image/:image', isAdmin, function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Image deleted!');
                    res.redirect('products');
                }
            });
        }
    });
});

/*
 * GET delete product
 */
router.get('/delete-product/:id', function (req, res) {

    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, function (err) {
                console.log(err);
            });
            
            req.flash('success', 'Product deleted!');
            res.redirect('products');
        }
    });

});

// Exports
module.exports = router;
