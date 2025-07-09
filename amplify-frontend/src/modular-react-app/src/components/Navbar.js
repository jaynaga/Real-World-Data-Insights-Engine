import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <nav className="bg-blue-500 p-4">
      <div className="container mx-auto flex justify-between">
        <div className="text-white text-lg font-bold">Modular React App</div>
        <div>
          <Link to="/" className="text-white px-4">Home</Link>
          <Link to="/login" className="text-white px-4">Login</Link>
          <Link to="/dashboard" className="text-white px-4">Dashboard</Link>
          <Link to="/upload" className="text-white px-4">Upload</Link>
          {isAuthenticated && (
            <button onClick={logout} className="text-white px-4">Logout</button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;