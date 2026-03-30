import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel'
import { config } from 'dotenv'

// Load environment variables
config()

const app = new Hono();

// ENV variables for Notion integration
const CEMANTIX_NOTION_TOKEN = process.env.CEMANTIX_NOTION_TOKEN
const CEMANTIX_DATABASE_ID = process.env.CEMANTIX_DATABASE_ID
const CEMANTLE_NOTION_TOKEN = process.env.CEMANTLE_NOTION_TOKEN
const CEMANTLE_DATABASE_ID = process.env.CEMANTLE_DATABASE_ID

// Configure CORS
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'https://cemantix-ui.vercel.app'
  ]
}));

const PROPERTIES = ['Word', 'Date', 'Elapsed time', 'Attempts'];
const PAYLOAD = {
  page_size: 1,
  sorts: [{ timestamp: 'created_time', direction: 'descending' }],
};

app.get('/api', async (c) => {
  const stats = await buildStats();
  return c.json(stats);
});

async function buildStats() {
  const [cemantixData, cemantleData] = await Promise.all([
    fetchCemantixData(CEMANTIX_NOTION_TOKEN, CEMANTIX_DATABASE_ID),
    fetchCemantixData(CEMANTLE_NOTION_TOKEN, CEMANTLE_DATABASE_ID),
  ]);

  const sortedCemantix = sortByDateDesc(cemantixData);
  const sortedCemantle = sortByDateDesc(cemantleData);

  return {
    cemantix: {
      lastWord: retrieveWordOfTheDay(sortedCemantix),
      elapsedTime: retrieveElapsedTime(sortedCemantix),
      requestsNumber: retrieveRequestsNumber(sortedCemantix),
      date: retrieveWordDate(sortedCemantix),
    },
    cemantle: {
      lastWord: retrieveWordOfTheDay(sortedCemantle),
      elapsedTime: retrieveElapsedTime(sortedCemantle),
      requestsNumber: retrieveRequestsNumber(sortedCemantle),
      date: retrieveWordDate(sortedCemantle),
    },
  };
}

function sortByDateDesc(data) {
  const sorted = [...data.results].sort((a, b) => {
    const dateA = a.properties.Date?.rich_text?.[0]?.plain_text || '';
    const dateB = b.properties.Date?.rich_text?.[0]?.plain_text || '';
    const numA = dateA.split('/').reverse().join('');
    const numB = dateB.split('/').reverse().join('');
    return numB.localeCompare(numA);
  });
  return sorted;
}

async function fetchCemantixData(token, dbId) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2021-08-16',
  };

  const filterProps = PROPERTIES.map(p => `filter_properties[]=${encodeURIComponent(p)}`).join('&');
  const response = await fetch(
    `https://api.notion.com/v1/databases/${dbId}/query?${filterProps}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(PAYLOAD),
    }
  );

  console.log(`${response.status} ${response.statusText}`);
  return await response.json();
}

const retrieveWordOfTheDay = (results) => {
  return results[0].properties.Word?.rich_text?.[0]?.plain_text || '';
}

const retrieveElapsedTime = (results) => {
  const elapsed = results[0].properties['Elapsed time']?.rich_text?.[0]?.plain_text || '';
  return elapsed.slice(0, elapsed.lastIndexOf('.'));
}

const retrieveRequestsNumber = (results) => {
  return results[0].properties.Attempts?.number || 0;
}

const retrieveWordDate = (results) => {
  const date = results[0].properties.Date?.rich_text?.[0]?.plain_text || '';
  const parsed = date.split('/');
  return `${parsed[1]}/${parsed[0]}/${parsed[2]}`;
}

const handler = handle(app);

export const GET = handler;
