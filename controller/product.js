const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }
      
        // const imagesLinks = [];
      
        // for (let i = 0; i < images.length; i++) {
        //   const result = await cloudinary.v2.uploader.upload(images[i], {
        //     folder: "products",
        //   });
      
        //   imagesLinks.push({
        //     public_id: result.public_id,
        //     url: result.secure_url,
        //   });
        // }
      
        const productData = req.body;
        productData.images = images;
        productData.shop = shop;

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);


// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {

    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const products = await Product.find({ shopId: req.params.id }).skip(skip).limit(parseInt(limit));
      const totalCount = await Product.countDocuments();

      res.status(201).json({
        success: true,
        products,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      // console.log(product);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }    

      // for (let i = 0; 1 < product.images.length; i++) {
      //   const result = await cloudinary.v2.uploader.destroy(
      //     product.images[i].public_id
      //   );
      // }
    
      // await product.remove();

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      const products = await Product.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));;
      const totalCount = await Product.countDocuments();

      res.status(201).json({
        success: true,
        products,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);


// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


//GetByIDProducts
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      // console.log(product);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      res.status(201).json({
        success: true,
        message: "Product Get successfully!",
        product
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

//GetByCategory
router.get(
  "/get-category/:name",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      const product = await Product.find({ category: req.params.name }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));;
      const totalCount = await Product.countDocuments();
;
      // console.log(product);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      res.status(201).json({
        success: true,
        message: "Product Get successfully!",
        product, currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);



router.get(
  "/search-category",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search } = req.query; // Added "search" parameter to handle search by description
      const skip = (page - 1) * limit;
      let query={}

      // Construct the query object to handle both category and description search
      // const query = { category: req.params.name }
      if (search) {
        query["$or"] = [
          { description: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } }, // Search by description using regex and case-insensitive
          { tags: { $regex: search, $options: "i" } }, // Search by description using regex and case-insensitive
          // Add more search conditions here if needed
        ];
      }

      const product = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalCount = await Product.countDocuments(query);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }

      res.status(201).json({
        success: true,
        message: "Product Get successfully!",
        product,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);



module.exports = router;
