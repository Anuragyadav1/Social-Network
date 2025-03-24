import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Home() {
  const [recommendations, setRecommendations] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchFriendRequests();
    fetchRecommendations();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/users/profile",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFriendRequests(response.data.user.friendRequests);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/friends/recommendations",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setRecommendations(response.data.recommendations);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/users/search?query=${searchQuery}`,
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
        `http://localhost:5000/api/friends/request/${userId}`,
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
        `http://localhost:5000/api/friends/accept/${userId}`,
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
        `http://localhost:5000/api/friends/reject/${userId}`,
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
                    <p className="font-medium">{result.fullName}</p>
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

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-2xl font-bold">People You May Know</h2>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.user._id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">{rec.user.fullName}</p>
                      <p className="text-sm text-gray-500">
                        @{rec.user.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {rec.mutualFriends} mutual friends
                      </p>
                    </div>
                    <button
                      onClick={() => handleFriendRequest(rec.user._id)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
