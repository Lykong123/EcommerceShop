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
                if (err) {
                    console.log(err);
                } else {
                    res.render('edit_product', {
                        title: p.title,
                        errors: errors,
                        desc: p.desc,
                        categories: categories,
                        category: p.category.replace(/\s+/g, '-').toLowerCase(),
                        price: parseFloat(p.price).toFixed(2),
                        quantity: p.quantity,
                        instockAt: p.instockAt,
                        id: p._id
                    });
                }
            }
        });
    });
});

//post edit product by id but can't edit image of the product
router.post('/edit-product/:id', function (req, res) {
    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('desc', 'Description must have a value.').notEmpty();
    req.checkBody('price', 'Price must have a value.').isDecimal();
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var quantity = req.body.quantity;
    var instockAt = req.body.instockAt;
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
                console.log(p);
                req.flash('danger', 'Product title exists, choose another.');
                res.redirect('edit-product' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    console.log(id);    
                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    p.instockAt = instockAt;
                    p.quantity = quantity;
                   
                    p.save(function (err) {
                        if (err)
                            console.log(err); 
                
                        req.flash('success', 'Product edited!');
                        res.redirect('/admin/products');
                    });

                });
            }
        });
    }

});

// Exports
module.exports = router;