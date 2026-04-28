import { useState } from 'react';

const pgaField = [
  "Ludvig Åberg", "Keegan Bradley", "Brian Harman", "Russell Henley", "Max Homa",
  "Viktor Hovland", "Si Woo Kim", "Shane Lowry", "Hideki Matsuyama", "Collin Morikawa",
  "Rory McIlroy", "Xander Schauffele", "Scottie Scheffler", "Jordan Spieth", "Justin Thomas",
  "Tommy Fleetwood", "Matt Fitzpatrick", "Tony Finau", "Jason Day", "Wyndham Clark",
  "Sahith Theegala", "Cameron Young", "Patrick Cantlay", "Corey Conners", "Fred Couples"
];

export default function DraftRoom() {
  const [teamBob, setTeamBob] = useState<string[]>([]);
  const [teamAndy, setTeamAndy] = useState<string[]>([]);
  const [alternatesBob, setAlternatesBob] = useState<string[]>([]);
  const [alternatesAndy, setAlternatesAndy] = useState<string[]>([]);
  const [draftHistory, setDraftHistory] = useState<any[]>([]);
  const [currentPicker, setCurrentPicker] = useState<'bob' | 'andy'>('bob');
  const [isDrafting, setIsDrafting] = useState(false);
  const [showCutButton, setShowCutButton] = useState(false);

  const pickPlayer = (name: string) => {
    if (draftHistory.some((h: any) => h.player === name)) return;

    const isAlternatePhase = teamBob.length + teamAndy.length >= 8;

    setDraftHistory([...draftHistory, {
      pickNumber: draftHistory.length + 1,
      player: name,
      team: currentPicker,
      isAlternate: isAlternatePhase
    }]);

    if (isAlternatePhase) {
      if (currentPicker === 'bob') setAlternatesBob([...alternatesBob, name]);
      else setAlternatesAndy([...alternatesAndy, name]);
    } else {
      if (currentPicker === 'bob') setTeamBob([...teamBob, name]);
      else setTeamAndy([...teamAndy, name]);
    }

    setCurrentPicker(currentPicker === 'bob' ? 'andy' : 'bob');

    if (teamBob.length >= 4 && teamAndy.length >= 4 && alternatesBob.length >= 2 && alternatesAndy.length >= 2) {
      setShowCutButton(true);
    }
  };

  const startDraft = () => setIsDrafting(true);

  const resetDraft = () => {
    setTeamBob([]);
    setTeamAndy([]);
    setAlternatesBob([]);
    setAlternatesAndy([]);
    setDraftHistory([]);
    setCurrentPicker('bob');
    setIsDrafting(false);
    setShowCutButton(false);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        {!isDrafting && (
          <button onClick={startDraft} style={{ background: '#4ade80', color: 'black', padding: '18px 50px', fontSize: '22px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
            START DRAFT
          </button>
        )}
        <button onClick={resetDraft} style={{ background: '#333', color: 'white', padding: '18px 40px', fontSize: '20px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginLeft: '15px' }}>
          RESET DRAFT
        </button>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
        <div style={{ width: '420px', background: '#1a3c2e', padding: '25px', borderRadius: '16px', border: '4px solid #4ade80' }}>
          <h2 style={{ color: '#4ade80' }}>Bob's Team ({teamBob.length}/4)</h2>
          {teamBob.map((p, i) => <div key={i} style={{ padding: '12px', margin: '6px 0', background: '#11251f', borderRadius: '8px', color: '#e0f2e9' }}>{p}</div>)}
          {alternatesBob.length > 0 && (
            <>
              <h3 style={{ color: '#90ee90', marginTop: '20px' }}>Alternates</h3>
              {alternatesBob.map((p, i) => <div key={i} style={{ padding: '10px', margin: '4px 0', background: '#1a3c2e', border: '1px dashed #4ade80', borderRadius: '8px', color: '#e0f2e9' }}>{i+1}st Alt — {p}</div>)}
            </>
          )}
        </div>

        <div style={{ width: '420px', background: '#1a3c2e', padding: '25px', borderRadius: '16px', border: '4px solid #4ade80' }}>
          <h2 style={{ color: '#4ade80' }}>Andy's Team ({teamAndy.length}/4)</h2>
          {teamAndy.map((p, i) => <div key={i} style={{ padding: '12px', margin: '6px 0', background: '#11251f', borderRadius: '8px', color: '#e0f2e9' }}>{p}</div>)}
          {alternatesAndy.length > 0 && (
            <>
              <h3 style={{ color: '#90ee90', marginTop: '20px' }}>Alternates</h3>
              {alternatesAndy.map((p, i) => <div key={i} style={{ padding: '10px', margin: '4px 0', background: '#1a3c2e', border: '1px dashed #4ade80', borderRadius: '8px', color: '#e0f2e9' }}>{i+1}st Alt — {p}</div>)}
            </>
          )}
        </div>
      </div>

      {/* Red Cut Button */}
      {showCutButton && (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <button style={{ backgroundColor: '#ef4444', color: 'white', padding: '20px 60px', fontSize: '24px', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            SIMULATE CUT
          </button>
        </div>
      )}

      {/* Player Grid */}
      {isDrafting && (
        <div style={{ background: '#1a3c2e', padding: '40px', borderRadius: '16px' }}>
          <h3 style={{ textAlign: 'center' }}>Current Pick: <span style={{ color: '#4ade80' }}>{currentPicker.toUpperCase()}</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '30px' }}>
            {pgaField.map((name, idx) => (
              <button
                key={idx}
                onClick={() => pickPlayer(name)}
                disabled={draftHistory.some((h: any) => h.player === name)}
                style={{
                  padding: '25px',
                  background: draftHistory.some((h: any) => h.player === name) ? '#0f1f1a' : '#1a3c2e',
                  border: '3px solid #4ade80',
                  borderRadius: '12px',
                  color: '#e0f2e9',
                  fontSize: '19px',
                  cursor: draftHistory.some((h: any) => h.player === name) ? 'not-allowed' : 'pointer'
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}