const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const User = require("../models/user.model");

// Get user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("friends", "username fullName profilePicture")
      .populate("friendRequests", "username fullName profilePicture")
      .populate("sentFriendRequests", "username fullName profilePicture");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Search users
router.get("/search", protect, async (req, res) => {
  try {
    const { query } = req.query;
    const regex = new RegExp(query, "i");

    const users = await User.find({
      $and: [
        {
          $or: [{ username: regex }, { fullName: regex }],
        },
        { _id: { $ne: req.user._id } },
      ],
    }).select("username fullName profilePicture");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Update user profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { fullName, profilePicture } = req.body;
    const user = await User.findById(req.user._id);

    if (fullName) user.fullName = fullName;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Get friend list
router.get("/friends", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "username fullName profilePicture"
    );

    res.status(200).json({
      success: true,
      friends: user.friends,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;
