import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../config";

function Home() {
  const [recommendations, setRecommendations] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFriendRequests();
    fetchRecommendations();
    fetchFriends();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFriendRequests(response.data.user.friendRequests);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecs(true);
      console.log("Fetching recommendations...");

      // First get our friends to calculate mutual connections
      const friendsResponse = await axios.get(`${BASE_URL}/users/friends`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const myFriends = friendsResponse.data.friends || [];
      const myFriendIds = myFriends.map((friend) => friend._id);

      // Create a map of friend IDs to friend objects for quick lookup
      const friendsMap = {};
      myFriends.forEach((friend) => {
        friendsMap[friend._id] = friend;
      });

      console.log("My friends:", myFriendIds);

      // Get all users
      const response = await axios.get(`${BASE_URL}/users/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("Raw users response:", response.data);

      if (response.data.success && response.data.users) {
        // Filter out users who are already friends and the current user
        const nonFriendUsers = response.data.users.filter(
          (u) => !myFriendIds.includes(u._id) && u._id !== user?._id
        );

        // For each potential friend, get their friends to find mutual connections
        const recommendationsPromises = nonFriendUsers.map(
          async (potentialFriend) => {
            try {
              // Get this user's friends
              const userFriendsResponse = await axios.get(
                `${BASE_URL}/users/user-friends/${potentialFriend._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }
              );

              const userFriends = userFriendsResponse.data.friends || [];
              const userFriendIds = userFriends.map((friend) => friend._id);

              // Calculate mutual friends - intersection of my friends and their friends
              const mutualFriendIds = myFriendIds.filter((id) =>
                userFriendIds.includes(id)
              );

              // Get the mutual friends details using the map
              const mutualFriendsDetails = mutualFriendIds.map(
                (id) => friendsMap[id]
              );

              const mutualFriendsCount = mutualFriendIds.length;

              console.log(
                `Mutual friends with ${potentialFriend.username}:`,
                mutualFriendsCount,
                mutualFriendsDetails.map((f) => f.username)
              );

              return {
                user: {
                  _id: potentialFriend._id,
                  username: potentialFriend.username,
                  fullName:
                    potentialFriend.fullName || potentialFriend.username,
                  interests: potentialFriend.interests || [],
                },
                mutualFriends: mutualFriendsCount,
                mutualFriendsDetails: mutualFriendsDetails,
                commonInterests: 0,
              };
            } catch (error) {
              console.error(
                `Error getting friends for ${potentialFriend.username}:`,
                error
              );
              return {
                user: {
                  _id: potentialFriend._id,
                  username: potentialFriend.username,
                  fullName:
                    potentialFriend.fullName || potentialFriend.username,
                  interests: potentialFriend.interests || [],
                },
                mutualFriends: 0,
                mutualFriendsDetails: [],
                commonInterests: 0,
              };
            }
          }
        );

        // Wait for all promises to resolve
        let recommendations = await Promise.all(recommendationsPromises);

        // Sort by number of mutual friends (highest first)
        recommendations = recommendations.sort(
          (a, b) => b.mutualFriends - a.mutualFriends
        );

        console.log(
          "Formatted recommendations with mutual friends:",
          recommendations
        );
        setRecommendations(recommendations);
      } else {
        console.error("Unexpected response format:", response.data);
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setRecommendations([]);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/users/friends`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFriends(response.data.friends);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/users/search?query=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSearchResults(response.data.users);
    } catch (err) {
      console.error("Error searching users:", err);
    }
    setIsLoading(false);
  };

  const handleFriendRequest = async (userId) => {
    try {
      await axios.post(
        `${BASE_URL}/friends/request/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Update UI
      setSearchResults((prev) => prev.filter((user) => user._id !== userId));
      setRecommendations((prev) =>
        prev.filter((rec) => rec.user._id !== userId)
      );
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await axios.post(
        `${BASE_URL}/friends/accept/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchFriendRequests();
    } catch (err) {
      console.error("Error accepting friend request:", err);
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await axios.post(
        `${BASE_URL}/friends/reject/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchFriendRequests();
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  };

  const handleUnfriend = async (friendId) => {
    try {
      await axios.delete(`${BASE_URL}/friends/unfriend/${friendId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Get the unfriended user's data before removing them from friends list
      const unfriendedUser = friends.find((friend) => friend._id === friendId);

      // Update the friends list after unfriending
      setFriends((prevFriends) =>
        prevFriends.filter((friend) => friend._id !== friendId)
      );

      // Since we've removed a friend, we need to update all recommendations with proper mutual friends
      // It's better to refresh recommendations entirely instead of trying to calculate on the client
      setTimeout(fetchRecommendations, 500);
    } catch (err) {
      console.error("Error unfriending user:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Search Section */}
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Find Friends</h2>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username"
                className="flex-1 rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Search
              </button>
            </div>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Search Results</h3>
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {result.fullName || result.username}
                    </p>
                    <p className="text-sm text-gray-500">@{result.username}</p>
                  </div>
                  <button
                    onClick={() => handleFriendRequest(result._id)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend Requests & Recommendations */}
        <div className="space-y-8">
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Friend Requests</h2>
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{request.fullName}</p>
                      <p className="text-sm text-gray-500">
                        @{request.username}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          {friends.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">Your Friends</h2>
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{friend.fullName}</p>
                      <p className="text-sm text-gray-500">
                        @{friend.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnfriend(friend._id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                    >
                      Unfriend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations - Always show this section */}
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold">People You May Know</h2>
            <div className="space-y-4">
              {isLoadingRecs ? (
                <div className="py-4 text-center text-gray-500">
                  <p>Loading recommendations...</p>
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div
                    key={rec.user._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="w-full">
                      <p className="font-medium">{rec.user.fullName}</p>
                      <p className="text-sm text-gray-500">
                        @{rec.user.username}
                      </p>

                      {/* Mutual Friends Section */}
                      {rec.mutualFriends > 0 ? (
                        <div className="mt-1">
                          <details className="cursor-pointer">
                            <summary className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {rec.mutualFriends} mutual{" "}
                              {rec.mutualFriends === 1 ? "friend" : "friends"}
                            </summary>
                            <div className="mt-2 pl-2 border-l-2 border-blue-200 text-sm text-gray-600">
                              {rec.mutualFriendsDetails.map((friend, idx) => (
                                <p key={idx} className="my-1">
                                  {friend.fullName || friend.username}
                                </p>
                              ))}
                            </div>
                          </details>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No mutual friends
                        </p>
                      )}

                      {rec.commonInterests > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {rec.commonInterests} common interests
                        </p>
                      )}

                      {rec.user.interests && rec.user.interests.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rec.user.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleFriendRequest(rec.user._id)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 ml-4"
                    >
                      Add Friend
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No recommendations available right now. Try searching for
                  users to connect with.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
