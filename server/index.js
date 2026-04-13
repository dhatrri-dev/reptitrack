const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


const tables = [
    'customers', 'receivers', 'shipments',
    'payments', 'tracking', 'users', 'alerts'
];

tables.forEach(t => {
    app.use(`/api/${t}`, require(`./routes/${t}`));
});

app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/reports', require('./routes/reports.js'));
app.use('/api/stats', require('./routes/stats.js'));
app.use('/api/sync', require('./routes/sync.js'));


app.listen(5000, () => console.log('Server running on port 5000'));