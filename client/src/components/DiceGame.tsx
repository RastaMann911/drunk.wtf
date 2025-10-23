import { useEffect } from 'react';

interface DiceGameProps {
  gameType: 'trinken' | 'verteilen';
  multiplier?: number;
}

export default function DiceGame({ gameType, multiplier = 1 }: DiceGameProps) {
  const gameTitle = gameType === 'trinken' ? 'Würfel Trinken' : 'Würfel Verteilen';
  const actionText = gameType === 'trinken' ? 'Schlücke trinken' : 'Schlücke verteilen';

  // Auto-return to spinner after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      const event = new CustomEvent('diceResult', {
        detail: {
          result: `Würfel um die Anzahl der Schlücke festzulegen`,
          total: 0,
          rolls: [],
          gameType
        }
      });
      window.dispatchEvent(event);
    }, 5000);

    return () => clearTimeout(timer);
  }, [gameType]);

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
    marginBottom: '40px',
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

  const returnTextStyle: React.CSSProperties = {
    fontSize: '1.2rem',
    color: '#95A5A6',
    marginTop: '20px'
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

      <div style={returnTextStyle}>
        Returning to spinner in 5 seconds...
      </div>
    </div>
  );
}