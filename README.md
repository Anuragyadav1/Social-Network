# ConnectHub - Social Network Application

ConnectHub is a modern social network application that allows users to connect with friends, discover new people through mutual connections, and manage their social interactions in a clean, intuitive interface.

## 🚀 Features

- **User Authentication** - Secure login and registration
- **Profile Management** - Create and update your personal profile
- **Friend System** - Send/accept friend requests and manage connections
- **Smart Friend Recommendations** - Discover new people through mutual friends
- **Search Functionality** - Find users by name or username
- **Responsive Design** - Works seamlessly on mobile and desktop

## 🛠️ Tech Stack

### Frontend

- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **React Router** - Client-side routing

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JSON Web Tokens** - Authentication
- **bcrypt** - Password hashing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 14.x or higher)
- npm or yarn
- MongoDB (local instance or Atlas connection)

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/social-network.git
cd social-network
```

2. **Set up environment variables**

Create a `.env` file in the server directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/connecthub
JWT_SECRET=your_jwt_secret
```

3. **Install server dependencies**

```bash
cd server
npm install
```

4. **Install client dependencies**

```bash
cd ../client
npm install
```

## 🚀 Running the Application

### Development Mode

1. **Start the server**

```bash
cd server
npm run dev
```

2. **Start the client**

```bash
cd client
npm run dev
```

The client will be available at http://localhost:5173 and the server at http://localhost:5000

### Production Build

1. **Build the client**

```bash
cd client
npm run build
```

2. **Start the server in production mode**

```bash
cd server
npm start
```

## 📱 Application Structure

### Backend Routes

- **Authentication**

  - POST `/api/auth/register` - Register a new user
  - POST `/api/auth/login` - Login a user

- **User Management**

  - GET `/api/users/profile` - Get current user profile
  - PUT `/api/users/profile` - Update user profile
  - GET `/api/users/search` - Search for users
  - GET `/api/users/all` - Get all users (with pagination)
  - GET `/api/users/friends` - Get current user's friends
  - GET `/api/users/user-friends/:userId` - Get a specific user's friends

- **Friend Management**
  - POST `/api/friends/request/:userId` - Send a friend request
  - POST `/api/friends/accept/:userId` - Accept a friend request
  - POST `/api/friends/reject/:userId` - Reject a friend request
  - DELETE `/api/friends/unfriend/:userId` - Unfriend a user

### Frontend Pages

- **Authentication**

  - `/login` - User login
  - `/register` - User registration

- **Application**
  - `/` - Home page with search, recommendations, and friend requests
  - `/profile` - User profile management

## 🤝 Mutual Friends Feature

The application includes an intelligent friend recommendation system that identifies potential connections through mutual friends. For each recommendation:

- The system calculates mutual connections between users
- Displays the count of mutual friends with a dropdown to view specific shared connections
- Helps users discover relevant new connections in their social network

## 📝 Future Enhancements

- Direct messaging between friends
- News feed with posts and comments
- Photo sharing capabilities
- Notification system
- Mobile application

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Your Name - Initial work and development

## 🙏 Acknowledgments

- Thanks to all the open-source libraries that made this project possible
