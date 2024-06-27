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
const readData = () => {
    if (fs.existsSync('data.json')) {
        return JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    } else {
        return { goals: [], entries: {} };
    }
};

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

    // Ensure the entries structure is properly initialized
    if (!data.entries) {
        data.entries = {};
    }

    if (!data.entries[today]) {
        data.entries[today] = {};
    }

    res.render('today', { goals: data.goals, entries: data.entries[today] });
});

app.post('/today', (req, res) => {
    const data = readData();
    const today = moment().format('YYYY-MM-DD');

    // Ensure the entries structure is properly initialized
    if (!data.entries) {
        data.entries = {};
    }

    if (!data.entries[today]) {
        data.entries[today] = {};
    }

    const categories = req.body.category;
    const entries = req.body.entry;

    // Handle multiple categories and entries
    if (Array.isArray(categories) && Array.isArray(entries)) {
        categories.forEach((category, index) => {
            const entry = entries[index];

            // Save each entry under its respective category key
            if (entry.trim() === "") {
                delete data.entries[today][category];
            } else {
                data.entries[today][category] = entry;
            }
        });
    } else {
        // Handle single category and entry
        const category = categories;
        const entry = entries;

        if (entry.trim() === "") {
            delete data.entries[today][category];
        } else {
            data.entries[today][category] = entry;
        }
    }

    // Debugging statement to check the structure before saving
    //console.log('Data Entries:', JSON.stringify(data.entries, null, 2));

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
