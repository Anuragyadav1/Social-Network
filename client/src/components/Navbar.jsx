import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Social Network
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
