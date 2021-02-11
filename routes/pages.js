var express = require('express');
var router = express.Router();

//get page model
var Page = require('../models/page');

//get home page

//get a page
//create slug to render all related page
//router.get('/:slug', function(req, res){
  //  var slug = req.params.slug;

    //Page.findOne({slug: slug}, function(err, page){
    //    if(err)
        //    console.log(err);
      //  if(!page){
          //  res.redirect('/');
        //}else{
          //  res.render('index', {
            //    title: page.title,
              //  content: page.content 
            //})
        //}   
    //})
//})

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