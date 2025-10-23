import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PlinkoGame from './PlinkoGame';

export default function PlinkoWithCountdown() {
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [plinkoResult, setPlinkoResult] = useState<string | null>(null);
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  // Only apply multiplier if present in URL from the spinner; default fallback is 1
  const slotMultiplier = Math.max(1, Math.min(10, parseInt(searchParams.get('multiplier') || '1', 10) || 1));

  // Play epic countdown sound
  const playCountdownSound = (count: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Different frequencies for each count
    oscillator.frequency.value = count === 0 ? 800 : 400 + (count * 100);
    gainNode.gain.value = count === 0 ? 0.4 : 0.3;
    oscillator.type = count === 0 ? 'sine' : 'square';
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + (count === 0 ? 0.3 : 0.15));
  };

  useEffect(() => {
    if (countdown > 0) {
      playCountdownSound(countdown);
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameStarted) {
      playCountdownSound(0);
      setTimeout(() => {
        setGameStarted(true);
      }, 500);
    }
  }, [countdown, gameStarted]);

  // Listen for Plinko game result
  useEffect(() => {
    const handlePlinkoResult = (event: CustomEvent) => {
      // If result contains numeric like "7x", multiply the numeric value by slotMultiplier for display
      const resText: string = event.detail.result || '';
      const match = resText.match(/^(\d+)x$/);
      const baseVal = match ? parseInt(match[1], 10) : 0;
      const effectiveMultiplier = slotMultiplier > 1 ? slotMultiplier : 1;
      const schluecke = baseVal > 0 ? baseVal * effectiveMultiplier : effectiveMultiplier; // fallback if no numeric
      setPlinkoResult(`${resText} • ${schluecke}x Schlücke`);
      
      // Return to spinner after 5 seconds
      setTimeout(() => {
        navigate('/tipsy-spinner');
      }, 5000);
    };

    window.addEventListener('plinkoResult' as any, handlePlinkoResult as any);
    
    return () => {
      window.removeEventListener('plinkoResult' as any, handlePlinkoResult as any);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [navigate]);

  if (plinkoResult) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'resultPulse 1s ease-in-out infinite'
        }}>
          <div style={{
            fontSize: '6rem',
            fontWeight: '900',
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5)',
            marginBottom: '20px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}>
            {plinkoResult}
          </div>
          <div style={{
            fontSize: '2rem',
            color: '#f2f2f2',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}>
            Returning to spinner...
          </div>
        </div>
        <style>{`
          @keyframes resultPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}>
        {/* Epic background effects */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: countdown > 0 ? `${countdown * 300}px` : '1000px',
          height: countdown > 0 ? `${countdown * 300}px` : '1000px',
          borderRadius: '50%',
          background: countdown > 0 
            ? `radial-gradient(circle, rgba(255, 100, 100, 0.3) 0%, transparent 70%)`
            : `radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%)`,
          animation: 'pulse 1s ease-in-out infinite',
          transition: 'all 0.3s ease'
        }} />
        
        {/* Countdown number */}
        <div style={{
          fontSize: countdown > 0 ? '20rem' : '15rem',
          fontWeight: '900',
          color: countdown > 0 ? '#FF6B6B' : '#FFD700',
          textShadow: countdown > 0 
            ? '0 0 50px rgba(255, 107, 107, 0.8), 0 0 100px rgba(255, 107, 107, 0.5)'
            : '0 0 50px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.5)',
          zIndex: 10,
          animation: 'countdownPop 0.5s ease-out',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          transition: 'all 0.3s ease'
        }}>
          {countdown > 0 ? countdown : 'GO!'}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
          }
          
          @keyframes countdownPop {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return <PlinkoGame />;
}


