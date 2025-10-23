import { useNavigate, useLocation } from 'react-router-dom';

export default function DiceWithCountdown() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine game type from URL or default to 'trinken'
  const gameType = location.pathname.includes('verteilen') ? 'verteilen' : 'trinken';
  const gameTitle = gameType === 'trinken' ? 'Würfel Trinken' : 'Würfel Verteilen';

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#2a2a2a',
    color: '#f2f2f2',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '40px',
    color: '#f2f2f2',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
  };

  const instructionStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: '500',
    lineHeight: '1.6',
    maxWidth: '800px',
    marginBottom: '60px',
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
  };

  const diceIconStyle: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: '20px',
    display: 'block'
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '25px 60px',
    fontSize: '2rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    minWidth: '300px'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{gameTitle}</h1>
      
      <div style={instructionStyle}>
        <span style={diceIconStyle}>🎲</span>
        <p>
          Würfel um die Anzahl der Schlücke festzulegen.<br />
          Bei 6 musst du nochmal würfeln und das Ergebnis wird dazu addiert.
        </p>
      </div>

      <button
        style={buttonStyle}
        onClick={() => navigate('/tipsy-spinner')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        }}
      >
        Zurück zum Rad
      </button>
    </div>
  );
}
