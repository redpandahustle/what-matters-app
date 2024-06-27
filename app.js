const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Helper function to read/write data
const readData = () => JSON.parse(fs.readFileSync('data.json', 'utf-8'));
const writeData = (data) => fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

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
    res.render('today', { goals: data.goals, entries: data.entries[today] || {}, today });
});

app.post('/today', (req, res) => {
    const data = readData();
    const today = moment().format('YYYY-MM-DD');
    if (!data.entries[today]) {
        data.entries[today] = {};
    }
    data.entries[today][req.body.category] = req.body.entry;
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
