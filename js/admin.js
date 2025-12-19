// Mock Authentication & Dashboard Logic

// Constants
const ADMIN_CONFIG_KEY = 'greenLeaf_admin_config';
const AUTH_SESSION_KEY = 'greenLeaf_auth_session';
const DATA_KEY = 'greenLeaf_orders';

// DOM Elements
const views = {
    authContainer: document.getElementById('auth-container'),
    phone: document.getElementById('step-phone'),
    otp: document.getElementById('step-otp'),
    setup: document.getElementById('step-setup'),
    login: document.getElementById('step-login'),
    dashboard: document.getElementById('dashboard-view')
};

// Global Data
let currentOTP = null;
let allData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
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

function getAdminConfig() {
    return JSON.parse(localStorage.getItem(ADMIN_CONFIG_KEY) || 'null');
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

    const config = getAdminConfig();
    if (config) {
        document.getElementById('adminNameDisplay').innerText = config.id;
    }

    // Load Data
    renderAll();
}

/* --- Authentication Flows --- */
function sendOTP() {
    const phone = document.getElementById('mobileInput').value;
    const error = document.getElementById('phoneError');
    if (!/^\d{10}$/.test(phone)) {
        error.innerText = "Please enter a valid 10-digit mobile number.";
        return;
    }
    error.innerText = "";

    fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message || 'OTP Sent (Check console/server logs)');
            if (data.debug_otp) alert(`[MOCK SMS] OTP: ${data.debug_otp}`); // Keep visual for user convenience
            views.phone.classList.add('hidden');
            views.otp.classList.remove('hidden');
        })
        .catch(err => alert('Failed to send OTP'));
}

function verifyOTP() {
    const input = document.getElementById('otpInput').value;

    fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: input })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const config = getAdminConfig();
                views.otp.classList.add('hidden');
                views.setup.classList.remove('hidden');
            } else {
                document.getElementById('otpError').innerText = "Invalid OTP.";
            }
        });
}

function restartAuth() {
    views.otp.classList.add('hidden');
    views.phone.classList.remove('hidden');
}

function completeSetup() {
    const id = document.getElementById('setupId').value;
    const pass = document.getElementById('setupPass').value;
    if (id.length < 3 || pass.length < 4) {
        document.getElementById('setupError').innerText = "Admin ID 3+ chars, Pass 4+ chars.";
        return;
    }
    const config = { isSetup: true, id: id, pass: pass };
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
    alert("Setup Complete!");
    views.setup.classList.add('hidden');
    views.login.classList.remove('hidden');
}

function login() {
    const id = document.getElementById('loginId').value;
    const pass = document.getElementById('loginPass').value;

    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pass })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem(AUTH_SESSION_KEY, 'true');
                // Save local credentials for name display since simplistic setup
                localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify({ isSetup: true, id: id }));
                showDashboardView();
            } else {
                document.getElementById('loginError').innerText = "Invalid credentials.";
            }
        });
}

function logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    location.reload();
}

function clearData() {
    if (confirm("Reset all admin setup data?")) {
        localStorage.clear();
        location.reload();
    }
}

/* --- Dashboard Logic --- */

function loadData() {
    // Fetch from API
    fetch('/api/orders')
        .then(res => res.json())
        .then(data => {
            allData = data;
            updateStats();
            renderRecentTable();
            renderAllTable();
        })
        .catch(err => console.error('Error fetching data:', err));
}

function renderAll() {
    loadData();
}

function updateStats() {
    document.getElementById('totalOrders').innerText = allData.length;
    const pending = allData.filter(d => d.status === 'New' || d.status === 'Pending').length;
    document.getElementById('pendingInquiries').innerText = pending;
    const completed = allData.filter(d => d.status === 'Completed').length;
    document.getElementById('totalRevenue').innerText = `₹${completed * 5000}`;
}

function renderRecentTable() {
    const tbody = document.getElementById('recentOrdersTable');
    tbody.innerHTML = '';

    // Top 5
    allData.slice(0, 5).forEach(item => {
        const row = `<tr>
            <td>#${item.id}</td>
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td><span class="status ${getStatusClass(item.status)}">${item.status}</span></td>
            <td>${item.date}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function renderAllTable() {
    const tbody = document.querySelector('#allOrdersTable tbody');
    tbody.innerHTML = '';

    allData.forEach((item, index) => {
        const row = `<tr>
            <td><strong>#${item.id}</strong><br><small>${item.date}</small></td>
            <td>${item.name}<br><small>${item.phone}</small></td>
            <td>${item.type}<br><small>${item.message || '-'}</small></td>
            <td><span class="status ${getStatusClass(item.status)}">${item.status}</span></td>
            <td>
                <button class="btn-sm" style="color:green; border-color:green;" onclick="updateStatus('${item.id}', 'Completed')">✓</button>
                <button class="btn-sm" style="color:red; border-color:red;" onclick="deleteItem('${item.id}')">✗</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function getStatusClass(status) {
    if (status === 'New') return 'new';
    if (status === 'Completed') return 'completed';
    return 'pending';
}

function updateStatus(id, newStatus) {
    if (!confirm('Mark this order as Completed?')) return;

    fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) renderAll();
        })
        .catch(err => console.error('Error updating status:', err));
}

function deleteItem(id) {
    if (!confirm('Delete this record permanently?')) return;

    fetch(`/api/orders/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) renderAll();
        })
        .catch(err => console.error('Error deleting item:', err));
}

function saveAndRender() {
    // Deprecated in favor of API calls
}

function switchView(viewName) {
    // Hide all
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));

    // Show target
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    // Update menu active state
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    // Simple match for demo
    if (viewName === 'dashboard')
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
    else
        document.querySelector('.menu-item:nth-child(2)').classList.add('active');
}
