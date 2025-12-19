const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'orders.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files (HTML/CSS/JS)

// --- Helper Functions ---
// --- Helper Functions ---
function ensureDataDir() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getOrders() {
    try {
        ensureDataDir();
        if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
        return JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (err) {
        console.error('Error reading orders:', err);
        return [];
    }
}

function saveOrders(orders) {
    try {
        ensureDataDir();
        fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
    } catch (err) {
        console.error('Error saving orders:', err);
    }
}

// --- API Endpoints ---

// 1. Auth Mock (OTP)
let lastOTP = null;

app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    // STRICT LOCK: Only allow the owner's number
    if (phone !== '8432464520') {
        return res.json({ success: false, message: 'Access Denied: Number not authorized for Admin.' });
    }

    lastOTP = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`[AUTH] OTP for ${phone}: ${lastOTP}`);

    // In real app, send SMS here. For now, we allow access.
    res.json({ success: true, message: 'OTP Sent to Admin Mobile', debug_otp: lastOTP });
});

app.post('/api/auth/verify', (req, res) => {
    const { otp } = req.body;
    if (otp === lastOTP) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid OTP' });
    }
});

app.post('/api/auth/login', (req, res) => {
    // Basic mock login
    const { id, pass } = req.body;
    // In real app, check DB. Here we accept any non-empty credential for demo setup
    if (id && pass) {
        res.json({ success: true, token: 'mock-jwt-token' });
    } else {
        res.status(401).json({ error: 'Invalid Credentials' });
    }
});

// 2. Orders CRUD
app.get('/api/orders', (req, res) => {
    const orders = getOrders();
    res.json(orders);
});

app.post('/api/orders', (req, res) => {
    const newOrder = req.body;
    newOrder.id = 'ORD-' + Date.now().toString().slice(-6);
    newOrder.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    newOrder.status = 'New';

    const orders = getOrders();
    orders.unshift(newOrder); // Add to top
    saveOrders(orders);

    res.json({ success: true, order: newOrder });
});

app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    let orders = getOrders();
    const index = orders.findIndex(o => o.id === id); // Simple ID matching (string in local db)
    // Note: Our ID generation 'ORD-...' is unique enough for this demo

    // Actually find by ID property inside object
    // The param might be just the number part or full string? 
    // Let's assume ID is accurate. simple find.
    const orderIndex = orders.findIndex(o => o.id === id); // exact match

    if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        saveOrders(orders);
        res.json({ success: true });
    } else {
        // Try finding by index if passed as index (legacy admin.js)
        if (orders[id]) {
            orders[id].status = status;
            saveOrders(orders);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    }
});

app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    let orders = getOrders();

    // Filter out
    const initialLen = orders.length;
    orders = orders.filter(o => o.id !== id);

    // If legacy code sends index
    if (orders.length === initialLen && !isNaN(id)) {
        orders.splice(id, 1);
    }

    saveOrders(orders);
    res.json({ success: true });
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
