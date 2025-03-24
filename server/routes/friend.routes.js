const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const User = require("../models/user.model");

// Send friend request
router.post("/request/:id", protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot send friend request to yourself",
      });
    }

    if (currentUser.friends.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: "Already friends with this user",
      });
    }

    if (targetUser.friendRequests.includes(currentUser._id)) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    targetUser.friendRequests.push(currentUser._id);
    currentUser.sentFriendRequests.push(targetUser._id);

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({
      success: true,
      message: "Friend request sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Accept friend request
router.post("/accept/:id", protect, async (req, res) => {
  try {
    const requestUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!requestUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!currentUser.friendRequests.includes(requestUser._id)) {
      return res.status(400).json({
        success: false,
        message: "No friend request from this user",
      });
    }

    currentUser.friendRequests = currentUser.friendRequests.filter(
      (id) => id.toString() !== requestUser._id.toString()
    );
    requestUser.sentFriendRequests = requestUser.sentFriendRequests.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    currentUser.friends.push(requestUser._id);
    requestUser.friends.push(currentUser._id);

    await currentUser.save();
    await requestUser.save();

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Reject friend request
router.post("/reject/:id", protect, async (req, res) => {
  try {
    const requestUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!requestUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    currentUser.friendRequests = currentUser.friendRequests.filter(
      (id) => id.toString() !== requestUser._id.toString()
    );
    requestUser.sentFriendRequests = requestUser.sentFriendRequests.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await requestUser.save();

    res.status(200).json({
      success: true,
      message: "Friend request rejected",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// Get friend recommendations
router.get("/recommendations", protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).populate("friends");

    // Get friends of friends
    const friendsOfFriends = await User.find({
      _id: {
        $in: currentUser.friends.flatMap((friend) => friend.friends),
        $nin: [...currentUser.friends, currentUser._id],
      },
    }).select("-password");

    // Get users with mutual friends
    const recommendations = friendsOfFriends
      .map((user) => ({
        user,
        mutualFriends: user.friends.filter((friend) =>
          currentUser.friends.some(
            (myFriend) => myFriend._id.toString() === friend.toString()
          )
        ).length,
      }))
      .sort((a, b) => b.mutualFriends - a.mutualFriends);

    res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;
