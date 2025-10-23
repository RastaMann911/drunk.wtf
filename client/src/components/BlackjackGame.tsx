import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Card = { rank: string; suit: '♠' | '♥' | '♦' | '♣'; id: string };

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const suits: Array<'♠' | '♥' | '♦' | '♣'> = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function buildShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of suits) {
    for (const r of ranks) {
      deck.push({ rank: r, suit: s, id: `${r}${s}-${Math.random().toString(36).slice(2)}` });
    }
  }
  // Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(hand: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') { aces++; total += 11; }
    else if (['K','Q','J'].includes(c.rank)) total += 10;
    else total += parseInt(c.rank, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return { total, soft: aces > 0 };
}

export default function BlackjackGame() {
  const query = useQuery();
  const multiplierFromQuery = Math.max(1, Math.min(10, parseInt(query.get('multiplier') || '1', 10) || 1));
  const baseStake = 3; // 3x Schlücke base
  const totalStake = baseStake * multiplierFromQuery;

  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'idle'|'dealing'|'player'|'dealer'|'result'>('idle');
  const [result, setResult] = useState<string>('');
  const [resultType, setResultType] = useState<'win'|'lose'|'push'|''>('');
  const [revealDealerHole, setRevealDealerHole] = useState(false);
  const dealingTimeouts = useRef<number[]>([]);
  const playerRef = useRef<Card[]>([]);
  const dealerRef = useRef<Card[]>([]);
  const deckRef = useRef<Card[]>([]);
  const actionLockRef = useRef<boolean>(false);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { dealerRef.current = dealer; }, [dealer]);
  useEffect(() => { deckRef.current = deck; }, [deck]);

  useEffect(() => {
    return () => { dealingTimeouts.current.forEach(clearTimeout as any); dealingTimeouts.current = []; };
  }, []);

  const tableWrapStyle: React.CSSProperties = {
    width: '100vw', height: '100vh', backgroundColor: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center'
  };
  const tableStyle: React.CSSProperties = {
    position: 'relative', width: 1100, height: 620, borderRadius: 320,
    background: 'radial-gradient(ellipse at 50% 30%, rgba(60,80,120,0.55), rgba(40,60,100,0.65) 60%, rgba(20,30,60,0.9))',
    boxShadow: '0 20px 120px rgba(0,0,0,0.7) inset, 0 40px 80px rgba(0,0,0,0.6)'
  };
  const arcTextStyle: React.CSSProperties = { position: 'absolute', top: 110, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontWeight: 800, letterSpacing: 4 };
  const chipStyle: React.CSSProperties = {
    position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
    width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, #ffef99, #f6c442)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.5), inset 0 3px 10px rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '5px solid #2e2e2e'
  };
  const chipInnerStyle: React.CSSProperties = { width: 70, height: 70, borderRadius: '50%', background: '#1b1f2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd84d', fontWeight: 800, fontSize: 16, textAlign: 'center', lineHeight: 1.1 };

  const controlsStyle: React.CSSProperties = { position: 'absolute', bottom: 26, left: 0, right: 0, display: 'flex', gap: 12, justifyContent: 'center' };
  const buttonStyle: React.CSSProperties = { padding: '12px 22px', borderRadius: 10, background: 'linear-gradient(180deg,#3a8cff,#1d5ed6)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 6px 14px rgba(0,0,0,0.4)' };
  const backStyle: React.CSSProperties = { position: 'absolute', top: 16, left: 16, color: '#cfd8ff', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' };

  const handRowStyle: React.CSSProperties = { position: 'absolute', left: 120, right: 120, display: 'flex', gap: 14, justifyContent: 'center' };
  const dealerRowPos: React.CSSProperties = { ...handRowStyle, top: 160 };
  const playerRowPos: React.CSSProperties = { ...handRowStyle, top: 350 };

  const cardStyleBase: React.CSSProperties = {
    width: 96, height: 136, borderRadius: 10, position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
  };
  const cardFront: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(180deg,#ffffff,#f4f4f4)', border: '1px solid #e2e2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 };
  const cardBack: React.CSSProperties = { position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', borderRadius: 10, background: 'radial-gradient(circle at 50% 40%, #273455, #17223f 60%)', border: '1px solid #0f1a33', overflow: 'hidden' };

  function finishIfBlackjack(initialPlayer: Card[], initialDealer: Card[]) {
    const p = handValue(initialPlayer).total;
    const d = handValue(initialDealer).total;
    if (p === 21 || d === 21) {
      setRevealDealerHole(true);
      if (p === 21 && d === 21) {
        setResult('Blackjack push. No drinks this round.');
        setResultType('push');
      } else if (p === 21) {
        setResult(`Blackjack! Distribute ${totalStake} Schlücke`);
        setResultType('win');
      } else {
        setResult(`Dealer blackjack. Drink ${totalStake} Schlücke`);
        setResultType('lose');
      }
      setPhase('result');
      try { window.dispatchEvent(new CustomEvent('blackjackResult', { detail: { result: (p === 21 && d === 21) ? 'push' : (p === 21 ? 'win' : 'lose') } })); } catch (e) {}
      return true;
    }
    return false;
  }

  function deal() {
    if (!(phase === 'idle' || phase === 'result')) return; // prevent double-deal during an active round
    const d = buildShuffledDeck();
    setDeck(d);
    deckRef.current = d;
    setPlayer([]); setDealer([]); setResult(''); setRevealDealerHole(false);
    setPhase('dealing');
    // cancel any leftover timeouts from previous round
    dealingTimeouts.current.forEach(id => clearTimeout(id));
    dealingTimeouts.current = [];
    const timeouts: number[] = [];
    const drawWithLimit = (setter: (fn: (prev: Card[]) => Card[]) => void, limit: number) => {
      setter(prev => {
        if (prev.length >= limit) return prev;
        const next = d.pop() as Card;
        return next ? [next, ...prev] : prev;
      });
    };
    // Deal: player, dealer (hole), player, dealer (up)
    timeouts.push(window.setTimeout(() => drawWithLimit(setPlayer, 2), 100));
    timeouts.push(window.setTimeout(() => drawWithLimit(setDealer, 2), 350));
    timeouts.push(window.setTimeout(() => drawWithLimit(setPlayer, 2), 600));
    timeouts.push(window.setTimeout(() => drawWithLimit(setDealer, 2), 850));
    timeouts.push(window.setTimeout(() => {
      playerRef.current = playerRef.current; // ensure refs exist
      dealerRef.current = dealerRef.current;
      const done = finishIfBlackjack(playerRef.current, dealerRef.current);
      if (!done) setPhase('player');
    }, 1150));
    dealingTimeouts.current = timeouts;
  }

  function hit() {
    if (phase !== 'player' || actionLockRef.current) return;
    actionLockRef.current = true;
    const currentDeck = deckRef.current;
    if (currentDeck.length === 0) { actionLockRef.current = false; return; }
    const card = currentDeck[currentDeck.length - 1];
    const nextDeck = currentDeck.slice(0, -1);
    deckRef.current = nextDeck;
    setDeck(nextDeck);
    setPlayer(p => [card, ...p]);
    const newVal = handValue([card, ...playerRef.current]).total;
    if (newVal > 21) {
      setPhase('result');
      setRevealDealerHole(true);
      setResult(`Busted! Drink ${totalStake} Schlücke`);
      setResultType('lose');
      try { window.dispatchEvent(new CustomEvent('blackjackResult', { detail: { result: 'lose' } })); } catch (e) {}
    }
    // small cooldown to prevent double draws on rapid clicks
    window.setTimeout(() => { actionLockRef.current = false; }, 280);
  }

  function stand() {
    if (phase !== 'player' || actionLockRef.current) return;
    actionLockRef.current = true;
    setPhase('dealer');
    setRevealDealerHole(true);
    // Dealer draws to 17
    const step = () => {
      const currentDealer = dealerRef.current;
      const value = handValue(currentDealer).total;
      const soft = handValue(currentDealer).soft;
      const mustHit = value < 17; // stand on all 17, including soft 17
      if (mustHit) {
        const currentDeck = deckRef.current;
        if (currentDeck.length > 0) {
          const card = currentDeck[currentDeck.length - 1];
          const nextDeck = currentDeck.slice(0, -1);
          deckRef.current = nextDeck;
          setDeck(nextDeck);
          setDealer(h => [card, ...h]);
        }
        window.setTimeout(step, 500);
      } else {
        const p = handValue(playerRef.current).total;
        const dv = handValue(dealerRef.current).total;
        let type: 'win'|'lose'|'push' = 'push';
        if (dv > 21 || p > dv) { setResult(`You win! Distribute ${totalStake} Schlücke`); type = 'win'; }
        else if (p < dv) { setResult(`You lose. Drink ${totalStake} Schlücke`); type = 'lose'; }
        else { setResult('Push. No drinks this round.'); type = 'push'; }
        setResultType(type);
        setPhase('result');
        try { window.dispatchEvent(new CustomEvent('blackjackResult', { detail: { result: type } })); } catch (e) {}
        actionLockRef.current = false;
      }
    };
    window.setTimeout(step, 500);
  }

  const renderCard = (card: Card, faceUp: boolean, key?: string, delayMs: number = 0) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div key={key || card.id} style={{ perspective: '1000px' }}>
        <div style={{ ...cardStyleBase, transform: faceUp ? 'rotateY(0)' : 'rotateY(180deg)', transitionDelay: `${delayMs}ms` }}>
          <div style={{ ...cardFront, color: isRed ? '#d64545' : '#222' }}>
            <span>{card.rank}{card.suit}</span>
          </div>
          <div style={cardBack}>
            {/* Back design: border rings */}
            <div style={{ position: 'absolute', inset: 6, borderRadius: 8, border: '2px solid rgba(255,255,255,0.12)' }} />
            <div style={{ position: 'absolute', inset: 14, borderRadius: 6, border: '2px solid rgba(255,255,255,0.08)' }} />
            {/* Emblem */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle,#2a3a68,#0f1a33)', boxShadow: '0 0 10px rgba(255,255,255,0.08) inset, 0 0 8px rgba(0,0,0,0.6)' }}>
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.22)' }} />
              <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(255,255,255,0.2), rgba(255,255,255,0))' }} />
            </div>
            {/* Diagonal pattern */}
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0 6px, transparent 6px 12px)' }} />
          </div>
        </div>
      </div>
    );
  };

  // Determine dealer up/hole taking dealing order into account
  const dealerHasUp = dealer.length >= 2;
  const dealerUp = dealerHasUp ? dealer[0] : undefined; // up card exists only after second dealer card is dealt
  const dealerHole = dealer.length > 0 ? (dealerHasUp ? dealer[1] : dealer[0]) : undefined;

  return (
    <div style={tableWrapStyle}>
      <Link to="/" style={backStyle}>← Back</Link>
      <div style={tableStyle}>
        <div style={arcTextStyle}>BLACKJACK PAYS 3 TO 2 — INSURANCE PAYS 2 TO 1</div>

        {/* Dealer hand */}
        <div style={dealerRowPos}>
          {dealerUp && renderCard(dealerUp, true, 'du')}
          {dealerHole && renderCard(dealerHole, revealDealerHole, 'dh')}
          {dealer.slice(2).map(c => renderCard(c, true))}
          {/* Dealer total badge */}
          <div style={{ position: 'absolute', right: 40, top: -10, color: '#cfe2ff', fontWeight: 800, background: 'rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
            {revealDealerHole ? handValue(dealer).total : handValue(dealer.slice(0,1)).total}
          </div>
        </div>

        {/* Player hand */}
        <div style={playerRowPos}>
          {player.map(c => renderCard(c, true))}
          {/* Player total badge */}
          <div style={{ position: 'absolute', right: 40, top: -10, color: '#d1ffd1', fontWeight: 800, background: 'rgba(0,255,0,0.08)', padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,255,0,0.2)' }}>
            {handValue(player).total}
          </div>
        </div>

        {/* Stake chip */}
        <div style={chipStyle} title={`Stake: ${baseStake}x Schlücke × ${multiplierFromQuery}x`}>
          <div style={chipInnerStyle}>{totalStake}x Schlücke</div>
        </div>

        {/* Controls */}
        <div style={controlsStyle}>
          {phase === 'idle' && (
            <button style={buttonStyle} onClick={deal}>DEAL</button>
          )}
          {phase === 'player' && (
            <>
              <button style={buttonStyle} onClick={hit}>HIT</button>
              <button style={buttonStyle} onClick={stand}>STAND</button>
            </>
          )}
        </div>

        {/* Result banner */}
        {result && (
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', fontWeight: 900, fontSize: 26,
            color: resultType === 'win' ? '#3dff7a' : resultType === 'lose' ? '#ff4d4d' : '#ffd84d',
            textShadow: resultType === 'win' ? '0 0 18px rgba(61,255,122,0.7)' : resultType === 'lose' ? '0 0 18px rgba(255,77,77,0.7)' : '0 2px 10px rgba(0,0,0,0.6)'
          }}>{result}</div>
        )}
      </div>
    </div>
  );
}


