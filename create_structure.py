import os

project_structure = {
    "what-matters-app": {
        "node_modules": {},
        "public": {
            "css": {
                "styles.css": """
body {
    font-family: Arial, sans-serif;
    background-color: #121212;
    color: #ffffff;
    margin: 0;
    padding: 0;
}

header {
    background-color: #1f1f1f;
    padding: 20px;
    text-align: center;
}

nav a {
    color: #ffffff;
    margin: 0 15px;
    text-decoration: none;
}

main {
    padding: 20px;
}

form {
    margin-bottom: 20px;
}

input, textarea, button {
    display: block;
    margin: 10px 0;
    padding: 10px;
    width: 100%;
}

button {
    background-color: #6200ea;
    border: none;
    color: white;
    cursor: pointer;
}

button:hover {
    background-color: #3700b3;
}

ul {
    list-style: none;
    padding: 0;
}

li {
    background-color: #1f1f1f;
    margin: 10px 0;
    padding: 10px;
}
                """
            },
            "js": {
                "script.js": ""
            },
            "images": {}
        },
        "views": {
            "index.ejs": """
<!DOCTYPE html>
<html>
<head>
    <title>What Matters?</title>
    <link rel="stylesheet" type="text/css" href="/css/styles.css">
</head>
<body>
    <header>
        <h1>What Matters?</h1>
        <nav>
            <a href="/">What Matters?</a>
            <a href="/today">Today</a>
            <a href="/history">History</a>
        </nav>
    </header>
    <main>
        <form action="/what-matters" method="POST">
            <input type="text" name="category" placeholder="Life Category" required>
            <input type="text" name="goal" placeholder="Life Goal" required>
            <button type="submit">Add Goal</button>
        </form>
        <ul>
            <% goals.forEach(goal => { %>
                <li>
                    <strong><%= goal.category %>:</strong> <%= goal.goal %>
                </li>
            <% }) %>
        </ul>
    </main>
</body>
</html>
            """,
            "today.ejs": """
<!DOCTYPE html>
<html>
<head>
    <title>Today</title>
    <link rel="stylesheet" type="text/css" href="/css/styles.css">
</head>
<body>
    <header>
        <h1>Today</h1>
        <nav>
            <a href="/">What Matters?</a>
            <a href="/today">Today</a>
            <a href="/history">History</a>
        </nav>
    </header>
    <main>
        <form action="/today" method="POST">
            <% goals.forEach(goal => { %>
                <div class="goal-entry">
                    <h3><%= goal.category %></h3>
                    <p><%= goal.goal %></p>
                    <textarea name="entry" placeholder="What did you do today?"><%= entries[goal.category] || '' %></textarea>
                    <input type="hidden" name="category" value="<%= goal.category %>">
                    <button type="submit">Save</button>
                </div>
            <% }) %>
        </form>
    </main>
</body>
</html>
            """,
            "history.ejs": """
<!DOCTYPE html>
<html>
<head>
    <title>History</title>
    <link rel="stylesheet" type="text/css" href="/css/styles.css">
</head>
<body>
    <header>
        <h1>History</h1>
        <nav>
            <a href="/">What Matters?</a>
            <a href="/today">Today</a>
            <a href="/history">History</a>
        </nav>
    </header>
    <main>
        <% goals.forEach(goal => { %>
            <div class="goal-history">
                <h3><%= goal.category %></h3>
                <p><%= goal.goal %></p>
                <ul>
                    <% Object.keys(entries).forEach(date => { %>
                        <% if (entries[date][goal.category]) { %>
                            <li><%= date %>: <%= entries[date][goal.category] %></li>
                        <% } %>
                    <% }) %>
                </ul>
            </div>
        <% }) %>
    </main>
</body>
</html>
            """
        },
        ".gitignore": """
node_modules
data.json
        """,
        "app.js": """
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
        """,
        "package.json": """
{
  "name": "what-matters-app",
  "version": "1.0.0",
  "description": "A simple app to track life goals and daily progress",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "body-parser": "^1.19.0",
    "ejs": "^3.1.6",
    "express": "^4.17.1",
    "moment": "^2.29.1"
  },
  "author": "",
  "license": "ISC"
}
        """
    }
}

def create_project_structure(base_path, structure):
    for name, content in structure.items():
        path = os.path.join(base_path, name)
        if isinstance(content, dict):
            os.makedirs(path, exist_ok=True)
            create_project_structure(path, content)
        else:
            with open(path, 'w') as file:
                file.write(content.strip())

if __name__ == "__main__":
    create_project_structure('.', project_structure)
    print("Project structure created successfully.")
