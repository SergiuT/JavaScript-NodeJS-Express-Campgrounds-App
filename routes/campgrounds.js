var express=require("express");
var router=express.Router();
var Campground=require("../models/campground");
var middleware=require("../middleware");
var Review = require("../models/review");
var Comment = require("../models/comment");

//=================
//CAMPGROUND ROUTES
//=================

//INDEX - SHOW ALL CAMPGROUNDS
router.get("/", function (req, res) {
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
        Campground.count().exec(function (err, count) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {
                    campgrounds: allCampgrounds,
                    current: pageNumber,
                    pages: Math.ceil(count / perPage)
                });
            }
        });
    });
});
//CREATE - ADD NEW CAMPGROUND TO DB
router.post("/", middleware.isLoggedIn,function(req,res){
    var name=req.body.name;
    var image=req.body.image;
    var price=req.body.price;
    var description=req.body.description;
    var author={
        id:req.user._id,
        username: req.user.username
    }
    var newcampground={name:name, image:image, description:description, price:price, author: author};
    //Create a new campground and save to DB
    Campground.create(newcampground, function(err,newcreated){
        if(err){
            console.log(err);
        }else{
            //redirect back to campgrounds page
            res.redirect("/campgrounds");

        }
    });
});
//NEW - SHOW FORM TO CREATE CAMPGROUND
router.get('/new', middleware.isLoggedIn, function(req, res) {
   res.render("campgrounds/new"); 
});

//SHOW
router.get("/:id", function(req, res) {
    //Find campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function (err, foundCampground) {
        if (err) {
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampground, function(req, res) {
      Campground.findById(req.params.id, function(err,foundcampground){
          if(err){
              req.flash("error", "Campground not found!");
          }
            res.render("campgrounds/edit", {campground: foundcampground});
      });
});

//UPDATE CAMPGROUND ROUTE

router.put("/:id", middleware.checkCampground, function(req,res){
    delete req.body.campground.rating;
    //find and update curent campground
    Campground.findByIdAndUpdate(req.params.id,req.body.campground, function(err,updatedcampground){
        if(err){
            
            res.redirect("/campgrounds");
        }else{
            req.flash("succes", "Successfully Updated!");
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
    //redirect somewhere

});

//DESTROY CAMPGROUND
router.delete("/:id", middleware.checkCampground, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            // deletes all comments associated with the campground
            Comment.remove({"_id": {$in: campground.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/campgrounds");
                }
                // deletes all reviews associated with the campground
                Review.remove({"_id": {$in: campground.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/campgrounds");
                    }
                    //  delete the campground
                    campground.remove();
                    req.flash("success", "Campground deleted successfully!");
                    res.redirect("/campgrounds");
                });
            });
        }
    });
});

module.exports=router;