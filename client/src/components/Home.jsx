{
  /* Recommendations Section */
}
<div className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h2 className="text-xl font-semibold mb-4">Friend Recommendations</h2>
  <div className="space-y-4">
    {recommendations.map((user) => (
      <div
        key={user._id}
        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
      >
        <div>
          <h3 className="font-medium">{user.username}</h3>
          <p className="text-sm text-gray-600">
            {user.mutualFriends} mutual friends • {user.commonInterests} common
            interests
          </p>
          {user.interests && user.interests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {user.interests.map((interest, index) => (
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
          onClick={() => handleSendFriendRequest(user._id)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Friend
        </button>
      </div>
    ))}
  </div>
</div>;
