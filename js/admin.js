// Authentication Keys
const AUTH_CONFIG_KEY = 'admin_config';
const AUTH_SESSION_KEY = 'admin_session';

// UI Elements
const views = {
    authContainer: document.getElementById('auth-container'),
    phone: document.getElementById('step-phone'),
    otp: document.getElementById('step-otp'),
    setup: document.getElementById('step-setup'),
    login: document.getElementById('step-login'),
    dashboard: document.getElementById('dashboard-view')
};

// State
let allOrders = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    if (localStorage.getItem(AUTH_SESSION_KEY)) {
        renderDashboard();
    }
});

function checkSession() {
    const session = localStorage.getItem(AUTH_SESSION_KEY);
    const config = getAdminConfig();

    if (session) {
        showDashboardView();
    } else {
        showAuth(config);
    }
}

function showAuth(config) {
    views.dashboard.classList.add('hidden');
    views.authContainer.classList.remove('hidden');

    Object.values(views).forEach(el => {
        if (el && el.id && el.id.startsWith('step-')) el.classList.add('hidden');
    });

    if (config && config.isSetup) {
        views.login.classList.remove('hidden');
    } else {
        views.phone.classList.remove('hidden');
    }
}

function showDashboardView() {
    views.authContainer.classList.add('hidden');
    views.dashboard.classList.remove('hidden');
    renderDashboard();
}

// 1. Phone Handlers
async function sendOTP() {
    const phone = document.getElementById('mobileInput').value;
    if (!phone) return alert('Enter phone');

    try {
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.success) {
            // Show OTP for test purposes since this is a mock
            alert(`TEST OTP SENT: ${data.debug_otp}`);

            // Add on-screen backup in case alerts are blocked
            const feedback = document.createElement('div');
            feedback.innerHTML = `<p style="padding:10px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; margin-bottom:20px; color:#0369a1; font-weight:600;">
                Test Mode: Your OTP is <span style="font-size:1.2rem; color:#0c4a6e">${data.debug_otp}</span></p>`;
            views.otp.prepend(feedback);

            views.phone.classList.add('hidden');
            views.otp.classList.remove('hidden');
        } else {
            alert(data.message || 'Error');
        }
    } catch (e) {
        alert('Server Error');
    }
}

async function verifyOTP() {
    const otp = document.getElementById('otpInput').value;
    try {
        const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp })
        });
        const data = await res.json();
        if (data.success) {
            const config = getAdminConfig();
            if (config && config.isSetup) {
                // Already setup, but re-verifying phone? Usually login handles this.
                views.otp.classList.add('hidden');
                views.login.classList.remove('hidden');
            } else {
                views.otp.classList.add('hidden');
                views.setup.classList.remove('hidden');
            }
        } else {
            alert('Invalid OTP');
        }
    } catch (e) {
        alert('Verification Failed');
    }
}

// 2. Setup Handlers
function completeSetup() {
    const id = document.getElementById('setupId').value;
    const pass = document.getElementById('setupPass').value;
    if (!id || !pass) return alert('Fill all fields');

    const config = { adminId: id, adminPass: pass, isSetup: true };
    localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(config));
    alert('Setup Complete! Please login.');
    showAuth(config);
}

// 3. Login Handlers
function login() {
    const id = document.getElementById('loginId').value;
    const pass = document.getElementById('loginPass').value;
    const config = getAdminConfig();

    if (id === config.adminId && pass === config.adminPass) {
        localStorage.setItem(AUTH_SESSION_KEY, 'active');
        showDashboardView();
    } else {
        alert('Invalid Credentials');
    }
}

function logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    location.reload();
}

// Helper
function getAdminConfig() {
    const config = localStorage.getItem(AUTH_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
}

function restartAuth() {
    views.otp.classList.add('hidden');
    views.phone.classList.remove('hidden');
}

function clearData() {
    if (confirm('Clear setup?')) {
        localStorage.clear();
        location.reload();
    }
}

// --- Dashboard Logic ---

async function fetchOrders() {
    try {
        const res = await fetch('/api/orders');
        allOrders = await res.json();
        return allOrders;
    } catch (e) {
        console.error('Fetch error', e);
        return [];
    }
}

async function renderDashboard() {
    const orders = await fetchOrders();

    // Stats
    document.getElementById('totalOrders').innerText = orders.length;
    document.getElementById('pendingInquiries').innerText = orders.filter(o => o.type === 'inquiry' && o.status !== 'Completed').length;

    // Recent Table
    renderRecentTable(orders.slice(-5).reverse());
}

function renderRecentTable(items) {
    const tbody = document.getElementById('recentOrdersTable');
    tbody.innerHTML = items.map(item => `
        <tr>
            <td><span style="font-weight:600; color:var(--primary)">#${item.id}</span></td>
            <td><span style="font-weight:500">${item.name}</span></td>
            <td><span class="status ${item.type.toLowerCase()}">${item.type}</span></td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
            <td style="color:var(--text-muted)">${item.date}</td>
        </tr>
    `).join('');
}

// Navigation
function switchView(viewName) {
    // Hide all
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));

    // Simplified routing
    if (viewName === 'dashboard') {
        document.getElementById('view-dashboard').classList.remove('hidden');
        document.getElementById('pageTitle').innerText = 'Overview';
    } else if (viewName === 'orders') {
        document.getElementById('view-orders').classList.remove('hidden');
        currentFilter = 'order';
        document.getElementById('pageTitle').innerText = 'All Orders';
        renderAll();
    } else if (viewName === 'inquiries') {
        document.getElementById('view-orders').classList.remove('hidden');
        currentFilter = 'inquiry';
        document.getElementById('pageTitle').innerText = 'Inquiries & Requests';
        renderAll();
    }
}

// Global filter state
let currentFilter = null;

function renderAll() {
    const filtered = currentFilter ? allOrders.filter(o => o.type === currentFilter) : allOrders;
    const tbody = document.getElementById('allOrdersTable').querySelector('tbody');

    tbody.innerHTML = filtered.map(item => {
        const details = item.type === 'order'
            ? `<div style="font-weight:500;">${item.product}</div><div style="font-size:0.75rem; color:var(--text-muted);">${item.quantity} · ${item.address}</div>`
            : `<div style="font-style:italic; color:var(--text-main)">"${item.message}"</div>`;

        return `
            <tr>
                <td><strong style="color:var(--primary)">#${item.id}</strong><br><small style="color:var(--text-muted)">${item.date}</small></td>
                <td><div style="font-weight:600">${item.name}</div><small style="color:var(--text-muted)">${item.phone}</small></td>
                <td>${details}</td>
                <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
                <td>
                   <div style="display:flex; gap:8px;">
                       <button class="btn-modern" style="padding:6px; background:var(--primary)" title="Mark Completed" onclick="updateStatus('${item.id}', 'Completed')">
                           <i class="ri-check-line" style="font-size:1rem"></i>
                       </button>
                       <button class="btn-modern" style="padding:6px; background:#FEE2E2; color:#B91C1C" title="Delete" onclick="deleteItem('${item.id}')">
                           <i class="ri-delete-bin-line" style="font-size:1rem"></i>
                       </button>
                   </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateStatus(id, newStatus) {
    await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    renderDashboard();
    renderAll();
}

async function deleteItem(id) {
    if (!confirm('Delete this record?')) return;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    renderDashboard();
    renderAll();
}
