// Get friend recommendations
router.get("/recommendations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends");
    const userFriends = user.friends.map((friend) => friend._id.toString());

    // Get all users except current user and existing friends
    const potentialFriends = await User.find({
      _id: {
        $nin: [req.user.id, ...userFriends],
      },
    }).populate("friends");

    // Calculate recommendations based on mutual friends and common interests
    const recommendations = potentialFriends.map((potentialFriend) => {
      const mutualFriends = potentialFriend.friends.filter((friend) =>
        userFriends.includes(friend._id.toString())
      ).length;

      // Calculate common interests
      const commonInterests = user.interests.filter((interest) =>
        potentialFriend.interests.includes(interest)
      ).length;

      // Calculate score based on mutual friends and common interests
      const score = mutualFriends * 2 + commonInterests;

      return {
        user: potentialFriend,
        mutualFriends,
        commonInterests,
        score,
      };
    });

    // Sort by score and return top 5 recommendations
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((rec) => ({
        _id: rec.user._id,
        username: rec.user.username,
        interests: rec.user.interests,
        mutualFriends: rec.mutualFriends,
        commonInterests: rec.commonInterests,
      }));

    res.json(sortedRecommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
