import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { BASE_URL } from "../config";
import { Link } from "react-router-dom";

function Profile() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    profilePicture: user?.profilePicture || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/users/friends`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setFriends(response.data.friends);
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BASE_URL}/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Profile Information */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 transition-all hover:shadow-xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-32 flex items-end justify-center">
                {!isEditing && (
                  <div className="translate-y-1/2 bg-white p-1 rounded-full">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.fullName}
                        className="h-32 w-32 rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 text-4xl font-bold text-blue-700 border-4 border-white">
                        {user?.fullName?.charAt(0) || user?.username?.charAt(0)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 pt-20">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile Picture URL
                      </label>
                      <input
                        type="text"
                        name="profilePicture"
                        value={formData.profilePicture}
                        onChange={handleChange}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={3}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-md bg-gradient-to-r from-blue-600 to-blue-800 px-3 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-900 focus:outline-none transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {user?.fullName}
                    </h2>
                    <p className="text-gray-500 mb-4">@{user?.username}</p>

                    {user?.bio && (
                      <div className="mb-6 text-gray-600 italic text-sm px-2">
                        "{user.bio}"
                      </div>
                    )}

                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-md hover:from-blue-700 hover:to-blue-900 focus:outline-none transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                        Edit Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Friends List */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 h-full">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Friends</h2>
                <p className="text-sm text-gray-500 mt-1">
                  People you've connected with
                </p>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-12">
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
                    <p className="text-gray-500 mt-4">No friends yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Go to the home page to find people to connect with
                    </p>
                    <Link
                      to="/"
                      className="mt-4 inline-block text-blue-600 hover:underline"
                    >
                      Find Friends
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {friends.map((friend) => (
                      <div
                        key={friend._id}
                        className="flex items-center space-x-3 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all hover:border-gray-300"
                      >
                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.fullName}
                            className="h-14 w-14 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-500">
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
                    ))}
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

export default Profile;
