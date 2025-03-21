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

const PAYLOAD = { page_size: 1 };

app.get('/api', async (c) => {
  const stats = await buildStats();
  return c.json(stats);
});

async function buildStats() {
  const [cemantixData, cemantleData] = await Promise.all([
    fetchCemantixData(CEMANTIX_NOTION_TOKEN, CEMANTIX_DATABASE_ID),
    fetchCemantixData(CEMANTLE_NOTION_TOKEN, CEMANTLE_DATABASE_ID),
  ]);

  return {
    cemantix: {
      lastWord: retrieveWordOfTheDay(cemantixData),
      elapsedTime: retrieveElapsedTime(cemantixData),
      requestsNumber: retrieveRequestsNumber(cemantixData),
      date: retrieveWordDate(cemantixData),
    },
    cemantle: {
      lastWord: retrieveWordOfTheDay(cemantleData),
      elapsedTime: retrieveElapsedTime(cemantleData),
      requestsNumber: retrieveRequestsNumber(cemantleData),
      date: retrieveWordDate(cemantleData),
    },
  };
}

async function fetchCemantixData(token, dbId) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2021-08-16',
  };

  const response = await fetch(
    `https://api.notion.com/v1/databases/${dbId}/query`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(PAYLOAD),
    }
  );

  console.log(`${response.status} ${response.statusText}`);
  return await response.json();
}

const retrieveWordOfTheDay = (data) => {
  return data.results[0].properties.Word.rich_text[0].plain_text;
}

const retrieveElapsedTime = (data) => {
  const elapsed = data.results[0].properties['Elapsed time'].rich_text[0].plain_text;
  return elapsed.slice(0, elapsed.lastIndexOf('.'));
}

const retrieveRequestsNumber = (data) => {
  return data.results[0].properties.Attempts.number;
}

const retrieveWordDate = (data) => {
  const date = data.results[0].properties.Date.rich_text[0].plain_text;
  const parsed = date.split('/');
  return `${parsed[1]}/${parsed[0]}/${parsed[2]}`;
}

const handler = handle(app);

export const GET = handler;
