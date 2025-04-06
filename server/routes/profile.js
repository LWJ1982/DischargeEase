const express = require("express");
const router = express.Router();
const { validateToken } = require("../middlewares/auth");
const multer = require("multer");
const { User, Profile } = require("../models");
const yup = require("yup");
const path = require("path");
const fs = require("fs");

const profileUpdateSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(3)
    .max(50)
    .required("Name is required")
    .matches(
      /^[a-zA-Z '-,.]+$/,
      "name only allow letters, spaces and characters: ' - , ."
    ),
  mobile: yup
    .string()
    .min(8)
    .max(15)
    .required("Mobile is required")
    .matches(/^\+?[0-9]{8,15}$/, "Please enter a valid mobile number"),
});

//Get user Profile
router.get("/", validateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Profile, as: "Profile" }],
    });

    if (!user || !user.Profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { id, name, email } = user;
    const { mobile, profile_picture } = user.Profile;

    res.status(200).json({
      user: {
        id,
        name,
        email,
        mobileNumber: mobile,
        profilePicture: profile_picture
          ? profile_picture.startsWith("https")
            ? profile_picture
            : `${req.protocol}://${req.get(
                "host"
              )}/uploads/profile-pictures/${profile_picture}`
          : null,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});

//Update user Profile
router.put("/", validateToken, async (req, res) => {
  let data = req.body;

  try {
    data = await profileUpdateSchema.validate(data, { abortEarly: false });

    const user = await User.findByPk(req.user.id, {
      include: [{ model: Profile, as: "Profile" }],
    });

    if (!user || !user.Profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { name, mobile } = data;

    const isNameChanged = user.name !== name;
    const isMobileChanged = user.Profile.mobile !== mobile;

    if (!isNameChanged && !isMobileChanged) {
      return res.status(400).json({ message: "No changes made" });
    }

    if (isNameChanged) await user.update({ name });
    if (isMobileChanged) await user.Profile.update({ mobile });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        mobile: user.Profile.mobile,
        profilePicture: user.Profile.profile_picture
          ? user.Profile.profile_picture.startsWith("https")
            ? user.Profile.profile_picture
            : `${req.protocol}://${req.get("host")}/uploads/profile-pictures/${
                user.Profile.profile_picture
              }`
          : null,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(400).json({ errors: err.errors });
  }
});

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define upload directory and create it if it doesn't exist
    const uploadDir = "./uploads/profile-pictures";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp to prevent overwriting
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Create multer upload instance with file filtering
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Only allow image file types
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post(
  "/picture",
  validateToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const user = await User.findByPk(req.user.id, {
        include: [{ model: Profile, as: "Profile" }],
      });

      if (!user || !user.Profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const newPicture = req.file.filename;

      // Delete old profile picture if any
      if (user.Profile.profile_picture) {
        const oldPath = path.join(
          __dirname,
          "..",
          "uploads",
          "profile-pictures",
          user.Profile.profile_picture
        );
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await user.Profile.update({ profile_picture: newPicture });

      res.status(200).json({
        message: "Profile picture uploaded successfully",
        profilePicture: `${req.protocol}://${req.get(
          "host"
        )}/uploads/profile-pictures/${newPicture}`,
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({
        message: "Server error while uploading profile picture",
      });
    }
  }
);

module.exports = router;
