const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Helper function to read/write data
const readData = () => {
  if (fs.existsSync('data.json')) {
    return JSON.parse(fs.readFileSync('data.json', 'utf-8'));
  } else {
    return { goals: [], entries: {} };
  }
};

const writeData = (data) => fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

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
app.get('/', (req, res) => {
  const data = readData();
  if (data.goals.length === 0) {
    res.redirect('/what-matters');
  } else {
    res.redirect('/today');
  }
});

app.get('/what-matters', (req, res) => {
  const data = readData();
  res.render('index', { goals: data.goals });
});

app.post('/what-matters', (req, res) => {
  const data = readData();
  const newGoal = {
    category: req.body.category,
    goal: req.body.goal
  };
  data.goals.push(newGoal);
  writeData(data);
  res.redirect('/what-matters');
});

app.get('/today', (req, res) => {
  const data = readData();
  const today = moment().format('YYYY-MM-DD');

  if (!data.entries) {
    data.entries = {};
  }

  if (!data.entries[today]) {
    data.entries[today] = {};
  }

  res.render('today', { goals: data.goals, entries: data.entries[today], getRatingDescription });
});

app.post('/today', (req, res) => {
  const data = readData();
  const today = moment().format('YYYY-MM-DD');

  if (!data.entries) {
    data.entries = {};
  }

  if (!data.entries[today]) {
    data.entries[today] = {};
  }

  const categories = Array.isArray(req.body.category) ? req.body.category : [req.body.category];
  const entries = Array.isArray(req.body.entry) ? req.body.entry : [req.body.entry];

  categories.forEach((category, index) => {
    const entry = entries[index];
    const ratingKey = `rating_${category}`;
    const rating = req.body[ratingKey];

    if (entry && entry.trim() !== "") {
      data.entries[today][category] = entry;
    }

    if (rating && rating.trim() !== "") {
      data.entries[today][`${category}_rating`] = rating;
    }
  });

  writeData(data);
  res.redirect('/today');
});


app.get('/history', (req, res) => {
  const data = readData();
  res.render('history', { goals: data.goals, entries: data.entries });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
