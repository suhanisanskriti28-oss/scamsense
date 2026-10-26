import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/auth';
import './NavBar.css';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
      setError(err instanceof Error ? err.message : 'Unable to sign out. Please try again.');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo"><span className="logo-mark">S</span> ScamSense</Link>
      </div>
      <div className="nav-right">
        <Link to="/" className="nav-link">Analyse</Link>
        <Link to="/history" className="nav-link">History</Link>
        <Link to="/report" className="nav-link">Report</Link>
        {user ? (
          <>
            <span className="nav-user">{user.email}</span>
            {user.role === 'admin' && <Link to="/admin" className="nav-link">Admin</Link>}
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign in</Link>
            <Link to="/register" className="nav-join">Create account</Link>
          </>
        )}
      </div>
      {error && <span className="nav-error" role="alert">{error}</span>}
    </nav>
  );
}

export default NavBar;
