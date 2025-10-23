import React, { useEffect, useRef, useState } from 'react';

const PlinkoGame = () => {
  const canvasRef = useRef(null);
  const [multipliers, setMultipliers] = useState({
    "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "7": 0, "10": 0, "25": 0, "DOUBLE": 0
  });
  const [isPressingPlay, setIsPressingPlay] = useState(false);
  const gameStateRef = useRef({
    balls: [],
    obstacles: [],
    multis: [],
    prevMultis: [],
    animations: [],
    segments: [],
    audioContext: null,
    sounds: {},
    doubleSeq: {
      active: false,
      t: 0,
      duration: 2.0,
      hitTileIndex: -1,
      cameraScale: 1.0,
      flashAlpha: 0,
      bloomAlpha: 0,
      shockwave: { r: 0, alpha: 0 },
      watermarkAlpha: 0,
      lensSweep: 0,
      labelAnim: [],
      keepDoubleGlow: false,
      scheduledRedrop: false
    }
  });

  // Constants - scaled down to fit viewport
  const WIDTH = 1280;
  const HEIGHT = 720;
  const BG_COLOR = 'rgb(16, 32, 45)';
  const FPS = 60;
  const BALL_RAD = 11;
  const OBSTACLE_RAD = 5;
  const OBSTACLE_PAD = 37;
  const MULTI_HEIGHT = 37;
  const SCORE_RECT = 80;
  const OBSTACLE_START = [603, 72];
  const GRAVITY = 1800;

  // Multiplier options with probabilities
  const multiplierOptions = [
    { value: 1, probability: 0.18, color: 'rgb(255, 100, 100)', isDouble: false },
    { value: 2, probability: 0.18, color: 'rgb(255, 140, 80)', isDouble: false },
    { value: 3, probability: 0.18, color: 'rgb(255, 180, 80)', isDouble: false },
    { value: 4, probability: 0.18, color: 'rgb(255, 200, 80)', isDouble: false },
    { value: 5, probability: 0.10, color: 'rgb(255, 220, 80)', isDouble: false },
    { value: 7, probability: 0.08, color: 'rgb(200, 255, 100)', isDouble: false },
    { value: 10, probability: 0.05, color: 'rgb(150, 255, 100)', isDouble: false },
    { value: 25, probability: 0.025, color: 'rgb(100, 255, 100)', isDouble: false },
    { value: 'DOUBLE', probability: 0.025, color: 'rgb(255, 215, 0)', isDouble: true }
  ];

  // Select random multiplier based on probabilities
  const selectRandomMultiplier = () => {
    const random = Math.random();
    let cumulative = 0;
    
    for (const option of multiplierOptions) {
      cumulative += option.probability;
      if (random <= cumulative) {
        return option;
      }
    }
    
    return multiplierOptions[0]; // Fallback
  };

  // Generate random board configuration
  const generateRandomBoard = () => {
    const board = [];
    for (let i = 0; i < 17; i++) {
      board.push(selectRandomMultiplier());
    }
    return board;
  };

  // Audio setup
  const initAudio = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {};
    
    const createBeep = (freq, duration, volume) => {
      return () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = volume;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      };
    };

    sounds.click = createBeep(400, 0.1, 0.3);
    sounds['1'] = createBeep(200, 0.15, 0.2);
    sounds['2'] = createBeep(250, 0.15, 0.25);
    sounds['3'] = createBeep(300, 0.15, 0.3);
    sounds['4'] = createBeep(350, 0.15, 0.35);
    sounds['5'] = createBeep(400, 0.15, 0.4);
    sounds['7'] = createBeep(500, 0.15, 0.5);
    sounds['10'] = createBeep(600, 0.15, 0.6);
    sounds['25'] = createBeep(700, 0.15, 0.7);
    sounds['DOUBLE'] = createBeep(900, 0.2, 0.9);
    sounds.whoomp = createBeep(120, 0.12, 0.5);
    sounds.tinkle = createBeep(1400, 0.06, 0.25);
    sounds.whoosh = createBeep(700, 0.15, 0.2);

    return { ctx, sounds };
  };

  // Physics helper functions
  const distance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  
  const circleCollision = (ball, obstacle) => {
    const dist = distance(ball.x, ball.y, obstacle.x, obstacle.y);
    return dist < BALL_RAD + OBSTACLE_RAD;
  };

  const resolveCollision = (ball, obstacle) => {
    const dx = ball.x - obstacle.x;
    const dy = ball.y - obstacle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return;
    
    const nx = dx / dist;
    const ny = dy / dist;
    
    const relVel = ball.vx * nx + ball.vy * ny;
    
    if (relVel > 0) return;
    
    const elasticity = 0.65;
    const impulse = -(1 + elasticity) * relVel;
    
    ball.vx += impulse * nx;
    ball.vy += impulse * ny;
    
    const overlap = (BALL_RAD + OBSTACLE_RAD) - dist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
  };

  const checkWallCollision = (ball, segments) => {
    segments.forEach(seg => {
      const { x1, y1, x2, y2 } = seg;
      
      const dx = ball.x - x1;
      const dy = ball.y - y1;
      
      const lx = x2 - x1;
      const ly = y2 - y1;
      
      const lineLen = Math.sqrt(lx * lx + ly * ly);
      if (lineLen === 0) return;
      
      const t = Math.max(0, Math.min(1, (dx * lx + dy * ly) / (lineLen * lineLen)));
      
      const closestX = x1 + t * lx;
      const closestY = y1 + t * ly;
      
      const dist = distance(ball.x, ball.y, closestX, closestY);
      
      if (dist < BALL_RAD + 5) {
        const nx = (ball.x - closestX) / dist;
        const ny = (ball.y - closestY) / dist;
        
        const dotProduct = ball.vx * nx + ball.vy * ny;
        if (dotProduct < 0) {
          const elasticity = 0.5;
          ball.vx -= (1 + elasticity) * dotProduct * nx;
          ball.vy -= (1 + elasticity) * dotProduct * ny;
          
          const overlap = BALL_RAD + 5 - dist;
          ball.x += nx * overlap;
          ball.y += ny * overlap;
        }
      }
    });
  };

  const initObstacles = () => {
    const obstacles = [];
    let currRowCount = 3;
    const finalRowCount = 18;
    let coords = [...OBSTACLE_START];
    let segmentA1, segmentA2, segmentB1, segmentB2;
    
    segmentA2 = [...OBSTACLE_START];

    while (currRowCount <= finalRowCount) {
      for (let i = 0; i < currRowCount; i++) {
        if (currRowCount === 3 && coords[0] > OBSTACLE_START[0] + OBSTACLE_PAD) {
          segmentB1 = [...coords];
        }
        if (currRowCount === finalRowCount && i === 0) {
          segmentA1 = [...coords];
        }
        if (currRowCount === finalRowCount && i === currRowCount - 1) {
          segmentB2 = [...coords];
        }
        
        obstacles.push({ x: coords[0], y: coords[1] });
        coords[0] += OBSTACLE_PAD;
      }
      coords = [WIDTH - coords[0] + (0.5 * OBSTACLE_PAD), coords[1] + OBSTACLE_PAD];
      currRowCount++;
    }

    const segments = [
      { x1: segmentA1[0], y1: segmentA1[1], x2: segmentA2[0], y2: segmentA2[1] },
      { x1: segmentB1[0], y1: segmentB1[1], x2: segmentB2[0], y2: segmentB2[1] },
      { x1: segmentA2[0], y1: 0, x2: segmentA2[0], y2: segmentA2[1] },
      { x1: segmentB1[0], y1: 0, x2: segmentB1[0], y2: segmentB1[1] }
    ];

    return { obstacles, segments, finalCoords: coords };
  };

  const initMultis = (boardConfig) => {
    const multis = [];
    
    let currRowCount = 3;
    const finalRowCount = 18;
    let coords = [...OBSTACLE_START];

    while (currRowCount <= finalRowCount) {
      for (let i = 0; i < currRowCount; i++) {
        coords[0] += OBSTACLE_PAD;
      }
      coords = [WIDTH - coords[0] + (0.5 * OBSTACLE_PAD), coords[1] + OBSTACLE_PAD];
      currRowCount++;
    }

    const multiStartX = coords[0] + OBSTACLE_PAD;
    const multiY = coords[1] + OBSTACLE_PAD;

    for (let i = 0; i < 17; i++) {
      const config = boardConfig[i];
      multis.push({
        x: multiStartX + (i * OBSTACLE_PAD),
        y: multiY,
        value: config.value,
        displayValue: config.value,
        color: config.color,
        isDouble: config.isDouble,
        width: OBSTACLE_PAD - (OBSTACLE_PAD / 14),
        height: MULTI_HEIGHT,
        isAnimating: false,
        animFrame: 0,
        animOffset: 0,
        flip: { progress: 0, active: false }
      });
    }

    return multis;
  };

  const createBall = (x, y) => {
    return {
      x, y,
      vx: 0,
      vy: 0,
      radius: BALL_RAD,
      collided: {}
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const gameState = gameStateRef.current;
    
    const { ctx: audioCtx, sounds } = initAudio();
    gameState.audioContext = audioCtx;
    gameState.sounds = sounds;

    const { obstacles, segments } = initObstacles();
    gameState.obstacles = obstacles;
    gameState.segments = segments;
    
    // Initialize with random board
    const initialBoard = generateRandomBoard();
    gameState.multis = initMultis(initialBoard);

    let lastTime = performance.now();
    let animationId;

    const easeOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const startDoubleSequence = (hitIndex) => {
      const gs = gameStateRef.current;
      if (gs.doubleSeq.active) return;
      gs.doubleSeq.active = true;
      gs.doubleSeq.t = 0;
      gs.doubleSeq.duration = 1.95 + (Math.random() * 0.4 - 0.2);
      gs.doubleSeq.hitTileIndex = hitIndex;
      gs.doubleSeq.cameraScale = 1.0;
      gs.doubleSeq.flashAlpha = 1.0;
      gs.doubleSeq.bloomAlpha = 0.9;
      gs.doubleSeq.shockwave = { r: 0, alpha: 0.9 };
      gs.doubleSeq.watermarkAlpha = 0;
      gs.doubleSeq.lensSweep = 0;
      gs.doubleSeq.keepDoubleGlow = true;
      gs.doubleSeq.scheduledRedrop = false;
      gs.doubleSeq.labelAnim = gs.multis.map((m, idx) => ({
        flip: 0,
        flipDone: false,
        pop: 0,
        countFrom: typeof m.value === 'number' ? m.value : m.value,
        countTo: typeof m.value === 'number' ? m.value * 2 : m.value,
        sparkle: 0,
        delay: 0.12 + (idx * 0.008)
      }));
      try { gs.sounds.whoomp && gs.sounds.whoomp(); } catch (e) {}
    };

    const updateDoubleSequence = (dt, ctx) => {
      const gs = gameStateRef.current;
      if (!gs.doubleSeq.active) return;
      gs.doubleSeq.t += dt;
      const t = gs.doubleSeq.t;
      const total = gs.doubleSeq.duration;
      const hitTile = gs.multis[gs.doubleSeq.hitTileIndex];
      const centerX = hitTile ? hitTile.x : WIDTH / 2;
      const centerY = hitTile ? hitTile.y : HEIGHT - 60;

      const impactT = clamp01(t / 0.3);
      gs.doubleSeq.cameraScale = 1 + 0.08 * easeOutQuint(impactT);
      gs.doubleSeq.flashAlpha = Math.max(0, 1 - impactT * 3);
      gs.doubleSeq.bloomAlpha = Math.max(0, 0.9 - impactT * 3);
      gs.doubleSeq.shockwave.r = 0 + 260 * easeOutExpo(impactT);
      gs.doubleSeq.shockwave.alpha = Math.max(0, 0.9 - impactT * 1.2);

      const labelPhaseStart = 0.12;
      const labelPhaseEnd = 0.7;
      const labelPhase = clamp01((t - labelPhaseStart) / (labelPhaseEnd - labelPhaseStart));
      const sweepPos = labelPhase;

      gs.multis.forEach((m, idx) => {
        const la = gs.doubleSeq.labelAnim[idx];
        if (!la) return;
        const local = clamp01((t - la.delay) / 0.24);
        la.flip = local;
        la.pop = Math.sin(Math.PI * Math.min(1, local)) * 0.12;
        if (typeof m.value === 'number') {
          const countProg = clamp01((t - la.delay) / 0.2);
          const eased = easeOutExpo(countProg);
          const val = Math.round(la.countFrom + (la.countTo - la.countFrom) * eased);
          m.displayValue = val;
        }
        if (local >= 0.5 && !la.flipDone && typeof m.value === 'number') {
          m.value = la.countTo;
          la.flipDone = true;
        }
        if (local >= 0.95 && la.sparkle === 0) {
          la.sparkle = 1;
          try { gameState.sounds.tinkle && gameState.sounds.tinkle(); } catch (e) {}
        }
      });

      const settlePhase = clamp01((t - 0.7) / 0.5);
      gs.doubleSeq.lensSweep = settlePhase;
      gs.doubleSeq.watermarkAlpha = Math.min(0.6, settlePhase * 0.6);

      const redropPhase = clamp01((t - 1.2) / Math.max(0.4, total - 1.2));
      const pullback = 1 - 0.08 * easeOutQuint(redropPhase);
      gs.doubleSeq.cameraScale = Math.max(1.0, Math.min(gs.doubleSeq.cameraScale, pullback));
      if (t > 1.2 && !gs.doubleSeq.scheduledRedrop) {
        gs.doubleSeq.scheduledRedrop = true;
        try { gs.sounds.whoosh && gs.sounds.whoosh(); } catch (e) {}
        setTimeout(() => {
          const randomX = WIDTH / 2 + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 20 + 1);
          const ball = createBall(randomX, 20);
          ball.trail = [];
          gs.balls.push(ball);
        }, 140);
      }

      if (t >= total) {
        gs.doubleSeq.active = false;
        gs.doubleSeq.t = 0;
      }
    };

    const drawDoubleSequenceOverlays = (ctx) => {
      const gs = gameStateRef.current;
      if (!gs.doubleSeq.active) return;
      const { flashAlpha, bloomAlpha, shockwave, lensSweep, watermarkAlpha, hitTileIndex } = gs.doubleSeq;
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      if (bloomAlpha > 0) {
        ctx.fillStyle = `rgba(255, 215, 0, ${bloomAlpha * 0.35})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
      const tile = gs.multis[hitTileIndex];
      if (tile && shockwave.alpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${shockwave.alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(tile.x, tile.y, shockwave.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (lensSweep > 0) {
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
        const pos = lensSweep;
        grad.addColorStop(clamp01(pos - 0.05), 'rgba(255,255,255,0)');
        grad.addColorStop(clamp01(pos), 'rgba(255,255,255,0.15)');
        grad.addColorStop(clamp01(pos + 0.05), 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.restore();
      }
      if (watermarkAlpha > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${watermarkAlpha})`;
        ctx.font = 'bold 140px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×2', WIDTH / 2, HEIGHT * 0.22);
        ctx.restore();
      }
    };

    const gameLoop = (currentTime) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const gs = gameStateRef.current;
      const camScale = gs.doubleSeq.active ? gs.doubleSeq.cameraScale : 1.0;

      ctx.save();
      ctx.translate(WIDTH / 2, HEIGHT / 2);
      ctx.scale(camScale, camScale);
      ctx.translate(-WIDTH / 2, -HEIGHT / 2);

      ctx.fillStyle = 'white';
      gameState.obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, OBSTACLE_RAD, 0, Math.PI * 2);
        ctx.fill();
      });

      gameState.balls = gameState.balls.filter(ball => {
        ball.vy += GRAVITY * deltaTime;
        ball.vx *= 0.995;
        
        ball.x += ball.vx * deltaTime;
        ball.y += ball.vy * deltaTime;

        checkWallCollision(ball, gameState.segments);

        gameState.obstacles.forEach((obs, idx) => {
          if (!ball.collided[idx] && circleCollision(ball, obs)) {
            resolveCollision(ball, obs);
            ball.collided[idx] = true;
            
            gameState.animations.push({
              x: obs.x,
              y: obs.y,
              radius: 16,
              alpha: 125,
              life: 0.5
            });
          }
        });

        let hitMulti = false;
        gameState.multis.forEach((multi, idx) => {
          if (!hitMulti && 
              ball.x > multi.x - multi.width / 2 && 
              ball.x < multi.x + multi.width / 2 &&
              ball.y > multi.y - multi.height / 2 && 
              ball.y < multi.y + multi.height / 2) {
            hitMulti = true;
            
            if (gameState.sounds[multi.value.toString()]) {
              try {
                gameState.sounds[multi.value.toString()]();
              } catch (e) {}
            }
            
            // Update multipliers
            setMultipliers(prev => ({
              ...prev,
              [multi.value.toString()]: prev[multi.value.toString()] + 1
            }));
            
            multi.isAnimating = true;
            multi.animFrame = 0;
            
            gameState.prevMultis.push({
              value: multi.value,
              color: multi.color,
              isDouble: multi.isDouble,
              y: (HEIGHT / 2) - (SCORE_RECT * 2),
              targetY: (HEIGHT / 2) - (SCORE_RECT * 2),
              traveled: 0
            });
            
            if (gameState.prevMultis.length > 5) {
              gameState.prevMultis.shift();
            }
            
            // Only finalize numeric results. If DOUBLE, the re-drop will produce the final numeric tile later
            if (!multi.isDouble) {
              const resultText = `${multi.value}x`;
              window.dispatchEvent(new CustomEvent('plinkoResult', { 
                detail: { result: resultText }
              }));
            }

            if (multi.isDouble) {
              startDoubleSequence(idx);
              gameState.multis.forEach(m => {
                if (typeof m.value === 'number') {
                  m.displayValue = m.value;
                }
              });
            }
          }
        });

        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        return !hitMulti && ball.y < HEIGHT + 100;
      });

      gameState.animations = gameState.animations.filter(anim => {
        anim.life -= deltaTime;
        anim.alpha = 125 * (anim.life / 0.5);
        anim.radius = 16 * (anim.life / 0.5);
        
        if (anim.life > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${anim.alpha / 255})`;
          ctx.beginPath();
          ctx.arc(anim.x, anim.y, anim.radius, 0, Math.PI * 2);
          ctx.fill();
          return true;
        }
        return false;
      });

      gameState.multis.forEach((multi, idx) => {
        if (multi.isAnimating) {
          const totalFrames = 15;
          if (multi.animFrame < totalFrames / 2) {
            multi.animOffset = 2;
          } else {
            multi.animOffset = -2;
          }
          multi.animFrame++;
          if (multi.animFrame >= totalFrames) {
            multi.isAnimating = false;
            multi.animFrame = 0;
            multi.animOffset = 0;
          }
        }
        let sweepTint = 0;
        if (gameState.doubleSeq.active) {
          const la = gameState.doubleSeq.labelAnim[idx];
          if (la) sweepTint = Math.max(0, Math.min(1, (gameState.doubleSeq.lensSweep * gameState.multis.length - idx) * 0.2 + 0.5));
        }
        ctx.fillStyle = multi.color;
        const rectX = multi.x - multi.width / 2;
        const rectY = multi.y - multi.height / 2 + multi.animOffset;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, multi.width, multi.height, 10);
        ctx.fill();

        if (sweepTint > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * sweepTint})`;
          ctx.roundRect(rectX, rectY, multi.width, multi.height, 10);
          ctx.fill();
        }
        const la = gameState.doubleSeq.labelAnim[idx];
        const popScale = 1 + (la ? la.pop : 0);
        const flipProg = la ? la.flip : 0;
        const flipAngle = Math.PI * Math.min(1, Math.max(0, flipProg));
        const yScale = Math.cos(flipAngle);
        ctx.save();
        ctx.translate(multi.x, multi.y + multi.animOffset);
        ctx.scale(1, Math.max(0.15, yScale) * popScale);
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = multi.isDouble ? 'rgb(0, 0, 0)' : 'black';
        ctx.font = multi.isDouble ? 'bold 15px Arial' : '17px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayText = multi.isDouble ? '2X' : `${(typeof multi.displayValue === 'number') ? multi.displayValue : multi.value}x`;
        ctx.fillText(displayText, 0, 0);
        ctx.restore();

        if (la && la.sparkle > 0) {
          ctx.save();
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          for (let s = 0; s < 6; s++) {
            const ang = (Math.PI * 2 * s) / 6;
            const sx = multi.x + Math.cos(ang) * 8;
            const sy = multi.y + Math.sin(ang) * 8;
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        if (gameState.doubleSeq.keepDoubleGlow && multi.isDouble) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255,215,0,0.35)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(rectX - 3, rectY - 3, multi.width + 6, multi.height + 6, 12);
          ctx.stroke();
          ctx.restore();
        }
      });

      gameState.prevMultis.forEach((pm, idx) => {
        const targetOffset = (idx + 1) * SCORE_RECT;
        pm.targetY = (HEIGHT / 2) - (SCORE_RECT * 2) + targetOffset;
        
        if (pm.y < pm.targetY) {
          const speed = 1800 * deltaTime;
          pm.y = Math.min(pm.y + speed, pm.targetY);
        }
      });

      const rightSide = (WIDTH / 16) * 13;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(rightSide, 0, WIDTH / 4, HEIGHT);
      
      ctx.save();
      ctx.beginPath();
      const maskY = (HEIGHT / 4) + ((HEIGHT / 4) / 9);
      ctx.roundRect(rightSide + 10, maskY, SCORE_RECT, SCORE_RECT * 4, 30);
      ctx.clip();

      gameState.prevMultis.forEach(pm => {
        ctx.fillStyle = pm.color;
        ctx.fillRect(WIDTH * 0.85 - SCORE_RECT / 2, pm.y - SCORE_RECT / 2, SCORE_RECT, SCORE_RECT);
        
        ctx.fillStyle = pm.isDouble ? 'white' : 'black';
        ctx.font = pm.isDouble ? 'bold 21px Arial' : '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayText = pm.isDouble ? '2X' : `${pm.value}x`;
        ctx.fillText(displayText, WIDTH * 0.85, pm.y);
      });
      
      ctx.restore();

      updateDoubleSequence(deltaTime, ctx);
      drawDoubleSequenceOverlays(ctx);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (gameState.audioContext) gameState.audioContext.close();
    };
  }, [isPressingPlay]);

  // Removed click handlers - ball drops automatically after countdown
  
  const dropBall = () => {
    // Generate new random board for each play
    const newBoard = generateRandomBoard();
    gameStateRef.current.multis = initMultis(newBoard);
    
    const randomX = WIDTH / 2 + (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 20 + 1);
    const ball = createBall(randomX, 20);
    gameStateRef.current.balls.push(ball);
    
    if (gameStateRef.current.sounds.click) {
      try {
        gameStateRef.current.sounds.click();
      } catch (e) {}
    }
  };
  
  // Auto-drop ball on mount for countdown mode
  useEffect(() => {
    const timer = setTimeout(() => {
      dropBall();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgb(16, 32, 45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '1280px',
        maxHeight: '720px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{ 
            width: '100%',
            height: '100%',
            imageRendering: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
};

export default PlinkoGame;