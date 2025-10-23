import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from '../logo.png';
import TipsySpinner from './components/TipsySpinner';
import PlinkoWithCountdown from './components/PlinkoWithCountdown';
import BlackjackWithCountdown from './components/BlackjackWithCountdown';
import QuizWithCountdown from './components/QuizWithCountdown';
import DiceWithCountdown from './components/DiceWithCountdown';
import PasswordGate from './components/PasswordGate';

function HomePage() {
  const isMobile = window.innerWidth < 768;
  
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#2f2f2f",
    color: "#f2f2f2",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: isMobile ? "16px" : "20px",
    paddingTop: `max(${isMobile ? '40px' : '60px'}, env(safe-area-inset-top))`,
    paddingBottom: `env(safe-area-inset-bottom)`,
    textAlign: "center"
  };

  const logoStyle: React.CSSProperties = {
    width: isMobile ? "100px" : "120px",
    height: isMobile ? "100px" : "120px",
    marginBottom: isMobile ? "24px" : "32px"
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: isMobile ? "2rem" : "2.5rem",
    fontWeight: "600",
    marginBottom: "16px",
    margin: "0 0 16px 0",
    lineHeight: "1.2"
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: isMobile ? "1.1rem" : "1.25rem",
    fontWeight: "400",
    opacity: "0.9",
    margin: "0 0 40px 0",
    lineHeight: "1.4"
  };

  const gameButtonStyle: React.CSSProperties = {
    backgroundColor: "#f2f2f2",
    color: "#2f2f2f",
    border: "none",
    borderRadius: "12px",
    padding: isMobile ? "16px 24px" : "16px 32px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: isMobile ? "16px" : "18px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "all 0.3s ease",
    touchAction: "manipulation",
    minHeight: "44px",
    width: isMobile ? "100%" : "auto",
    maxWidth: isMobile ? "300px" : "none"
  };

  const gameButtons = [
    { path: "/tipsy-spinner", emoji: "🎯", name: "Tipsy Spinner" },
    { path: "/plinko", emoji: "🎲", name: "Plinko" },
    { path: "/blackjack", emoji: "🃏", name: "Blackjack" },
    { path: "/quiz", emoji: "🧠", name: "Quiz" },
    { path: "/dice-trinken", emoji: "🎲", name: "Dice Trinken" },
    { path: "/dice-verteilen", emoji: "🎲", name: "Dice Verteilen" }
  ];

  return (
    <div style={containerStyle}>
      <img src={logo} alt="Drunk.WTF Logo" style={logoStyle} />
      <h1 style={headlineStyle}>Welcome to Drunk.WTF</h1>
      <p style={subtitleStyle}>A chill place for browser-based party games 🍻</p>
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "12px" : "16px",
        width: "100%",
        maxWidth: isMobile ? "320px" : "400px",
        alignItems: "center"
      }}>
        {gameButtons.map((game, index) => (
          <Link 
            key={index}
            to={game.path} 
            style={{
              ...gameButtonStyle,
              width: "100%",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span>{game.emoji}</span>
            <span>{game.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PasswordGate>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tipsy-spinner" element={<TipsySpinner />} />
          <Route path="/plinko" element={<PlinkoWithCountdown />} />
          <Route path="/blackjack" element={<BlackjackWithCountdown />} />
          <Route path="/quiz" element={<QuizWithCountdown />} />
          <Route path="/dice-trinken" element={<DiceWithCountdown />} />
          <Route path="/dice-verteilen" element={<DiceWithCountdown />} />
        </Routes>
      </Router>
    </PasswordGate>
  );
}
