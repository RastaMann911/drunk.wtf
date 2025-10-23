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
    const isMobile = window.innerWidth < 768;
    
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#2f2f2f',
        color: '#f2f2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        padding: isMobile ? '20px' : '16px',
        paddingTop: isMobile ? 'calc(env(safe-area-inset-top) + 20px)' : 'env(safe-area-inset-top)',
        paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 20px)' : 'env(safe-area-inset-bottom)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          backgroundColor: '#3f3f3f',
          padding: isMobile ? '32px 24px' : '40px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          maxWidth: isMobile ? '320px' : '400px',
          width: '100%',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '600',
            marginBottom: '12px',
            margin: '0 0 12px 0',
            lineHeight: '1.2'
          }}>
            🔒 Private Access
          </h1>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            opacity: '0.8',
            marginBottom: '28px',
            margin: '0 0 28px 0',
            lineHeight: '1.4'
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
                padding: isMobile ? '16px' : '16px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '2px solid #555',
                backgroundColor: '#4f4f4f',
                color: '#f2f2f2',
                marginBottom: '20px',
                outline: 'none',
                boxSizing: 'border-box',
                WebkitAppearance: 'none',
                touchAction: 'manipulation',
                minHeight: '48px'
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
                padding: isMobile ? '16px' : '16px',
                fontSize: '16px',
                fontWeight: '600',
                backgroundColor: '#f2f2f2',
                color: '#2f2f2f',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                minHeight: '48px'
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
        top: isMobile ? 'calc(env(safe-area-inset-top) + 16px)' : '20px',
        right: isMobile ? '16px' : '20px',
        zIndex: 1000
      }}>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#f2f2f2',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '12px 16px' : '8px 16px',
            fontSize: isMobile ? '14px' : '14px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            minHeight: '44px',
            minWidth: '44px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          }}
        >
          🔓 Logout
        </button>
      </div>
    </>
  );
};

export default PasswordGate;
