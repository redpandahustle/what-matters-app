const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const momentTimezone = require('moment-timezone');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Postgres connection
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: 'require',
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

async function getPgVersion() {
  const result = await sql`select version()`;
  console.log(result);
}

getPgVersion();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Function to get rating descriptions
const getRatingDescription = (rating) => {
  switch (rating) {
    case 1: return "Very Poor";
    case 2: return "Poor";
    case 3: return "Average";
    case 4: return "Good";
    case 5: return "Excellent";
    default: return "";
  }
};

// Routes
app.get('/', async (req, res) => {
  try {
    const goals = await sql`SELECT * FROM what_matters_list WHERE archived = false`;
    if (goals.length === 0) {
      res.redirect('/what-matters');
    } else {
      res.redirect('/today');
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/what-matters', async (req, res) => {
  try {
    const goals = await sql`SELECT * FROM what_matters_list WHERE archived = false`;
    const archivedGoals = await sql`SELECT * FROM what_matters_list WHERE archived = true`;
    res.render('index', { goals, archivedGoals });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/what-matters', async (req, res) => {
  const { what_matters, why_it_matters } = req.body;
  try {
    await sql`INSERT INTO what_matters_list (what_matters, why_it_matters, archived) VALUES (${what_matters}, ${why_it_matters}, false)`;
    res.redirect('/what-matters');
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/archive', async (req, res) => {
  const { id } = req.body;
  try {
    await sql`UPDATE what_matters_list SET archived = true WHERE id = ${id}`;
    res.redirect('/what-matters');
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/today', async (req, res) => {
  try {
    const goals = await sql`SELECT * FROM what_matters_list WHERE archived = false`;
    const today = momentTimezone().tz('America/Chicago').format('YYYY-MM-DD');
    const entries = await sql`SELECT * FROM entries WHERE entry_date = ${today}`;
    const entriesMap = {};

    entries.forEach(entry => {
      entriesMap[entry.what_matters_id] = { entry: entry.entry, rating: entry.rating };
    });

    res.render('today', { goals, entries: entriesMap, getRatingDescription });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/today', async (req, res) => {
  const today = momentTimezone().tz('America/Chicago').format('YYYY-MM-DD');

  try {
    const goals = await sql`SELECT * FROM what_matters_list WHERE archived = false`;

    for (let goal of goals) {
      const entry = req.body[`entry_${goal.id}`];
      const rating = req.body[`rating_${goal.id}`];

      // Logging the values to troubleshoot
      console.log(`Processing entry for what_matters_id: ${goal.id}`);
      console.log(`Entry: ${entry}`);
      console.log(`Rating: ${rating}`);

      if (entry && entry.trim() !== "") {
        await sql`
          INSERT INTO entries (user_id, what_matters_id, entry_date, entry, rating)
          VALUES (1, ${goal.id}, ${today}, ${entry}, ${rating})
          ON CONFLICT (user_id, what_matters_id, entry_date)
          DO UPDATE SET entry = ${entry}, rating = ${rating}
        `;
        console.log(`Inserted/Updated entry for what_matters_id: ${goal.id}`);
      }
    }

    res.redirect('/today');
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/history', async (req, res) => {
  try {
    const goals = await sql`SELECT * FROM what_matters_list WHERE archived = false`;
    const archivedGoals = await sql`SELECT * FROM what_matters_list WHERE archived = true`;
    const entries = await sql`
      SELECT 
        what_matters_id, 
        to_char(entry_date, 'YYYY-MM-DD') as entry_date, 
        entry, 
        rating 
      FROM 
        entries
    `;
    const entriesMap = {};

    entries.forEach(entry => {
      const date = entry.entry_date;
      if (!entriesMap[date]) {
        entriesMap[date] = {};
      }
      entriesMap[date][entry.what_matters_id] = { entry: entry.entry, rating: entry.rating };
    });

    res.render('history', { goals, archivedGoals, entries: entriesMap });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
