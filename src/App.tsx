import { useState, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState<'draft' | 'rules' | 'scorecard' | 'wishlist' | 'about'>('draft');
  const [players, setPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingField, setLoadingField] = useState(false);

  const [currentTournamentName, setCurrentTournamentName] = useState('Loading current event...');
  const [currentCourse, setCurrentCourse] = useState('');
  const [eventDates, setEventDates] = useState('');

  const [teamBob, setTeamBob] = useState<string[]>([]);
  const [teamAndy, setTeamAndy] = useState<string[]>([]);
  const [alternatesBob, setAlternatesBob] = useState<string[]>([]);
  const [alternatesAndy, setAlternatesAndy] = useState<string[]>([]);

  const [honorsTeam, setHonorsTeam] = useState<'bob' | 'andy' | null>(null);
  const [draftChoice, setDraftChoice] = useState<'first' | 'defer' | null>(null);
  const [deferStage, setDeferStage] = useState(0);

  const [currentPicker, setCurrentPicker] = useState<'bob' | 'andy'>('bob');
  const [isDrafting, setIsDrafting] = useState(false);
  const [phase, setPhase] = useState<'draft' | 'cut' | 'replacement' | 'done'>('draft');

  const [missedCutsBob, setMissedCutsBob] = useState<string[]>([]);
  const [missedCutsAndy, setMissedCutsAndy] = useState<string[]>([]);
  const [replacementMapBob, setReplacementMapBob] = useState<Record<string, string>>({});
  const [replacementMapAndy, setReplacementMapAndy] = useState<Record<string, string>>({});

  const [bobScores, setBobScores] = useState<Record<string, number[]>>({});
  const [andyScores, setAndyScores] = useState<Record<string, number[]>>({});
  const [finalResult, setFinalResult] = useState<any>(null);

  const sortedPlayers = [...players].sort();
  const filteredPlayers = sortedPlayers.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatName = (name: string) => {
    if (name.includes(',')) {
      const [last, first] = name.split(',').map(s => s.trim());
      return `${first} ${last}`;
    }
    return name;
  };

  const getPlayerColor = (name: string) => {
    if (teamBob.includes(name) || alternatesBob.includes(name)) return '#4ade80';
    if (teamAndy.includes(name) || alternatesAndy.includes(name)) return '#60a5fa';
    return '#1a3c2e';
  };

  const isPicked = (name: string) => {
    return teamBob.includes(name) || teamAndy.includes(name) || 
           alternatesBob.includes(name) || alternatesAndy.includes(name);
  };

  const loadCurrentField = async () => {
    setLoadingField(true);
    try {
      const res = await fetch('http://localhost:3001/api/field');
      const data = await res.json();
      if (data.players && data.players.length > 0) {
        setPlayers(data.players);
        setCurrentTournamentName(data.tournament_name || 'Current PGA Event');
        setCurrentCourse(data.course || '');
        setEventDates(data.dates || '');
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingField(false);
  };

  // Auto-load current tournament when app starts
  useEffect(() => {
    loadCurrentField();
  }, []);

  const doCoinFlip = () => {
    const winner = Math.random() > 0.5 ? 'bob' : 'andy';
    setHonorsTeam(winner);
    setDraftChoice(null);
    setDeferStage(0);
    setIsDrafting(true);
    alert(`🪙 COIN FLIP!\n\n${winner.toUpperCase()} has the honors.`);
  };

  const chooseDraftStrategy = (choice: 'first' | 'defer') => {
    setDraftChoice(choice);
    setDeferStage(0);
    if (choice === 'first') {
      setCurrentPicker(honorsTeam!);
    } else {
      setCurrentPicker(honorsTeam === 'bob' ? 'andy' : 'bob');
    }
  };

  const pickPlayer = (name: string) => {
    if (isPicked(name)) return;

    const mainPicksDone = teamBob.length + teamAndy.length;
    const isAlternatePhase = mainPicksDone >= 8;

    if (!isAlternatePhase) {
      if (currentPicker === 'bob' && teamBob.length >= 4) return;
      if (currentPicker === 'andy' && teamAndy.length >= 4) return;
    } else {
      if (currentPicker === 'bob' && alternatesBob.length >= 2) return;
      if (currentPicker === 'andy' && alternatesAndy.length >= 2) return;
    }

    if (isAlternatePhase) {
      currentPicker === 'bob' ? setAlternatesBob(p => [...p, name]) : setAlternatesAndy(p => [...p, name]);
    } else {
      currentPicker === 'bob' ? setTeamBob(p => [...p, name]) : setTeamAndy(p => [...p, name]);
    }

    if (draftChoice === 'defer' && !isAlternatePhase) {
      const mainPicksAfter = mainPicksDone + 1;
      if (mainPicksAfter === 1) { setCurrentPicker(honorsTeam!); setDeferStage(1); return; }
      if (mainPicksAfter === 2 && deferStage === 1) { setCurrentPicker(honorsTeam!); setDeferStage(2); return; }
      if (mainPicksAfter === 3 && deferStage === 2) { setCurrentPicker(honorsTeam === 'bob' ? 'andy' : 'bob'); setDeferStage(3); return; }
    }

    setCurrentPicker(currentPicker === 'bob' ? 'andy' : 'bob');
  };

  useEffect(() => {
    if (teamBob.length === 4 && teamAndy.length === 4 && alternatesBob.length === 2 && alternatesAndy.length === 2) {
      setPhase('cut');
      setIsDrafting(false);
    }
  }, [teamBob.length, teamAndy.length, alternatesBob.length, alternatesAndy.length]);

  const simulateCut = () => {
    const missedBob = teamBob.filter(() => Math.random() > 0.68);
    const missedAndy = teamAndy.filter(() => Math.random() > 0.68);
    setMissedCutsBob(missedBob);
    setMissedCutsAndy(missedAndy);
    setReplacementMapBob({});
    setReplacementMapAndy({});
    setPhase('replacement');
    const starter = missedBob.length >= missedAndy.length ? 'bob' : 'andy';
    setCurrentPicker(starter);
    alert(`🔴 CUT SIMULATED!\nBob missed ${missedBob.length} • Andy missed ${missedAndy.length}`);
  };

  const pickReplacement = (name: string) => {
    if (phase !== 'replacement') return;

    const myMissed = currentPicker === 'bob' ? missedCutsBob : missedCutsAndy;
    const myMap = currentPicker === 'bob' ? replacementMapBob : replacementMapAndy;

    if (Object.keys(myMap).length >= myMissed.length) {
      setCurrentPicker(currentPicker === 'bob' ? 'andy' : 'bob');
      return;
    }

    const opponentTeam = currentPicker === 'bob' ? teamAndy : teamBob;
    const opponentAlternates = currentPicker === 'bob' ? alternatesAndy : alternatesBob;

    if (opponentTeam.includes(name) || opponentAlternates.includes(name) ||
        missedCutsBob.includes(name) || missedCutsAndy.includes(name)) return;

    const missedIndex = Object.keys(myMap).length;
    const missedPlayer = myMissed[missedIndex];

    if (currentPicker === 'bob') {
      setReplacementMapBob(prev => ({ ...prev, [missedPlayer]: name }));
    } else {
      setReplacementMapAndy(prev => ({ ...prev, [missedPlayer]: name }));
    }

    setCurrentPicker(currentPicker === 'bob' ? 'andy' : 'bob');
  };

  useEffect(() => {
    if (phase === 'replacement' && 
        Object.keys(replacementMapBob).length >= missedCutsBob.length && 
        Object.keys(replacementMapAndy).length >= missedCutsAndy.length) {
      setTimeout(() => { alert("✅ Replacements complete!"); setPhase('done'); }, 500);
    }
  }, [phase, replacementMapBob, replacementMapAndy]);

  const finishReplacementsManually = () => setPhase('done');

  const updateScore = (player: string, round: number, score: number, isBob: boolean) => {
    const setter = isBob ? setBobScores : setAndyScores;
    setter(prev => {
      const current = prev[player] || [0, 0, 0, 0];
      const newScores = [...current];
      newScores[round - 1] = score;
      return { ...prev, [player]: newScores };
    });
  };

  const calculateTeamTotal = (team: string[], scores: Record<string, number[]>, missed: string[], replacementMap: Record<string, string>) => {
    return team.reduce((sum, p) => {
      const playerScores = scores[p] || [0,0,0,0];
      const rep = replacementMap[p];
      if (missed.includes(p) && rep) {
        const repScores = scores[rep] || [0,0,0,0];
        return sum + playerScores[0] + playerScores[1] + repScores[2] + repScores[3];
      }
      return sum + playerScores.reduce((a, b) => a + b, 0);
    }, 0);
  };

  const calculateFinalResult = () => {
    const bobTotal = calculateTeamTotal(teamBob, bobScores, missedCutsBob, replacementMapBob);
    const andyTotal = calculateTeamTotal(teamAndy, andyScores, missedCutsAndy, replacementMapAndy);
    const diff = bobTotal - andyTotal;
    setFinalResult({ 
      bobTotal, 
      andyTotal, 
      winner: diff < 0 ? 'Bob' : diff > 0 ? 'Andy' : 'Tie', 
      points: Math.abs(diff) 
    });
  };

  const getReplacement = (player: string, isBob: boolean) => {
    return isBob ? replacementMapBob[player] : replacementMapAndy[player];
  };

  return (
    <div style={{ backgroundColor: '#0a2f1f', color: '#e0f2e9', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1900px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '56px', color: '#4ade80', margin: '0 0 8px 0' }}>FAIRWAY FEUD</h1>
        <h2 style={{ fontSize: '28px', color: '#90ee90' }}>{currentTournamentName} — {currentCourse}</h2>
        <p style={{ color: '#a3e6b0' }}>{eventDates}</p>

        {/* Team Panels */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginBottom: '30px' }}>
          <div style={{ background: '#1a3c2e', padding: '15px', borderRadius: '12px', width: '420px', textAlign: 'left' }}>
            <h3 style={{ color: '#4ade80', textAlign: 'center' }}>Bob's Team</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teamBob.map(p => {
                const isMissed = missedCutsBob.includes(p);
                const rep = getReplacement(p, true);
                return (
                  <li key={p} style={{ margin: '6px 0' }}>
                    <span style={{ textDecoration: isMissed ? 'line-through' : 'none', color: isMissed ? '#ef4444' : '#90ee90' }}>
                      • {formatName(p)}
                    </span>
                    {isMissed && rep && <span style={{ color: '#4ade80', marginLeft: '12px' }}>→ {formatName(rep)}</span>}
                  </li>
                );
              })}
            </ul>
            <h4 style={{ color: '#4ade80', marginTop: '12px' }}>Alternates</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{alternatesBob.map(p => <li key={p}>• {formatName(p)}</li>)}</ul>
          </div>

          <div style={{ background: '#1a3c2e', padding: '15px', borderRadius: '12px', width: '420px', textAlign: 'left' }}>
            <h3 style={{ color: '#60a5fa', textAlign: 'center' }}>Andy's Team</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teamAndy.map(p => {
                const isMissed = missedCutsAndy.includes(p);
                const rep = getReplacement(p, false);
                return (
                  <li key={p} style={{ margin: '6px 0' }}>
                    <span style={{ textDecoration: isMissed ? 'line-through' : 'none', color: isMissed ? '#ef4444' : '#93c5fd' }}>
                      • {formatName(p)}
                    </span>
                    {isMissed && rep && <span style={{ color: '#60a5fa', marginLeft: '12px' }}>→ {formatName(rep)}</span>}
                  </li>
                );
              })}
            </ul>
            <h4 style={{ color: '#60a5fa', marginTop: '12px' }}>Alternates</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{alternatesAndy.map(p => <li key={p}>• {formatName(p)}</li>)}</ul>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          {(['draft','rules','scorecard','wishlist','about'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '10px 24px', background: activeTab === tab ? '#4ade80' : '#1a3c2e', color: activeTab === tab ? 'black' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === 'draft' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <button onClick={loadCurrentField} disabled={loadingField} style={{ background: '#4ade80', color: 'black', padding: '12px 40px', fontSize: '17px', borderRadius: '8px', marginRight: '12px' }}>
                {loadingField ? 'Loading...' : `Load ${currentTournamentName}`}
              </button>
              <button onClick={doCoinFlip} style={{ background: '#eab308', color: 'black', padding: '12px 32px', fontSize: '16px', borderRadius: '8px' }}>🪙 COIN FLIP</button>
            </div>

            {honorsTeam && !draftChoice && (
              <div style={{ textAlign: 'center', margin: '40px 0' }}>
                <h3 style={{ color: '#4ade80' }}>{honorsTeam.toUpperCase()} has the honors!</h3>
                <p style={{ margin: '20px 0 10px' }}>Choose your draft strategy:</p>
                <button onClick={() => chooseDraftStrategy('first')} style={{ background: '#4ade80', color: 'black', padding: '16px 50px', fontSize: '18px', marginRight: '20px', borderRadius: '10px' }}>Pick First</button>
                <button onClick={() => chooseDraftStrategy('defer')} style={{ background: '#60a5fa', color: 'black', padding: '16px 50px', fontSize: '18px', borderRadius: '10px' }}>Take 2nd & 3rd</button>
              </div>
            )}

            {draftChoice && isDrafting && phase === 'draft' && (
              <div style={{ background: '#1a3c2e', padding: '25px', borderRadius: '16px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#4ade80' }}>Current Pick: {currentPicker.toUpperCase()}</h3>
                <input type="text" placeholder="Search players..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                  style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#0f2a1f', color: 'white', border: '1px solid #4ade80', borderRadius: '8px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {filteredPlayers.map(name => {
                    const picked = isPicked(name);
                    const bgColor = getPlayerColor(name);
                    return (
                      <button 
                        key={name} 
                        onClick={() => pickPlayer(name)} 
                        disabled={picked}
                        style={{ 
                          padding: '14px 8px', minHeight: '60px', background: '#1a3c2e', border: `2px solid ${bgColor}`, 
                          borderRadius: '8px', color: '#e0f2e9', fontWeight: 'bold', cursor: picked ? 'default' : 'pointer'
                        }}>
                        {formatName(name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {phase === 'cut' && (
              <div style={{ textAlign: 'center', margin: '60px 0' }}>
                <button onClick={simulateCut} style={{ background: '#ef4444', color: 'white', padding: '18px 60px', fontSize: '22px', borderRadius: '12px' }}>🔴 SIMULATE CUT</button>
              </div>
            )}

            {phase === 'replacement' && (
              <div style={{ background: '#1a3c2e', padding: '25px', borderRadius: '16px' }}>
                <h3 style={{ textAlign: 'center', color: '#ef4444' }}>REPLACEMENT PHASE — Current Pick: {currentPicker.toUpperCase()}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {filteredPlayers.map(name => {
                    const isOwnMissed = (currentPicker === 'bob' && missedCutsBob.includes(name)) || (currentPicker === 'andy' && missedCutsAndy.includes(name));
                    const isOpponentOwned = (currentPicker === 'bob' ? teamAndy : teamBob).includes(name);
                    const isOpponentAlternate = (currentPicker === 'bob' ? alternatesAndy : alternatesBob).includes(name);
                    const disabled = isOwnMissed || isOpponentOwned || isOpponentAlternate;
                    const bgColor = getPlayerColor(name);
                    return (
                      <button 
                        key={name} 
                        onClick={() => !disabled && pickReplacement(name)} 
                        disabled={disabled}
                        style={{ 
                          padding: '14px 8px', minHeight: '60px', background: bgColor, 
                          border: `2px solid ${disabled ? '#991b1b' : '#4ade80'}`, borderRadius: '8px', 
                          color: '#ffffff', fontWeight: 'bold', opacity: disabled ? 0.6 : 1
                        }}>
                        {formatName(name)}
                      </button>
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <button onClick={finishReplacementsManually} style={{ background: '#ef4444', color: 'white', padding: '14px 40px', borderRadius: '8px', fontSize: '16px' }}>
                    Finish Replacements & Go to Scorecard
                  </button>
                </div>
              </div>
            )}

            {phase === 'done' && <div style={{ textAlign: 'center', margin: '80px 0', fontSize: '28px', color: '#4ade80' }}>🎉 Draft Complete! Go to Scorecard tab.</div>}
          </>
        )}

        {activeTab === 'rules' && (
          <div style={{ background: '#1a3c2e', padding: '40px', borderRadius: '16px', maxWidth: '1100px', margin: '0 auto', textAlign: 'left', lineHeight: '1.7' }}>
            <h2 style={{ color: '#4ade80', textAlign: 'center', marginBottom: '30px' }}>Fairway Feud Rules</h2>
            <h3>1. Draft Night</h3>
            <ul>
              <li>Each captain selects 4 players.</li>
              <li>Coin flip decides who has honors.</li>
              <li>Honors captain can pick first or take 2nd & 3rd.</li>
              <li>Then each selects 2 alternates.</li>
            </ul>
            <h3>2. Cut & Replacements</h3>
            <ul>
              <li>Missed cut = -10 points, must replace.</li>
              <li>Alternates are owner-only.</li>
              <li>Team needing more replacements picks first.</li>
            </ul>
            <h3>3. Scoring</h3>
            <ul>
              <li>Lower total strokes wins the difference.</li>
              <li>Best single round +20, worst single round -10.</li>
              <li>Tournament winner bonus +25 / +10.</li>
            </ul>
          </div>
        )}

        {activeTab === 'scorecard' && (
          <div style={{ background: '#1a3c2e', padding: '40px', borderRadius: '16px', maxWidth: '1600px', margin: '0 auto' }}>
            <h2 style={{ color: '#4ade80', textAlign: 'center', marginBottom: '30px' }}>Scorecard</h2>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '80px' }}>
              {/* Bob Scorecard */}
              <div style={{ width: '700px' }}>
                <h3 style={{ color: '#4ade80', textAlign: 'center' }}>Bob</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={{textAlign:'left', width:'360px'}}>Player</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {teamBob.map(p => {
                      const isMissed = missedCutsBob.includes(p);
                      const rep = getReplacement(p, true);
                      const scores = bobScores[p] || [0,0,0,0];
                      const repScores = rep ? (bobScores[rep] || [0,0,0,0]) : [0,0,0,0];
                      const total = isMissed && rep ? scores[0] + scores[1] + repScores[2] + repScores[3] : scores.reduce((a,b)=>a+b,0);
                      return (
                        <tr key={p} style={{borderBottom:'1px solid #334d44'}}>
                          <td style={{padding:'8px', textAlign:'left'}}>
                            <span style={{textDecoration: isMissed ? 'line-through' : 'none', color: isMissed ? '#ef4444' : '#90ee90'}}>{formatName(p)}</span>
                            {isMissed && rep && <span style={{color:'#4ade80', marginLeft:'12px'}}>→ {formatName(rep)}</span>}
                          </td>
                          <td><input type="number" value={scores[0]||''} onChange={e => updateScore(p,1,parseInt(e.target.value)||0,true)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #4ade80'}} /></td>
                          <td><input type="number" value={scores[1]||''} onChange={e => updateScore(p,2,parseInt(e.target.value)||0,true)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #4ade80'}} /></td>
                          <td><input type="number" value={isMissed && rep ? repScores[2]||'' : scores[2]||''} onChange={e => updateScore(isMissed&&rep?rep:p,3,parseInt(e.target.value)||0,true)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #4ade80'}} disabled={isMissed && !rep} /></td>
                          <td><input type="number" value={isMissed && rep ? repScores[3]||'' : scores[3]||''} onChange={e => updateScore(isMissed&&rep?rep:p,4,parseInt(e.target.value)||0,true)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #4ade80'}} disabled={isMissed && !rep} /></td>
                          <td style={{fontWeight:'bold', color:'#4ade80'}}>{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Andy Scorecard */}
              <div style={{ width: '700px' }}>
                <h3 style={{ color: '#60a5fa', textAlign: 'center' }}>Andy</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th style={{textAlign:'left', width:'360px'}}>Player</th><th>R1</th><th>R2</th><th>R3</th><th>R4</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {teamAndy.map(p => {
                      const isMissed = missedCutsAndy.includes(p);
                      const rep = getReplacement(p, false);
                      const scores = andyScores[p] || [0,0,0,0];
                      const repScores = rep ? (andyScores[rep] || [0,0,0,0]) : [0,0,0,0];
                      const total = isMissed && rep ? scores[0] + scores[1] + repScores[2] + repScores[3] : scores.reduce((a,b)=>a+b,0);
                      return (
                        <tr key={p} style={{borderBottom:'1px solid #334d44'}}>
                          <td style={{padding:'8px', textAlign:'left'}}>
                            <span style={{textDecoration: isMissed ? 'line-through' : 'none', color: isMissed ? '#ef4444' : '#93c5fd'}}>{formatName(p)}</span>
                            {isMissed && rep && <span style={{color:'#60a5fa', marginLeft:'12px'}}>→ {formatName(rep)}</span>}
                          </td>
                          <td><input type="number" value={scores[0]||''} onChange={e => updateScore(p,1,parseInt(e.target.value)||0,false)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #60a5fa'}} /></td>
                          <td><input type="number" value={scores[1]||''} onChange={e => updateScore(p,2,parseInt(e.target.value)||0,false)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #60a5fa'}} /></td>
                          <td><input type="number" value={isMissed && rep ? repScores[2]||'' : scores[2]||''} onChange={e => updateScore(isMissed&&rep?rep:p,3,parseInt(e.target.value)||0,false)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #60a5fa'}} disabled={isMissed && !rep} /></td>
                          <td><input type="number" value={isMissed && rep ? repScores[3]||'' : scores[3]||''} onChange={e => updateScore(isMissed&&rep?rep:p,4,parseInt(e.target.value)||0,false)} style={{width:'60px', background:'#0f2a1f', color:'white', border:'1px solid #60a5fa'}} disabled={isMissed && !rep} /></td>
                          <td style={{fontWeight:'bold', color:'#60a5fa'}}>{total}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button onClick={calculateFinalResult} style={{ background: '#4ade80', color: 'black', padding: '16px 60px', fontSize: '20px', borderRadius: '12px' }}>
                Calculate Final Result
              </button>
            </div>

            {finalResult && (
              <div style={{ marginTop: '40px', background: '#0f2a1f', padding: '30px', borderRadius: '12px', textAlign: 'center', fontSize: '24px' }}>
                <h3>{finalResult.winner} wins by {finalResult.points} points!</h3>
                <p>Bob: {finalResult.bobTotal} • Andy: {finalResult.andyTotal}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div style={{ background: '#1a3c2e', padding: '40px', borderRadius: '16px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left' }}>
            <h2 style={{ color: '#4ade80', textAlign: 'center' }}>🚀 Fairway Feud Wishlist</h2>
            <ul style={{ fontSize: '18px', lineHeight: '2' }}>
              <li>🔥 Automatic PGA Fields & Live Scoring from DataGolf</li>
              <li>📱 Mobile App Versions (iOS / Android / PWA)</li>
              <li>👥 Multi-User Support — friends can create their own feuds</li>
              <li>💾 Save & Load completed matches + historical results</li>
              <li>📤 Share final scorecard as image/PDF</li>
              <li>🏆 More bonuses (Nifty 50 for hole-in-one, etc.)</li>
              <li>🌐 Public hosting so others can play</li>
            </ul>
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{ background: '#1a3c2e', padding: '50px', borderRadius: '16px', maxWidth: '1000px', margin: '0 auto', lineHeight: '1.8', fontSize: '18px' }}>
            <h2 style={{ color: '#4ade80', textAlign: 'center', marginBottom: '30px' }}>About Fairway Feud</h2>
            <p>A tribute to my good friend Andy Hornyak.</p>
            <p>Around 1995, I started as a Finance Manager at Lou Grubb Ford in North Scottsdale. That’s where I met my good friend Andy Hornyak, a salesperson there. We quickly bonded over our shared love of golf—both playing and watching—and adding a bit of “action” to the outcomes, whether on the course or TV.</p>
            <p>Andy proposed betting on weekly PGA Tour events. We’d each select four players, assign a dollar value per stroke, and the one with the lowest total strokes at week’s end would win that amount times the value from the opponent. Early on, Andy racked up some big wins over me, but the fun outweighed any losses.</p>
            <p>We layered in bonuses: extra for a player winning the tournament, another for the low round, and a penalty for the high round. If a pick missed the cut, you’d buy back a replacement to complete your foursome—but if that sub won, you only recouped the buy-back fee, not the full prize. I’ll never forget the week all four of Andy’s original picks missed the cut—he was furious!</p>
            <p>When Andy and his wife Linda relocated to Indiana, I worried our game was over. But he joined another dealership, and with toll-free 800 numbers (pre-cell phones, internet, or texting), we kept it going. We’d call Wednesdays for picks and Fridays for buy-backs. The loser of the prior week got “honors”: first pick, or yield it to take second and third. Losers also owed a congratulatory call Monday.</p>
            <p>Over 30+ years, we’ve tweaked it—like the recent “Nifty 50” for a hole-in-one (instant 50 points). Our friendship deepened; Andy’s now among my closest pals. With his recent health challenges sidelining regular play, I built this app to immortalize our game.</p>
            <p style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '40px', color: '#4ade80' }}>
              Here's to many more years of playing this addicting game, pal!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;