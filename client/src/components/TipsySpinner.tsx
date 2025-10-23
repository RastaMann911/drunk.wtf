import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// Wheel options - reorganized so no duplicates are adjacent
const wheelOptions = [
  'Pachinko',
  '2 Schlücke',
  'Würfel Trinken',
  '4 Schlücke',
  'Chance',
  '2 Schlücke Verteilen',
  'Allgemein Wissen',
  '4 Schlücke Verteilen',
  'Blackjack',
  'Weitwurf',
  'Pachinko',
  'Würfel Verteilen',
  '2 Schlücke',
  'Chance',
  '4 Schlücke',
  'Blackjack',
  '2 Schlücke Verteilen',
  'Würfel Trinken',
  'Allgemein Wissen',
  'Weitwurf',
  '4 Schlücke Verteilen',
  'Würfel Verteilen'
];

// Get color for each segment - grey tones for most, colorful for special ones
const getSegmentColor = (option: string) => {
  // Special colorful segments
  if (option === 'Pachinko') return '#FF6B00';
  if (option === 'Würfel Trinken') return '#DC143C';
  if (option === 'Chance') return '#9B30FF';
  if (option === 'Allgemein Wissen') return '#00CC00';
  if (option === 'Blackjack') return '#FFD700';
  
  // Default grey tones for other segments
  const greyTones = [
    '#4A4A4A', '#5A5A5A', '#6A6A6A', '#7A7A7A',
    '#505050', '#606060', '#707070', '#555555',
    '#656565', '#757575', '#585858', '#686868',
    '#4F4F4F', '#5F5F5F', '#6F6F6F', '#7F7F7F',
    '#525252'
  ];
  return greyTones[Math.floor(Math.random() * greyTones.length)];
};

// Generate segment colors array
const segmentColors = wheelOptions.map(option => getSegmentColor(option));

// White text for all segments
const textColor = '#FFFFFF';

