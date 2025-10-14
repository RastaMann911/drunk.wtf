import { Link } from 'react-router-dom';

export default function TipsySpinner() {
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

  const backButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    left: "20px",
    backgroundColor: "transparent",
    color: "#f2f2f2",
    border: "2px solid #f2f2f2",
    borderRadius: "8px",
    padding: "8px 16px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block"
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: "600",
    marginBottom: "40px",
    margin: "0 0 40px 0"
  };

  const placeholderStyle: React.CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: "400",
    opacity: "0.8",
    backgroundColor: "#404040",
    padding: "40px",
    borderRadius: "12px",
    border: "2px solid #f2f2f2",
    maxWidth: "500px"
  };

  return (
    <div style={containerStyle}>
      <Link to="/" style={backButtonStyle}>
        ← Back to Home
      </Link>
      
      <h1 style={titleStyle}>🎯 Tipsy Spinner</h1>
      
      <div style={placeholderStyle}>
        <p>Tipsy Spinner game coming soon!</p>
        <p>This is where your game logic will go.</p>
      </div>
    </div>
  );
}
