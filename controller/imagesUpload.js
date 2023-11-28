const express = require("express");

const router = express.Router();
const multer = require("multer");
const path = require("path");

var storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "public")
    },

    filename: function (req, file, cb) {
        let name = file.originalname.split(".")

        let newname = Math.floor(10000000000 + Math.random() * 90000000000) + "." + name[name.length - 1]
        file.originalname = newname
        cb(null, file.originalname);
    },
});


var upload = multer({ storage: storage })

router.post("/", upload.array("data_image"), (req, res) => {
    console.log(req.files, "req");

    const path = req.files;
    if (path) {
        res.status(400).json({ path, status: true });
    } else {
        res.status(400).json({ path: "no image found", status: false });
    }
});



module.exports = router