export default function TipsySpinner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [result, setResult] = useState('');
  const navigate = useNavigate();
  
  // Physics configuration - ADJUST THESE VALUES
  const PIN_RESISTANCE = 0.08; // Resistance applied when flapper hits a pin (0.05 - 0.15 recommended)
  const BASE_FRICTION = 0.995; // Base deceleration between pins (0.99 - 0.999 recommended)
  const MIN_SPEED_TO_PASS_PIN = 0.015; // Minimum speed needed to pass a pin
  const SPIN_SPEED_MIN = 0.15; // Minimum initial spin speed
  const SPIN_SPEED_MAX = 0.35; // Maximum initial spin speed
  
  // Flapper spring–damper parameters (angular model)
  const K_SPRING = 45; // spring stiffness (rad/s^2 per rad)
  const C_DAMP = 6; // damping (rad/s per rad/s) – a bit lower for more visible bend
  const THETA_MAX = Math.PI * (50 / 180); // max flapper deflection in radians (~50°)
  const CLEARANCE = Math.PI * (6 / 180); // angular clearance before contact in radians
  const PIN_WIDTH = Math.PI * (8 / 180); // effective angular width of a pin
  const IMPULSE_FACTOR = 0.02; // smaller reduction for more gradual slowdown
  
  const gameStateRef = useRef({
    angle: 0,
    angularVelocity: 0,
    isSpinning: false,
    flapperAngle: 0, // angular deflection of flapper (rad), 0 = straight down
    flapperAngularVelocity: 0, // rad/s
    lastPinIndex: -1,
    result: '',
    segmentAtTop: -1, // Track which segment is currently at the top (where flapper points)
    audioContext: null as AudioContext | null,
    winningSegment: -1, // Index of winning segment for neon effect
    neonAnimationTime: 0, // Time elapsed for neon animation
    showNeonEffect: false // Whether to show neon effect
  });

  // Slot machine state
  const [slotGame, setSlotGame] = useState<string>('');
  const [slotMultiplier, setSlotMultiplier] = useState<number | null>(null);
  const [multiplierHit, setMultiplierHit] = useState<boolean>(false);
  const [isSpinningGameSlot, setIsSpinningGameSlot] = useState<boolean>(false);
  const [isSpinningMultiplierSlot, setIsSpinningMultiplierSlot] = useState<boolean>(false);
  const [showMultiplierX, setShowMultiplierX] = useState<boolean>(false);
  const countAnimRef = useRef<number | null>(null);

  // Vertical reel states
  const ITEM_HEIGHT = 56;
  const [gameReelItems, setGameReelItems] = useState<string[]>([wheelOptions[0], wheelOptions[1], wheelOptions[2]]);
  const [gameReelOffset, setGameReelOffset] = useState<number>(0);
  const [multReelItems, setMultReelItems] = useState<string[]>(['2x','3x','4x']);
  const [multReelOffset, setMultReelOffset] = useState<number>(0);

  // Slot UI styles
  const slotContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 140px",
    gap: "16px",
    alignItems: "center",
    marginBottom: "18px",
    width: 650
  };
  const slotBoxStyle: React.CSSProperties = {
    height: 56,
    borderRadius: 12,
    border: "2px solid rgba(255,255,255,0.15)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.35)",
  };
  const slotTextStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
    color: "#f2f2f2",
    textShadow: "0 1px 6px rgba(0,0,0,0.5)",
    padding: "0 14px",
    textAlign: "center" as const,
    lineHeight: 1.2
  };
  const multiplierTextStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    color: "#FFD700",
    textShadow: "0 0 10px rgba(255,215,0,0.5)",
  };

  // Weighted multiplier selection (favor lower values)
  const multiplierWeights: { value: number; weight: number }[] = [
    { value: 2, weight: 0.35 },
    { value: 3, weight: 0.25 },
    { value: 4, weight: 0.18 },
    { value: 5, weight: 0.12 },
    { value: 7, weight: 0.07 },
    { value: 10, weight: 0.03 }
  ];
  const pickWeightedMultiplier = () => {
    const r = Math.random();
    let acc = 0;
    for (const m of multiplierWeights) {
      acc += m.weight;
      if (r <= acc) return m.value;
    }
    return 2;
  };

  const spinSlots = () => {
    setShowMultiplierX(false);
    // pick targets
    const targetGame = wheelOptions[Math.floor(Math.random() * wheelOptions.length)];
    const targetMultiplier = pickWeightedMultiplier();
    const willHit = Math.random() < 0.5;
    setSlotGame(targetGame);
    setSlotMultiplier(targetMultiplier);
    setMultiplierHit(willHit);

    // Prepare reels with current center
    setGameReelItems(prev => [prev[1] || targetGame, prev[2] || targetGame, prev[0] || targetGame]);
    setGameReelOffset(0);
    setMultReelItems(prev => [prev[1] || '2x', prev[2] || '3x', prev[0] || '4x']);
    setMultReelOffset(0);

    // Spin game reel vertically (~1.1s)
    setIsSpinningGameSlot(true);
    let lastTimeGame = performance.now();
    const gameEndTime = lastTimeGame + 1100;
    const gameSpeed = 520; // px/s
    const stepGame = (now: number) => {
      const dt = (now - lastTimeGame) / 1000;
      lastTimeGame = now;
      setGameReelOffset(prev => {
        let next = prev - gameSpeed * dt;
        if (next <= -ITEM_HEIGHT) {
          // cycle items
          setGameReelItems(items => {
            const [first, ...rest] = items;
            return [...rest, first];
          });
          next += ITEM_HEIGHT;
        }
        return next;
      });
      if (now < gameEndTime) {
        animationRef.current = requestAnimationFrame(stepGame);
      } else {
        // stop aligned on target in center
        setGameReelItems(items => {
          const center = targetGame;
          const before = wheelOptions[(wheelOptions.indexOf(center) - 1 + wheelOptions.length) % wheelOptions.length];
          const after = wheelOptions[(wheelOptions.indexOf(center) + 1) % wheelOptions.length];
          return [before, center, after];
        });
        setGameReelOffset(-ITEM_HEIGHT);
        setIsSpinningGameSlot(false);
      }
    };
    animationRef.current = requestAnimationFrame(stepGame);

    // Spin multiplier after 1s (~0.8s)
    setTimeout(() => {
      setIsSpinningMultiplierSlot(true);
      let lastTimeMul = performance.now();
      const mulEndTime = lastTimeMul + 800;
      const mulSpeed = 560; // px/s
      const stepMul = (now: number) => {
        const dt = (now - lastTimeMul) / 1000;
        lastTimeMul = now;
        setMultReelOffset(prev => {
          let next = prev - mulSpeed * dt;
          if (next <= -ITEM_HEIGHT) {
            setMultReelItems(items => {
              const [first, ...rest] = items;
              return [...rest, first];
            });
            next += ITEM_HEIGHT;
          }
          return next;
        });
        if (now < mulEndTime) {
          animationRef.current = requestAnimationFrame(stepMul);
        } else {
          const center = `${targetMultiplier}x`;
          const multValues = multiplierWeights.map(m => `${m.value}x`);
          const idx = multValues.indexOf(center);
          const before = multValues[(idx - 1 + multValues.length) % multValues.length];
          const after = multValues[(idx + 1) % multValues.length];
          setMultReelItems([before, center, after]);
          setMultReelOffset(-ITEM_HEIGHT);
          setIsSpinningMultiplierSlot(false);
          if (!willHit) setShowMultiplierX(true);
        }
      };
      animationRef.current = requestAnimationFrame(stepMul);
    }, 1000);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#2a2a2a",
    color: "#f2f2f2",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    textAlign: "center"
  };

  const backButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "20px",
    left: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#f2f2f2",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "10px 20px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    zIndex: 10,
    backdropFilter: "blur(10px)",
    transition: "all 0.2s ease"
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "2.5rem",
    fontWeight: "700",
    marginBottom: "30px",
    margin: "0 0 30px 0",
    color: "#f2f2f2",
    letterSpacing: "-0.5px",
    textShadow: "0 2px 10px rgba(0,0,0,0.3)"
  };

  const resultStyle: React.CSSProperties = {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginTop: "30px",
    padding: "20px 40px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    minHeight: "70px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    color: "#f2f2f2",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 60;
    const numSegments = wheelOptions.length;
    const segmentAngle = (Math.PI * 2) / numSegments;

    // Pin properties
    const pinRadius = 8;
    const pinDistance = radius + 15; // Pins at outer edge

    // Flapper properties - oval shaped with narrow base
    const flapperLength = 55;
    const flapperMaxWidth = 18; // Widest point in the middle
    const flapperBaseWidth = 8; // Narrow at the base
    const flapperBaseY = centerY - radius - 45; // moved slightly upward so only the lower tip collides
    
    // Initialize audio context
    if (!gameStateRef.current.audioContext) {
      try {
        gameStateRef.current.audioContext = new AudioContext();
      } catch (e) {
        // Audio not supported
      }
    }

    const playPinSound = (intensity: number) => {
      const audioCtx = gameStateRef.current.audioContext;
      if (!audioCtx) return;
      
      try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = 600 + (intensity * 400);
        gainNode.gain.value = Math.min(0.15, intensity * 0.3);
        oscillator.type = 'sine';
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.08);
      } catch (e) {
        // Audio failed
      }
    };

    const drawWheel = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gameState = gameStateRef.current;

      // Draw outer rim with dark grey
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 40;
      
      // Draw dark grey outer rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 25, 0, Math.PI * 2);
      const rimGradient = ctx.createRadialGradient(centerX, centerY, radius + 15, centerX, centerY, radius + 25);
      rimGradient.addColorStop(0, '#3A3A3A');
      rimGradient.addColorStop(0.5, '#2F2F2F');
      rimGradient.addColorStop(1, '#252525');
      ctx.fillStyle = rimGradient;
      ctx.fill();
      
      // Inner rim shadow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = '#1F1F1F';
      ctx.fill();
      
      ctx.restore();
      
      // Draw wheel segments with vibrant colors
      // Track which segment is at the top (where flapper points)
      let segmentAtTop = -1;
      
      for (let i = 0; i < numSegments; i++) {
        const startAngle = gameState.angle + i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;
        
        // Normalize angles to check if this segment is at the top (-PI/2)
        const normalizedStart = ((startAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const normalizedEnd = ((endAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const topAngle = ((- Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        
        // Check if the top position falls within this segment
        if (normalizedStart <= normalizedEnd) {
          if (topAngle >= normalizedStart && topAngle < normalizedEnd) {
            segmentAtTop = i;
          }
        } else {
          // Handle wrap-around at 0/2π
          if (topAngle >= normalizedStart || topAngle < normalizedEnd) {
            segmentAtTop = i;
          }
        }

        // Check if this is the winning segment and should show neon effect
        const isWinningSegment = gameState.showNeonEffect && i === gameState.winningSegment;
        
        // Draw segment with slight inner shadow
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        // Vibrant solid color
        ctx.fillStyle = segmentColors[i % segmentColors.length];
        ctx.fill();
        
        // Segment border (enhanced for winning segment)
        if (isWinningSegment) {
          // Animated neon glow effect
          const pulseIntensity = Math.sin(gameState.neonAnimationTime * 10) * 0.5 + 0.5;
          const glowSize = 15 + pulseIntensity * 10;
          
          // Multiple glow layers for neon effect
          ctx.shadowColor = `rgba(0, 255, 255, ${0.8 * pulseIntensity})`;
          ctx.shadowBlur = glowSize;
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.9 + pulseIntensity * 0.1})`;
          ctx.lineWidth = 5 + pulseIntensity * 3;
          ctx.stroke();
          
          // Second layer - different color
          ctx.shadowColor = `rgba(255, 0, 255, ${0.6 * pulseIntensity})`;
          ctx.shadowBlur = glowSize * 0.7;
          ctx.strokeStyle = `rgba(255, 0, 255, ${0.7 + pulseIntensity * 0.3})`;
          ctx.lineWidth = 3 + pulseIntensity * 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#3A3A3A';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();

        // Draw text with shadow (brighter for winning segment)
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = textColor;
        ctx.font = isWinningSegment ? 'bold 15px Inter, Arial' : 'bold 13px Inter, Arial';
        ctx.shadowColor = isWinningSegment 
          ? `rgba(0, 255, 255, ${0.8 * (Math.sin(gameState.neonAnimationTime * 10) * 0.5 + 0.5)})`
          : 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = isWinningSegment ? 10 : 3;
        ctx.fillText(wheelOptions[i], radius - 25, 5);
        ctx.restore();
      }
      
      // Store the segment at top for result calculation
      gameState.segmentAtTop = segmentAtTop;

      // Draw dark grey pins at outer edge of each segment
      for (let i = 0; i < numSegments; i++) {
        const pinAngle = gameState.angle + i * segmentAngle - Math.PI / 2;
        const pinX = centerX + Math.cos(pinAngle) * pinDistance;
        const pinY = centerY + Math.sin(pinAngle) * pinDistance;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        
        // Dark grey pin with gradient
        const pinGradient = ctx.createRadialGradient(pinX - 2, pinY - 2, 0, pinX, pinY, pinRadius);
        pinGradient.addColorStop(0, '#4A4A4A');
        pinGradient.addColorStop(0.5, '#3A3A3A');
        pinGradient.addColorStop(1, '#2A2A2A');
        
        ctx.beginPath();
        ctx.arc(pinX, pinY, pinRadius, 0, Math.PI * 2);
        ctx.fillStyle = pinGradient;
        ctx.fill();
        
        // Pin border
        ctx.strokeStyle = '#1F1F1F';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      }

      // Draw center circle with dark gradient
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 45);
      centerGradient.addColorStop(0, '#4A4A4A');
      centerGradient.addColorStop(0.5, '#3A3A3A');
      centerGradient.addColorStop(1, '#2A2A2A');
      
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
      ctx.fillStyle = centerGradient;
      ctx.fill();
      
      // Center border
      ctx.strokeStyle = '#1F1F1F';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      ctx.restore();

      // Draw flapper - FIXED position, oval shaped, bends when pins hit it
      ctx.save();
      ctx.translate(centerX, flapperBaseY);
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      
      // Draw flapper as a smooth curved path that bends from pin contact
      const bendSegments = 10;
      const segmentLength = flapperLength / bendSegments;
      
      // Build the flapper path with smooth curves
      const points = [];
      let currentX = 0;
      let currentY = 0;
      let currentAngle = 0;
      
      for (let i = 0; i <= bendSegments; i++) {
        const t = i / bendSegments;
        // Progressive bend - more bend at the tip
        const bendAmount = gameState.flapperAngle * Math.pow(t, 2.5);
        currentAngle = bendAmount;
        
        if (i > 0) {
          currentX += Math.sin(currentAngle) * segmentLength;
          currentY += Math.cos(currentAngle) * segmentLength;
        }
        
        // Calculate width at this point - oval shape (narrow at base, wide in middle, narrow at tip)
        // Use a smooth curve for width distribution
        const widthT = Math.sin(t * Math.PI); // 0 at base, 1 at middle, 0 at tip
        const width = flapperBaseWidth + (flapperMaxWidth - flapperBaseWidth) * widthT;
        
        points.push({ x: currentX, y: currentY, angle: currentAngle, width: width });
      }
      
      // Draw oval flapper body
      ctx.beginPath();
      ctx.moveTo(-flapperBaseWidth / 2, 0);
      
      // Left side of flapper with varying width
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const offsetX = -Math.cos(point.angle) * (point.width / 2);
        const offsetY = Math.sin(point.angle) * (point.width / 2);
        ctx.lineTo(point.x + offsetX, point.y + offsetY);
      }
      
      // Rounded tip
      const tipPoint = points[points.length - 1];
      ctx.arc(
        tipPoint.x,
        tipPoint.y,
        tipPoint.width / 2,
        tipPoint.angle - Math.PI / 2,
        tipPoint.angle + Math.PI / 2
      );
      
      // Right side of flapper (back to base)
      for (let i = points.length - 1; i >= 0; i--) {
        const point = points[i];
        const offsetX = Math.cos(point.angle) * (point.width / 2);
        const offsetY = -Math.sin(point.angle) * (point.width / 2);
        ctx.lineTo(point.x + offsetX, point.y + offsetY);
      }
      
      // Rounded base (smaller)
      ctx.arc(0, 0, flapperBaseWidth / 2, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      
      // Fill with gradient
      const flapperGradient = ctx.createLinearGradient(-flapperMaxWidth, 0, flapperMaxWidth, 0);
      flapperGradient.addColorStop(0, '#5DADE2');
      flapperGradient.addColorStop(0.5, '#3498DB');
      flapperGradient.addColorStop(1, '#5DADE2');
      
      ctx.fillStyle = flapperGradient;
      ctx.fill();
      
      // Border
      ctx.strokeStyle = '#2874A6';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      // Add highlight for 3D effect along the left edge
      ctx.beginPath();
      ctx.moveTo(-flapperBaseWidth / 3, 0);
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const offsetX = -Math.cos(point.angle) * (point.width / 3);
        const offsetY = Math.sin(point.angle) * (point.width / 3);
        ctx.lineTo(point.x + offsetX, point.y + offsetY);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();

      // Draw flapper pivot (smaller to match base)
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      
      const pivotGradient = ctx.createRadialGradient(centerX - 1, flapperBaseY - 1, 0, centerX, flapperBaseY, 10);
      pivotGradient.addColorStop(0, '#5DADE2');
      pivotGradient.addColorStop(1, '#2874A6');
      
      ctx.beginPath();
      ctx.arc(centerX, flapperBaseY, 10, 0, Math.PI * 2);
      ctx.fillStyle = pivotGradient;
      ctx.fill();
      ctx.strokeStyle = '#3A3A3A';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.restore();

      // No instruction text needed - wheel is self-explanatory
    };

    const processFlapperAndContact = (deltaTime: number) => {
      const gameState = gameStateRef.current;
      
      // Helper to normalize to [-PI, PI]
      const wrapToPi = (a: number) => {
        let x = ((a + Math.PI) % (2 * Math.PI));
        if (x < 0) x += 2 * Math.PI;
        return x - Math.PI;
      };
      
      // Compute current flapper tip world position (matches drawing geometry)
      const bendSegments = 10;
      const segmentLength = flapperLength / bendSegments;
      let tipLocalX = 0;
      let tipLocalY = 0;
      for (let i = 0; i <= bendSegments; i++) {
        const t = i / bendSegments;
        const bendAmount = gameState.flapperAngle * Math.pow(t, 2.5);
        if (i > 0) {
          tipLocalX += Math.sin(bendAmount) * segmentLength;
          tipLocalY += Math.cos(bendAmount) * segmentLength;
        }
      }
      const flapperTipX = centerX + tipLocalX;
      const flapperTipY = flapperBaseY + tipLocalY;
      
      // Determine closest pin near the flapper (flapper is at world angle -PI/2)
      let closestIndex = -1;
      let closestAbsDiff = Number.POSITIVE_INFINITY;
      let closestDiff = 0;
      let closestPinX = 0;
      let closestPinY = 0;
      
      for (let i = 0; i < numSegments; i++) {
        // Pin world angle already offset by -PI/2 in drawing/checks
        const pinAngle = gameState.angle + i * segmentAngle - Math.PI / 2;
        // Relative angle to flapper location (-PI/2) simplifies to angle + i*segmentAngle
        const relToFlapper = wrapToPi(gameState.angle + i * segmentAngle);
        const absRel = Math.abs(relToFlapper);
        if (absRel < closestAbsDiff) {
          closestAbsDiff = absRel;
          closestIndex = i;
          closestDiff = relToFlapper;
          closestPinX = centerX + Math.cos(pinAngle) * pinDistance;
          closestPinY = centerY + Math.sin(pinAngle) * pinDistance;
        }
      }
      
      // Compute target deflection based on overlap within contact window
      const contactHalfWidth = (PIN_WIDTH / 2) + CLEARANCE;
      let thetaTarget = 0;
      let inContact = false;
      // Require both angular overlap and radial proximity at the flapper TIP
      if (closestIndex >= 0 && closestAbsDiff < contactHalfWidth) {
        const dx = flapperTipX - closestPinX;
        const dy = flapperTipY - closestPinY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const tipRadius = (flapperBaseWidth / 2);
        const radialContact = distance < (pinRadius + tipRadius + 2); // small margin
        
        if (radialContact) {
          inContact = true;
          const overlap = contactHalfWidth - closestAbsDiff;
          const fraction = Math.min(1, Math.max(0, overlap / contactHalfWidth));
          // Stronger bend response near contact using sqrt curve
          thetaTarget = THETA_MAX * Math.sqrt(fraction);
          // Add slight velocity-coupled extra deflection
          const speed = Math.abs(gameState.angularVelocity);
          thetaTarget = Math.min(THETA_MAX, thetaTarget + Math.min(THETA_MAX * 0.25, speed * 0.8));
        }
      }
      
      // Spring–damper integration: theta_ddot = k*(target - theta) - c*theta_dot
      const theta = gameState.flapperAngle;
      const thetaDot = gameState.flapperAngularVelocity;
      const thetaAcc = K_SPRING * (thetaTarget - theta) - C_DAMP * thetaDot;
      gameState.flapperAngularVelocity += thetaAcc * deltaTime;
      gameState.flapperAngle += gameState.flapperAngularVelocity * deltaTime;
      
      // Clamp to physical limits
      if (Math.abs(gameState.flapperAngle) > THETA_MAX) {
        gameState.flapperAngle = Math.sign(gameState.flapperAngle) * THETA_MAX;
        gameState.flapperAngularVelocity *= -0.2;
      }
      
      // Optional impulse when contact peaks near center
      if (inContact) {
        const nearCenter = Math.abs(closestDiff) < (PIN_WIDTH * 0.25);
        if (nearCenter && gameState.lastPinIndex !== closestIndex) {
          const speed = Math.abs(gameState.angularVelocity);
          if (speed < MIN_SPEED_TO_PASS_PIN) {
            // Too slow to cleanly pass: soften rather than stop abruptly
            gameState.angularVelocity *= 0.5; // bleed speed but continue spinning
            playPinSound(0.25);
          } else {
            // Apply tiny energy loss (impulse) and sound
            gameState.angularVelocity *= (1 - IMPULSE_FACTOR);
            playPinSound(Math.min(1, speed * 3));
          }
          gameState.lastPinIndex = closestIndex;
        }
      } else {
        // When no longer in contact with the previously recorded pin, allow re-triggering
        if (closestIndex !== gameState.lastPinIndex) {
          gameState.lastPinIndex = -1;
        }
      }
    };

    const updatePhysics = (deltaTime: number) => {
      const gameState = gameStateRef.current;

      if (gameState.isSpinning) {
        // Update wheel rotation
        gameState.angle += gameState.angularVelocity;
        
        // Apply base friction (air resistance)
        gameState.angularVelocity *= BASE_FRICTION;
        
        // Flapper contact and spring–damper response
        processFlapperAndContact(deltaTime);
        
        // Stop spinning when velocity is extremely low
        if (Math.abs(gameState.angularVelocity) < 0.0001 && gameState.isSpinning) {
          gameState.angularVelocity = 0;
          gameState.isSpinning = false;
          
          // Use the segment that was calculated during drawing
          // This is the segment that is actually at the top where the flapper points
          const segmentIndex = gameState.segmentAtTop >= 0 ? gameState.segmentAtTop : 0;
          
          const finalText = wheelOptions[segmentIndex];
          // If slots matched and multiplier hit, animate multiplication into the label if numeric present
          if (!isSpinningGameSlot && !isSpinningMultiplierSlot && slotGame && finalText === slotGame && multiplierHit && slotMultiplier) {
            // If the text contains a leading number like '2 Schlücke', multiply it
            const match = finalText.match(/^(\d+)\s*(.*)$/);
            if (match) {
              const base = parseInt(match[1], 10);
              const rest = match[2];
              const target = base * slotMultiplier;
              const start = performance.now();
              const animate = (now: number) => {
                const t = Math.min(1, (now - start) / 500);
                const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
                const curr = Math.round(base + (target - base) * eased);
                setResult(`${curr} ${rest}`);
                if (t < 1) {
                  animationRef.current = requestAnimationFrame(animate);
                }
              };
              animationRef.current = requestAnimationFrame(animate);
            } else {
              setResult(finalText);
            }
          } else {
            setResult(finalText);
          }
          gameState.result = finalText;
          
          // Start neon animation for winning segment
          gameState.winningSegment = segmentIndex;
          gameState.showNeonEffect = true;
          gameState.neonAnimationTime = 0;
          
          // Check if Pachinko was hit - navigate to Plinko game (pass multiplier only if slot hit)
          if (wheelOptions[segmentIndex] === 'Pachinko') {
            const hasMult = multiplierHit && !!slotMultiplier && slotMultiplier > 1;
            setTimeout(() => {
              if (hasMult) {
                navigate(`/plinko?multiplier=${slotMultiplier}`);
              } else {
                navigate('/plinko');
              }
            }, 1500);
          }
          // Allgemein Wissen quiz
          if (wheelOptions[segmentIndex] === 'Allgemein Wissen') {
            const mult = multiplierHit && slotMultiplier ? slotMultiplier : 1;
            setTimeout(() => {
              navigate(`/quiz?multiplier=${mult}`);
            }, 1200);
          }
          // Navigate to Blackjack with multiplier when applicable
          if (wheelOptions[segmentIndex] === 'Blackjack') {
            const mult = multiplierHit && slotMultiplier ? slotMultiplier : 1;
            setTimeout(() => {
              navigate(`/blackjack?multiplier=${mult}`);
            }, 1200);
          }
          // Navigate to dice games with multiplier when applicable
          if (wheelOptions[segmentIndex] === 'Würfel Trinken') {
            const mult = multiplierHit && slotMultiplier ? slotMultiplier : 1;
            setTimeout(() => {
              navigate(`/dice-trinken?multiplier=${mult}`);
            }, 1200);
          }
          if (wheelOptions[segmentIndex] === 'Würfel Verteilen') {
            const mult = multiplierHit && slotMultiplier ? slotMultiplier : 1;
            setTimeout(() => {
              navigate(`/dice-verteilen?multiplier=${mult}`);
            }, 1200);
          }
        }
      }
      
      // Update neon animation
      if (gameState.showNeonEffect) {
        gameState.neonAnimationTime += deltaTime;
        
        // Stop neon effect after 1 second
        if (gameState.neonAnimationTime >= 1.0) {
          gameState.showNeonEffect = false;
          gameState.neonAnimationTime = 0;
        }
      }

      // When not spinning, still relax flapper towards rest with spring–damper
      if (!gameState.isSpinning) {
        const theta = gameState.flapperAngle;
        const thetaDot = gameState.flapperAngularVelocity;
        const thetaAcc = K_SPRING * (0 - theta) - C_DAMP * thetaDot;
        gameState.flapperAngularVelocity += thetaAcc * deltaTime;
        gameState.flapperAngle += gameState.flapperAngularVelocity * deltaTime;
        if (Math.abs(gameState.flapperAngle) < 1e-3 && Math.abs(gameState.flapperAngularVelocity) < 1e-3) {
          gameState.flapperAngle = 0;
          gameState.flapperAngularVelocity = 0;
        }
      }
    };

    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      updatePhysics(deltaTime);
      drawWheel();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [navigate]);

  const handleSpin = () => {
    const gameState = gameStateRef.current;
    
    if (!gameState.isSpinning) {
      // spin slots concurrently
      spinSlots();
      // Random spin velocity within configured range
      const speed = Math.random() * (SPIN_SPEED_MAX - SPIN_SPEED_MIN) + SPIN_SPEED_MIN;
      gameState.angularVelocity = speed * (Math.random() > 0.5 ? 1 : -1);
      gameState.isSpinning = true;
      gameState.result = '';
      gameState.lastPinIndex = -1;
      gameState.flapperAngle = 0;
      gameState.flapperAngularVelocity = 0;
      setResult('');
    }
  };

  return (
    <div style={containerStyle}>
      <Link to="/" style={backButtonStyle}>
        ← Back to Home
      </Link>
      
      {/* Slot machine header (two columns): game and multiplier */}
      <div style={slotContainerStyle}>
        <div style={{ ...slotBoxStyle, alignItems: 'stretch' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', boxShadow: 'inset 0 -20px 20px rgba(0,0,0,0.35), inset 0 20px 20px rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT, transform: `translateY(${gameReelOffset}px)`, transition: isSpinningGameSlot ? 'none' : 'transform 140ms ease-out' }}>
            <div style={{ ...slotTextStyle, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{gameReelItems[0]}</div>
            <div style={{ ...slotTextStyle, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{gameReelItems[1]}</div>
            <div style={{ ...slotTextStyle, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{gameReelItems[2]}</div>
          </div>
        </div>
        <div style={{ ...slotBoxStyle, position: 'relative', alignItems: 'stretch' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', boxShadow: 'inset 0 -20px 20px rgba(0,0,0,0.35), inset 0 20px 20px rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT, transform: `translateY(${multReelOffset}px)`, transition: isSpinningMultiplierSlot ? 'none' : 'transform 140ms ease-out' }}>
            <div style={{ ...multiplierTextStyle, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{multReelItems[0]}</div>
            <div style={{ ...multiplierTextStyle, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{multReelItems[1]}</div>
            <div style={{ ...multiplierTextStyle, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{multReelItems[2]}</div>
          </div>
          {showMultiplierX && !isSpinningMultiplierSlot && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#FF4D4D', fontWeight: 900, fontSize: 28, textShadow: '0 0 10px rgba(255,0,0,0.6)' }}>✖</div>
            </div>
          )}
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={650}
        height={650}
        onClick={handleSpin}
        style={{
          cursor: 'pointer',
          borderRadius: '20px',
          backgroundColor: 'transparent',
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!gameStateRef.current.isSpinning) {
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      />
      
      <div style={resultStyle}>
        {result ? (
          <>
            <span style={{ fontSize: '1.8rem', marginRight: '12px' }}>🎉</span>
            <strong>{result}</strong>
          </>
        ) : (
          <span style={{ color: '#95A5A6' }}>Spin the wheel to get your challenge!</span>
        )}
      </div>
    </div>
  );
}
