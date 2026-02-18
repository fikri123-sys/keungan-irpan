// State Management
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';

// Helper Functions
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentMonth() {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function isThisMonth(date) {
    const now = new Date();
    const tgl = new Date(date);
    return tgl.getMonth() === now.getMonth() && 
           tgl.getFullYear() === now.getFullYear();
}

function isThisYear(date) {
    const now = new Date();
    const tgl = new Date(date);
    return tgl.getFullYear() === now.getFullYear();
}

function isToday(date) {
    return date === getTodayDate();
}

// Filter Functions
function filterTransactions(filterType) {
    currentFilter = filterType;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Update filter info
    const filterInfo = document.getElementById('filterInfo');
    const filterTexts = {
        'all': 'Semua transaksi',
        'day': 'Transaksi hari ini',
        'month': 'Transaksi bulan ini',
        'year': 'Transaksi tahun ini'
    };
    
    filterInfo.innerHTML = `<i class="fas fa-info-circle"></i> ${filterTexts[filterType]}`;
    
    displayTransactions();
}

function getFilteredTransactions() {
    switch(currentFilter) {
        case 'day':
            return transactions.filter(t => isToday(t.date));
        case 'month':
            return transactions.filter(t => isThisMonth(t.date));
        case 'year':
            return transactions.filter(t => isThisYear(t.date));
        default:
            return transactions;
    }
}

// Update Functions
function updateBalances() {
    // Total keseluruhan
    const totalBalance = transactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
    
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Bulan ini
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && isThisMonth(t.date))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpense = transactions
        .filter(t => t.type === 'expense' && isThisMonth(t.date))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyRemaining = monthlyIncome - monthlyExpense;
    
    // Update UI
    document.getElementById('totalBalance').textContent = formatRupiah(totalBalance);
    document.getElementById('totalIncome').textContent = `Rp ${formatRupiah(totalIncome)}`;
    document.getElementById('totalExpense').textContent = `Rp ${formatRupiah(totalExpense)}`;
    document.getElementById('monthlyIncome').textContent = `Rp ${formatRupiah(monthlyIncome)}`;
    document.getElementById('monthlyExpense').textContent = `Rp ${formatRupiah(monthlyExpense)}`;
    document.getElementById('monthlyRemaining').textContent = `Rp ${formatRupiah(monthlyRemaining)}`;
    
    // Update progress bar
    const progress = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;
    document.getElementById('monthlyProgress').style.width = `${Math.min(progress, 100)}%`;
}

function displayTransactions() {
    const listElement = document.getElementById('transactionList');
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Belum ada transaksi</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    filteredTransactions.forEach((t, index) => {
        const originalIndex = transactions.findIndex(tr => 
            tr.desc === t.desc && 
            tr.amount === t.amount && 
            tr.date === t.date
        );
        
        const icon = t.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down';
        const iconClass = t.type === 'income' ? 'income' : 'expense';
        const sign = t.type === 'income' ? '+' : '-';
        
        // Format date
        const dateObj = new Date(t.date);
        const formattedDate = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        html += `
            <div class="transaction-item">
                <div class="transaction-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-desc">${t.desc}</div>
                    <div class="transaction-date">
                        <i class="far fa-calendar-alt"></i> ${formattedDate}
                    </div>
                </div>
                <div class="transaction-amount ${iconClass}">
                    ${sign} Rp ${formatRupiah(t.amount)}
                </div>
                <button class="delete-btn" onclick="deleteTransaction(${originalIndex})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    listElement.innerHTML = html;
}

// Transaction Functions
function addTransaction() {
    const desc = document.getElementById('desc').value.trim();
    const amount = parseInt(document.getElementById('amount').value);
    const type = document.querySelector('input[name="type"]:checked').value;
    
    if (!desc || !amount || amount <= 0) {
        alert('Harap isi keterangan dan jumlah dengan benar!');
        return;
    }
    
    transactions.push({
        desc,
        amount,
        type,
        date: getTodayDate()
    });
    
    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Reset form
    document.getElementById('desc').value = '';
    document.getElementById('amount').value = '';
    
    // Update UI
    updateBalances();
    displayTransactions();
    
    // Focus back to description
    document.getElementById('desc').focus();
}

function deleteTransaction(index) {
    if (confirm('Hapus transaksi ini?')) {
        transactions.splice(index, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateBalances();
        displayTransactions();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    
    // Set current month
    document.getElementById('currentMonth').textContent = getCurrentMonth();
    
    // Initial display
    updateBalances();
    displayTransactions();
    
    // Enter key shortcut
    document.getElementById('amount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTransaction();
    });
});