const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DG_KEY = '465902ebb846148721227246239f';   // ← Your key

app.get('/api/field', async (req, res) => {
  try {
    const response = await fetch(
      `https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=${DG_KEY}`
    );

    const data = await response.json();

    if (!data.field || data.field.length === 0) {
      throw new Error('No field data returned');
    }

    // Extract clean player list (Last, First format)
    const players = data.field.map(p => p.player_name);

    res.json({
      tournament_name: data.event_name || 'Current PGA Event',
      course: data.course_name || '',
      dates: `${data.date_start || ''} - ${data.date_end || ''}`,
      players: players
    });

    console.log(`✅ Loaded ${players.length} players for ${data.event_name}`);
  } catch (err) {
    console.error('Field fetch error:', err);
    res.status(500).json({ error: 'Failed to load field' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Fairway Feud backend running on http://localhost:${PORT}`);
});