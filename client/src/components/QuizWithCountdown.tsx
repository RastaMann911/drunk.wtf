import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QuizGame from './QuizGame';

export default function QuizWithCountdown() {
  const [countdown, setCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [showReturnOverlay, setShowReturnOverlay] = useState(false);
  const [returnIn, setReturnIn] = useState(5);
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);

  const playCountdownSound = (count: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = count === 0 ? 800 : 400 + (count * 100);
    gainNode.gain.value = count === 0 ? 0.4 : 0.3;
    oscillator.type = count === 0 ? 'sine' : 'square';
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + (count === 0 ? 0.3 : 0.15));
  };

  useEffect(() => {
    if (countdown > 0) {
      playCountdownSound(countdown);
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameStarted) {
      playCountdownSound(0);
      const t = setTimeout(() => setGameStarted(true), 500);
      return () => clearTimeout(t);
    }
  }, [countdown, gameStarted]);

  useEffect(() => {
    const handleResult = (event: CustomEvent) => {
      setShowReturnOverlay(true);
      setReturnIn(5);
      const intId = setInterval(() => setReturnIn(prev => (prev <= 1 ? (clearInterval(intId), 0) as any : prev - 1)), 1000);
      setTimeout(() => {
        clearInterval(intId);
        navigate('/tipsy-spinner');
      }, 5000);
    };
    window.addEventListener('quizResult' as any, handleResult as any);
    return () => {
      window.removeEventListener('quizResult' as any, handleResult as any);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [navigate]);

  if (!gameStarted) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: countdown > 0 ? `${countdown * 300}px` : '1000px', height: countdown > 0 ? `${countdown * 300}px` : '1000px', borderRadius: '50%', background: countdown > 0 ? `radial-gradient(circle, rgba(255, 100, 100, 0.3) 0%, transparent 70%)` : `radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 70%)`, animation: 'pulse 1s ease-in-out infinite', transition: 'all 0.3s ease' }} />
        <div style={{ fontSize: countdown > 0 ? '20rem' : '15rem', fontWeight: 900, color: countdown > 0 ? '#FF6B6B' : '#FFD700', textShadow: countdown > 0 ? '0 0 50px rgba(255, 107, 107, 0.8), 0 0 100px rgba(255, 107, 107, 0.5)' : '0 0 50px rgba(255, 215, 0, 0.8), 0 0 100px rgba(255, 215, 0, 0.5)', zIndex: 10, animation: 'countdownPop 0.5s ease-out', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', transition: 'all 0.3s ease' }}>
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <style>{`
          @keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; } 50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; } }
          @keyframes countdownPop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <QuizGame />
      {showReturnOverlay && (
        <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', color: '#f2f2f2', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}>
            Runde beendet — Rückkehr zum Rad in {returnIn}s
          </div>
        </div>
      )}
    </>
  );
}





