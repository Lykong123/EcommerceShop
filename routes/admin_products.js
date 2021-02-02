var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');

//get product model
var Product = require('../models/product');
//get category model
var Category = require('../models/category')

//get product index

router.get('/', function(req, res){
    var count;
    Product.count (function(err, c){
        count = c;
    });

    Product.find(function(err,products){
        res.render('products', {
            products: products,
            count: count
        });
    });
});

//get add product
router.get('/add-product', function(req, res){
    var title = "";
    var desc = "";
    var price = "";

    Category.find(function(err, categories){
        res.render('add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    });
});

//post add product
router.post('/add-product', function (req, res) {
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

    var errors = req.validationErrors();

    if (errors) {
        Category.find(function (err, categories) {
            res.render('add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
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
                        price: price
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
                    image: imageFile
                });
                product.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/image/' + product._id, function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var productImage = req.files.image;
                        var path = 'public/image/' + product._id + '/' + imageFile;

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

//not yet working
//get edit product

//get delete image
router.get('/delete-image/:image', function(req, res){
    var originalImage = 'public/image/' + req.query.id + req.params.image;
    var thumbImage = 'public/image'+ req.query.id+ req.params.image;
    fs.remove(originalImage, function(err){
        if(err)
            console.log(err);
        else{
            fs.remove(thumbImage, function(err){
                if(err)
                    console.log(err);
                else{
                    req.flash('success', 'Image deleted');
                    res.redirect('/admin/products/edit-product/'+req.query.id);
                }    
            });
        }    
    });
});

//get delete product
router.get('/delete-product/:id', function(req, res){
    var id = req.params.id;
    var path = 'public/image/' +id;
    fs.remove(path, function(err){
        if(err)
            console.log(err);
        else{
            Product.findByIdAndRemove(id, function(err){
                console.log(err);
            });
            req.flash('success', 'Product deleted!');
            res.redirect('products');
        }
    });
});

// Exports
module.exports = router;