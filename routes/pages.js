var express = require('express');
var router = express.Router();

//get page model
var Page = require('../models/page');

//get about page
router.get('/about', function(req, res){
    res.render('about', {
        title: 'About Us'
    })       
})

//get contact us page
router.get('/contact', function(req, res){
    res.render('contact', {
        title: 'Contact Us'
    })
})

//get help page
router.get('/help', function(req, res){
    res.render('help', {
        title: 'Help'
    })
})

//exports
module.exports = router;