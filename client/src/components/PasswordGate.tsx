import React, { useState, useEffect } from 'react';

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (stored in sessionStorage)
    const authStatus = sessionStorage.getItem('drunk-wtf-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'SevsOnkel') {
      setIsAuthenticated(true);
      sessionStorage.setItem('drunk-wtf-authenticated', 'true');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('drunk-wtf-authenticated');
    setPassword('');
    setError('');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#2f2f2f',
        color: '#f2f2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#2f2f2f',
        color: '#f2f2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#3f3f3f',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '600',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            🔒 Private Access
          </h1>
          <p style={{
            fontSize: '1rem',
            opacity: '0.8',
            marginBottom: '32px',
            margin: '0 0 32px 0'
          }}>
            This website is password protected
          </p>
          
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #555',
                backgroundColor: '#4f4f4f',
                color: '#f2f2f2',
                marginBottom: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              required
            />
            
            {error && (
              <div style={{
                color: '#ff6b6b',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#f2f2f2',
                color: '#2f2f2f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f2f2f2';
              }}
            >
              Enter Site
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#f2f2f2',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
        >
          🔓 Logout
        </button>
      </div>
    </>
  );
};

export default PasswordGate;
