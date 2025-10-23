import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Question = { question: string; options: Record<'A'|'B'|'C'|'D', string>; correct: 'A'|'B'|'C'|'D' };

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function QuizGame() {
  const query = useQuery();
  const multiplier = Math.max(1, Math.min(10, parseInt(query.get('multiplier') || '1', 10) || 1));
  const baseStake = 3;
  const totalStake = baseStake * multiplier;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [choice, setChoice] = useState<null | 'A'|'B'|'C'|'D'>(null);
  const [status, setStatus] = useState<'idle'|'blinking'|'result'>('idle');
  const [blinkOn, setBlinkOn] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Try public path first
        let res = await fetch('/questions.json', { cache: 'no-store' });
        if (!res.ok) {
          // Try repository path as a fallback (only works in dev if served)
          res = await fetch('/subgames/js/questions.json', { cache: 'no-store' });
        }
        if (!res.ok) throw new Error('Failed to load questions');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid questions format');
        const idx = Math.floor(Math.random() * data.length);
        setQuestions(data);
        setCurrent(data[idx]);
      } catch (e) {
        // Fallback minimal set if file not available or invalid
        const fallback: Question[] = [
          { question: 'Wie viele Kontinente gibt es?', options: { A: '5', B: '6', C: '7', D: '8' }, correct: 'C' },
          { question: 'Was ist das chemische Symbol für Gold?', options: { A: 'Ag', B: 'Au', C: 'Gd', D: 'Go' }, correct: 'B' },
          { question: 'Welche Farbe hat Chlorophyll?', options: { A: 'Blau', B: 'Grün', C: 'Rot', D: 'Gelb' }, correct: 'B' },
          { question: 'Wie viele Farben hat der Regenbogen?', options: { A: '6', B: '7', C: '8', D: '9' }, correct: 'B' }
        ];
        const idx = Math.floor(Math.random() * fallback.length);
        setQuestions(fallback);
        setCurrent(fallback[idx]);
        // eslint-disable-next-line no-console
        console.warn('Falling back to built-in questions. Ensure client/public/questions.json exists and is valid.');
      }
    };
    load();
  }, []);

  const container: React.CSSProperties = { width: '100vw', height: '100vh', backgroundColor: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const card: React.CSSProperties = { width: 980, maxWidth: '92vw', padding: 24 };
  const questionBox: React.CSSProperties = { background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.12)', color: '#f2f2f2', borderRadius: 18, padding: 24, fontSize: 22, fontWeight: 800, textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' };
  const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 };
  const optionStyle = (key: 'A'|'B'|'C'|'D'): React.CSSProperties => {
    const isSelected = choice === key;
    const isCorrect = status === 'result' && current && key === current.correct;
    const isWrong = status === 'result' && isSelected && current && key !== current.correct;
    const bg = isCorrect ? 'rgba(0, 255, 120, 0.15)' : isWrong ? 'rgba(255, 77, 77, 0.15)' : 'rgba(255,255,255,0.06)';
    const border = isCorrect ? '1px solid rgba(0,255,120,0.5)' : isWrong ? '1px solid rgba(255,77,77,0.5)' : '1px solid rgba(255,255,255,0.12)';
    let glow = '0 8px 24px rgba(0,0,0,0.35)';
    if (status === 'blinking' && isSelected) {
      glow = blinkOn ? '0 0 0 3px rgba(255,255,255,0.95), 0 0 24px rgba(255,255,255,0.85)' : '0 8px 24px rgba(0,0,0,0.35)';
    } else if (status === 'result') {
      if (isCorrect) glow = '0 0 0 3px rgba(0,255,120,0.7), 0 0 24px rgba(0,255,120,0.65)';
      if (isWrong) glow = '0 0 0 3px rgba(255,77,77,0.7), 0 0 24px rgba(255,77,77,0.65)';
    }
    return { background: bg, border, borderRadius: 14, color: '#eaeef8', padding: '16px 18px', fontWeight: 700, cursor: status==='idle' ? 'pointer' : 'default', textAlign: 'center', boxShadow: glow };
  };

  const handleSelect = (key: 'A'|'B'|'C'|'D') => {
    if (status !== 'idle') return;
    setChoice(key);
    setStatus('blinking');
    setBlinkOn(true);
    const blinkIntervals: number[] = [];
    let count = 0;
    const id = window.setInterval(() => {
      setBlinkOn(prev => !prev);
      count++;
      if (count >= 8) {
        window.clearInterval(id);
        setBlinkOn(false);
        setStatus('result');
        // dispatch result and return overlay handled in wrapper
        const correct = current && key === current.correct;
        const outcome = correct ? 'win' : 'lose';
        try { window.dispatchEvent(new CustomEvent('quizResult', { detail: { result: outcome } })); } catch (e) {}
      }
    }, 250);
    blinkIntervals.push(id);
  };

  const resultBanner = () => {
    if (status !== 'result' || !current || !choice) return null;
    const correct = choice === current.correct;
    const color = correct ? '#3dff7a' : '#ff4d4d';
    const text = correct ? `Richtig! Verteile ${totalStake} Schlücke` : `Falsch! Trink ${totalStake} Schlücke`;
    return (
      <div style={{ marginTop: 16, textAlign: 'center', color, fontWeight: 900, textShadow: correct ? '0 0 18px rgba(61,255,122,0.7)' : '0 0 18px rgba(255,77,77,0.7)' }}>{text}</div>
    );
  };

  return (
    <div style={container}>
      <div style={card}>
        <Link to="/" style={{ position: 'fixed', top: 16, left: 16, color: '#cfd8ff', textDecoration: 'none', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>← Back</Link>
        <div style={questionBox}>{current ? current.question : 'Lade Frage...'}</div>
        <div style={grid}>
          {(['A','B','C','D'] as const).map(k => (
            <div key={k} style={optionStyle(k)} onClick={() => handleSelect(k)}>
              <div>{current ? current.options[k] : ''}</div>
            </div>
          ))}
        </div>
        {resultBanner()}
        {status==='result' && (
          <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', color: '#f2f2f2', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,0.35)' }}>
              Runde beendet — Rückkehr zum Rad in 5s
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


