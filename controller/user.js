const express = require("express");
const User = require("../model/user");
const router = express.Router();
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const fs = require("fs");



const from = "+16696006254"
const sendSMS = async (to, from, otp) => {
  await client.messages
    .create({
      body: otp,
      from: from,
      to: to
    })
    .then(message => {

      return message
    });
}




// create activation token
// const createActivationToken = (user) => {
//   return jwt.sign(user, process.env.ACTIVATION_SECRET, {
//     expiresIn: "5m",
//   });
// };

// activate user-----------no
// router.post(
//   "/activation",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { activation_token } = req.body;

//       const newUser = jwt.verify(
//         activation_token,
//         process.env.ACTIVATION_SECRET
//       );

//       if (!newUser) {
//         return next(new ErrorHandler("Invalid token", 400));
//       }
//       const { name, email, password, avatar, otp } = newUser;

//       let user = await User.findOne({ email });

//       if (user) {
//         return next(new ErrorHandler("User already exists", 400));
//       }
//       user = await User.create({
//         name,
//         email,
//         avatar,
//         password,
//         otp
//       });

//       sendToken(user, 201, res);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 400));
//     }
//   })
// );

// login user ------need fix
// router.post(
//   "/login-user",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email, password } = req.body;

//       if (!email || !password) {
//         return next(new ErrorHandler("Please provide the all fields!", 400));
//       }

//       const user = await User.findOne({ email }).select("+password");

//       if (!user) {
//         return next(new ErrorHandler("User doesn't exists!", 400));
//       }

//       const isPasswordValid = await user.comparePassword(password);

//       if (!isPasswordValid) {
//         return next(
//           new ErrorHandler("Please provide the correct information", 400)
//         );
//       }

//       sendToken(user, 201, res);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);



// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar

router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const existsUser = await User.findById(req.user.id);
      if (req.body.avatar !== "") {
        const imageId = existsUser.avatar;
        const imagePath = "public/" + imageId; // Replace with the correct file path

        try {
          fs.unlinkSync(imagePath);
          console.log("File removed successfully");
        } catch (err) {
          console.error("Error while removing file:", err);
        }

        existsUser.avatar = req.body.avatar;
      }

      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user.id;
      const addressId = req.params.id;

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }

      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      // const imageId = user.avatar.public_id;

      // await cloudinary.v2.uploader.destroy(imageId);

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);



router.post(
  "/create-admin",
  catchAsyncErrors(async (req, res, next) => {
    try {
      // const { rol } = req.body;

      // const newUser = jwt.verify(
      //   activation_token,
      //   process.env.ACTIVATION_SECRET
      // );

      const { name, email, password, avatar, role, otp } = req.body;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
        role,
        otp
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


const Otp = require('../model/otp')


//!signby phone number and mail
// router.post("/registerotp", async (req, res) => {
//   try {
//     const { userdata } = req.body;
//     let oldUser;

//     // Generate OTP
//     const otpGenerated = Math.floor(100000 + Math.random() * 900000);
//     console.log(otpGenerated);
//     const currentDate = new Date();

//     // Add 10 minutes to the current date and time
//     const tenMinutesLater = new Date(currentDate.getTime() + 10 * 60 * 1000); // 10 minutes in milliseconds

//     if (userdata.includes("@")) {
//       // Sign up by email
//       oldUser = await Otp.create(
//         { userdata, otp: otpGenerated, expiry: tenMinutesLater }
//       );

//       await sendMail({
//         email: userdata,
//         subject: "Activate your account",
//         message: `Hello ${userdata}, please to Here is your OTP!: ${otpGenerated}`,
//       });

//       return res.status(201).json({
//         success: true,
//         message: `Please check your email at ${userdata} to Here is your OTP!`,
//         user: oldUser, // Include the user details here
//         otp: otpGenerated

//       });
//     } else {
//       oldUser = await Otp.create(
//         { userdata, otp: otpGenerated, expiry: tenMinutesLater }
//       );
//       await sendSMS(`+91${userdata}`, from, otpGenerated);

//       return res.status(201).json({
//         success: true, user: userdata,
//         message: `OTP has been sent to your phone number ending in ${userdata.slice(-4)}.`,
//       });
//     }

//     // // Generate and return a JWT token
//     // const token = createActivationToken(oldUser);

//     // return res.status(200).json({ message: "OTP Sent Successfully", user: oldUser, token });

//   } catch (error) {
//     return res.status(500).send(error.message);
//   }
// });


router.post("/registerotp", async (req, res) => {
  try {
    const { userdata } = req.body;
    let oldUser;

    // Check if userdata exists and is a string
    if (typeof userdata === 'string') {
      // Generate OTP
      const otpGenerated = Math.floor(100000 + Math.random() * 900000);
      console.log(otpGenerated);
      const currentDate = new Date();

      // Add 10 minutes to the current date and time
      const tenMinutesLater = new Date(currentDate.getTime() + 10 * 60 * 1000); // 10 minutes in milliseconds

      if (userdata.includes("@")) {
        // Sign up by email
        oldUser = await Otp.create(
          { userdata, otp: otpGenerated, expiry: tenMinutesLater }
        );

        await sendMail({
          email: userdata,
          subject: "Activate your account",
          message: `Hello ${userdata}, please to Here is your OTP!: ${otpGenerated}`,
        });

        return res.status(201).json({
          success: true,
          message: `Please check your email at ${userdata} to Here is your OTP!`,
          user: oldUser, // Include the user details here
          otp: otpGenerated
        });
      } else {
        oldUser = await Otp.create(
          { userdata, otp: otpGenerated, expiry: tenMinutesLater }
        );
        await sendSMS(`+91${userdata}`, from, otpGenerated);

        return res.status(201).json({
          success: true, user: userdata,
          message: `OTP has been sent to your phone number ending in ${userdata.slice(-4)}.`,
        });
      }
    } else {
      // Handle the case where userdata is not a string
      return res.status(400).json({
        success: false,
        message: 'Invalid userdata format. It should be a string.',
      });
    }
  } catch (error) {
    return res.status(500).send(error.message);
  }
});




router.post("/verify_OTP", async (req, res) => {
  try {
    const { userdata, otp } = req.body;

    let oldUser = await Otp.findOne({ userdata, otp });

    if (!oldUser) {
      return res.status(400).json({ message: "otp not valid" });
    }

    return res.status(200).json({ message: "OTP verified Successfully", success: true });
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

//!login api
router.post("/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { password, userdata } = req.body;

      if (!password || !userdata) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      let user

      if (typeof userdata == "string") {
        user = await User.findOne({ email: userdata }).select("+password");
      }
      else if (typeof userdata == "number") {
        user = await User.findOne({ phoneNumber: userdata }).select("+password");
      }

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


//!create user
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, userdata, password, avatar } = req.body;


    let user
    if (userdata.includes("@")) {
      const userEmail = await User.findOne({ email: userdata });

      if (userEmail) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email: userdata,
        avatar,
        password
      });
    } else {
      const userEmail = await User.findOne({ phoneNumber: userdata });

      if (userEmail) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        phoneNumber: userdata,
        avatar,
        password
      });
    }

    sendToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


module.exports = router



