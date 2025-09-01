// server.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const pdf = require('pdf-parse'); 
const app = express();
const db = require('./database.js'); 

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

const upload = multer();

// API endpoint to create a new transaction
app.post('/api/transactions', (req, res) => {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount || !category || !date) {
        return res.status(400).json({ error: 'Missing required fields: type, amount, category, or date' });
    }

    const sql = 'INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)';
    const params = [type, amount, category, description, date];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, ...req.body }
        });
    });
});

// API endpoint to list all transactions in a time range with pagination
app.get('/api/transactions', (req, res) => {
    const { startDate, endDate, _page = 1, _limit = 10 } = req.query;
    const page = parseInt(_page);
    const limit = parseInt(_limit);
    const offset = (page - 1) * limit;

    const start = startDate ? new Date(startDate).toISOString() : '1970-01-01T00:00:00.000Z';
    const end = endDate ? new Date(endDate).toISOString() : new Date().toISOString();

    const sql = `
        SELECT * FROM transactions 
        WHERE date BETWEEN ? AND ? 
        ORDER BY date DESC 
        LIMIT ? OFFSET ?`;
    const params = [start, end, limit, offset];

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        const countSql = `SELECT COUNT(*) AS total FROM transactions WHERE date BETWEEN ? AND ?`;
        const countParams = [start, end];

        db.get(countSql, countParams, (countErr, countRow) => {
            if (countErr) {
                res.status(400).json({ "error": countErr.message });
                return;
            }
            res.json({
                "message": "success",
                "data": rows,
                "total": countRow.total,
                "page": page,
                "limit": limit
            });
        });
    });
});

// API endpoint for financial summary data (for graphs)
app.get('/api/summary', (req, res) => {
    const sql = `
        SELECT category, SUM(amount) AS totalAmount
        FROM transactions
        WHERE type = 'expense'
        GROUP BY category
        ORDER BY totalAmount DESC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// API endpoint to handle receipt uploads (simulated for images)
app.post('/api/receipts/upload', upload.single('receipt'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const simulatedData = {
        amount: (Math.random() * 80 + 20).toFixed(2),
        category: 'Extracted',
        description: `Extracted from ${req.file.originalname}`,
    };

    res.json({
        "message": "File uploaded and processed successfully.",
        "data": simulatedData
    });
});

// API endpoint to extract total amount from a PDF
app.post('/api/receipts/extract-pdf', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    try {
        const dataBuffer = req.file.buffer;
        const data = await pdf(dataBuffer);
        const text = data.text;

        const match = text.match(/Total Amount.*?(\d+\.\d{2})/s);

        let extractedAmount = null;
        if (match && match[1]) {
            extractedAmount = parseFloat(match[1]);
        }

        if (extractedAmount) {
            res.json({
                message: "Amount extracted successfully.",
                data: {
                    amount: extractedAmount,
                    category: 'PDF Receipt',
                    description: `Extracted from ${req.file.originalname}`
                }
            });
        } else {
            res.status(404).json({
                error: "Could not find a 'Total Amount' in the PDF. Please enter manually.",
                data: null
            });
        }
    } catch (error) {
        console.error('Error parsing PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF file.' });
    }
});

// API endpoint to delete a transaction by ID
app.delete('/api/transactions/:id', (req, res) => {
    const transactionId = req.params.id;

    const sql = `DELETE FROM transactions WHERE id = ?`;

    db.run(sql, transactionId, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "Transaction deleted successfully.",
            "changes": this.changes
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});