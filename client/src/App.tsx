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
    justifyContent: isMobile ? "flex-start" : "flex-start",
    padding: isMobile ? "20px" : "20px",
    paddingTop: isMobile ? "calc(env(safe-area-inset-top) + 40px)" : "60px",
    paddingBottom: isMobile ? "calc(env(safe-area-inset-bottom) + 20px)" : "20px",
    textAlign: "center",
    boxSizing: "border-box"
  };

  const logoStyle: React.CSSProperties = {
    width: isMobile ? "80px" : "120px",
    height: isMobile ? "80px" : "120px",
    marginBottom: isMobile ? "20px" : "32px"
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: isMobile ? "1.75rem" : "2.5rem",
    fontWeight: "600",
    marginBottom: "12px",
    margin: "0 0 12px 0",
    lineHeight: "1.2"
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: isMobile ? "1rem" : "1.25rem",
    fontWeight: "400",
    opacity: "0.9",
    margin: "0 0 32px 0",
    lineHeight: "1.4"
  };

  const gameButtonStyle: React.CSSProperties = {
    backgroundColor: "#f2f2f2",
    color: "#2f2f2f",
    border: "none",
    borderRadius: "12px",
    padding: isMobile ? "16px 20px" : "16px 32px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: isMobile ? "15px" : "18px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    touchAction: "manipulation",
    minHeight: "48px",
    width: "100%",
    boxSizing: "border-box"
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
        maxWidth: isMobile ? "280px" : "400px",
        alignItems: "center"
      }}>
        {gameButtons.map((game, index) => (
          <Link 
            key={index}
            to={game.path} 
            style={{
              ...gameButtonStyle,
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "18px" }}>{game.emoji}</span>
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
