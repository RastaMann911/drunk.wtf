import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import logo from '../logo.png';
import TipsySpinner from './components/TipsySpinner';
import PlinkoWithCountdown from './components/PlinkoWithCountdown';
import BlackjackWithCountdown from './components/BlackjackWithCountdown';
import QuizWithCountdown from './components/QuizWithCountdown';
import DiceWithCountdown from './components/DiceWithCountdown';
import PasswordGate from './components/PasswordGate';

function HomePage() {
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#2f2f2f",
    color: "#f2f2f2",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: "60px",    
    padding: "20px",
    textAlign: "center"
  };

  const logoStyle: React.CSSProperties = {
    width: "120px",
    height: "120px",
    marginBottom: "32px"
  };

  const headlineStyle: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: "600",
    marginBottom: "16px",
    margin: "0 0 16px 0"
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "400",
    opacity: "0.9",
    margin: "0 0 40px 0"
  };

  const gameButtonStyle: React.CSSProperties = {
    backgroundColor: "#f2f2f2",
    color: "#2f2f2f",
    border: "none",
    borderRadius: "12px",
    padding: "16px 32px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "18px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "all 0.3s ease"
  };

  return (
    <div style={containerStyle}>
      <img src={logo} alt="Drunk.WTF Logo" style={logoStyle} />
      <h1 style={headlineStyle}>Welcome to Drunk.WTF</h1>
      <p style={subtitleStyle}>A chill place for browser-based party games 🍻</p>
      
      <Link to="/tipsy-spinner" style={gameButtonStyle}>
        🎯 Tipsy Spinner
      </Link>
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
