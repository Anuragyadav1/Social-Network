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
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Search Section */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all hover:shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Find Friends
              </h2>
              <p className="text-blue-100 text-sm">
                Search for people to connect with
              </p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or username"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center items-center rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-900 focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Searching...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                          />
                        </svg>
                        Search
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Search Results
                  </h3>
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {result.fullName || result.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{result.username}
                        </p>
                      </div>
                      <button
                        onClick={() => handleFriendRequest(result._id)}
                        className="flex items-center rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-3 py-1.5 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-900 transition-all"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                          />
                        </svg>
                        Add Friend
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Friend Requests & Recommendations */}
          <div className="space-y-8">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all hover:shadow-xl">
                <div className="bg-gradient-to-r from-green-600 to-green-800 p-4">
                  <h2 className="text-xl font-bold text-white">
                    Friend Requests
                  </h2>
                </div>
                <div className="p-4 divide-y divide-gray-100">
                  {friendRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between py-4 px-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{request.username}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          className="flex items-center rounded-md bg-gradient-to-r from-green-600 to-green-700 px-3 py-1.5 text-sm font-medium text-white hover:from-green-700 hover:to-green-800 transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          className="flex items-center rounded-md bg-gradient-to-r from-red-600 to-red-700 px-3 py-1.5 text-sm font-medium text-white hover:from-red-700 hover:to-red-800 transition-all"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
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
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all hover:shadow-xl">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
                  <h2 className="text-xl font-bold text-white">Your Friends</h2>
                </div>
                <div className="p-4 divide-y divide-gray-100">
                  {friends.map((friend) => (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between py-4 px-2"
                    >
                      <div className="flex items-center">
                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.fullName}
                            className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-500 mr-3">
                            {friend.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {friend.fullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{friend.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnfriend(friend._id)}
                        className="flex items-center rounded-md bg-gradient-to-r from-red-600 to-red-700 px-3 py-1.5 text-sm font-medium text-white hover:from-red-700 hover:to-red-800 transition-all"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                          />
                        </svg>
                        Unfriend
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations - Always show this section */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all hover:shadow-xl">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4">
                <h2 className="text-xl font-bold text-white">
                  People You May Know
                </h2>
              </div>
              <div className="p-4">
                {isLoadingRecs ? (
                  <div className="py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
                    <p className="mt-4">Finding people for you...</p>
                  </div>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="space-y-4 divide-y divide-gray-100">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.user._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between pt-4 first:pt-0"
                      >
                        <div className="w-full sm:pr-4 mb-3 sm:mb-0">
                          <div className="flex items-center">
                            {rec.user.profilePicture ? (
                              <img
                                src={rec.user.profilePicture}
                                alt={rec.user.fullName}
                                className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-500 mr-3">
                                {rec.user.fullName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {rec.user.fullName}
                              </p>
                              <p className="text-sm text-gray-500">
                                @{rec.user.username}
                              </p>
                            </div>
                          </div>

                          {/* Mutual Friends Section */}
                          {rec.mutualFriends > 0 ? (
                            <div className="mt-2 pl-13">
                              <details className="cursor-pointer group">
                                <summary className="text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-4 h-4 mr-1 text-purple-500"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                                    />
                                  </svg>
                                  {rec.mutualFriends} mutual{" "}
                                  {rec.mutualFriends === 1
                                    ? "friend"
                                    : "friends"}
                                </summary>
                                <div className="mt-2 pl-5 border-l-2 border-purple-200 text-sm text-gray-600 ml-1">
                                  {rec.mutualFriendsDetails.map(
                                    (friend, idx) => (
                                      <p
                                        key={idx}
                                        className="my-1 flex items-center"
                                      >
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                                        {friend.fullName || friend.username}
                                      </p>
                                    )
                                  )}
                                </div>
                              </details>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mt-2 pl-13">
                              No mutual friends
                            </p>
                          )}

                          {rec.commonInterests > 0 && (
                            <p className="text-sm text-gray-500 mt-1 pl-13">
                              {rec.commonInterests} common interests
                            </p>
                          )}

                          {rec.user.interests &&
                            rec.user.interests.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2 pl-13">
                                {rec.user.interests.map((interest, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                        <button
                          onClick={() => handleFriendRequest(rec.user._id)}
                          className="flex items-center rounded-md bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1.5 text-sm font-medium text-white hover:from-purple-700 hover:to-purple-800 transition-all w-full sm:w-auto justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                            />
                          </svg>
                          Add Friend
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="w-16 h-16 mx-auto text-gray-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                      />
                    </svg>
                    <p className="text-gray-500 mt-4">
                      No recommendations available right now
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Try searching for users to connect with
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
