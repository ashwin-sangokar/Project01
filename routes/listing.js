const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const {listingSchema} = require("../schema.js");
const {isLoggedIn} = require("../middleware.js");

const validateListing = (req, res, next) => {
    let {error} = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else {
        next();
    }    
};

//index route
router.get("/", wrapAsync(async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listing/index.ejs", {allListings});
}));

//new route
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listing/new.ejs");
});

//show route
router.get("/:id", wrapAsync(async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews").populate("owner");
    if (!listing) {
        req.flash("error", "Listing not found!");
        res.redirect("/listings");
    }
    res.render("listing/show.ejs",{listing});
}));

//create route
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res, next) => {
        /*    
        if (!req.body.listing) {
            throw new ExpressError(400, "Send valid data for listing");
        }
        let result = listingSchema.validate(req.body);
        console.log(result);
        */
        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        await newListing.save();
        req.flash("success", "New Listing created!");
        res.redirect("/listings");
}));

//edit route
router.get("/:id/edit", isLoggedIn, wrapAsync(async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found!");
        res.redirect("/listings");
    }
    res.render("listing/edit.ejs",{listing});
}));

//update route
router.put("/:id", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing}); 
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);  
}));

//delete route
router.delete("/:id", isLoggedIn, wrapAsync(async(req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
}));

module.exports = router;