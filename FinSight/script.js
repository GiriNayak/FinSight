const API_URL = window.location.origin + '/api';

// Pagination settings
let currentPage = 1;
const PAGE_LIMIT = 10;

// State
let allTransactionsCache = [];
let serverPaginationDetected = false;
let serverTotalPages = 1;
let serverTotalCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    const by = (id) => document.getElementById(id);

    const getDateFilters = () => ({
        startDate: by('start-date-filter').value,
        endDate: by('end-date-filter').value,
    });

    const buildTransactionsURL = ({ page, limit, startDate, endDate } = {}) => {
        const params = new URLSearchParams();
        if (page) params.set('page', page);
        if (limit) params.set('limit', limit);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const qs = params.toString();
        return `${API_URL}/transactions${qs ? `?${qs}` : ''}`;
    };

    const formatIndianCurrency = (amount) => {
        const absAmount = Math.abs(amount);
        if (absAmount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
        if (absAmount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
        if (absAmount >= 1000) return `₹${(amount / 1000).toFixed(2)} K`;
        return `₹${Number(amount).toFixed(2)}`;
    };

    // Render transactions in the list
    const renderTransactionList = (transactions) => {
        const list = by('transaction-list');
        list.innerHTML = '';
        if (!transactions.length) return list.innerHTML = '<p>No transactions to display.</p>';

        transactions.forEach(t => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            const date = new Date(t.date).toLocaleDateString();
            const content = document.createElement('div');
            content.innerHTML = `
                <span class="${t.type}-text"><strong>${t.type.toUpperCase()}</strong></span><br>
                <strong>${t.category || ''}</strong>: ${t.description || ''}<br>
                <small>${date}</small>
            `;
            const rightSide = document.createElement('div');
            rightSide.style.display = 'flex';
            rightSide.style.alignItems = 'center';
            rightSide.style.gap = '8px';

            const amountSpan = document.createElement('span');
            amountSpan.textContent = `₹${(Number(t.amount) || 0).toFixed(2)}`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteTransaction(t.id));

            rightSide.appendChild(amountSpan);
            rightSide.appendChild(deleteButton);

            item.appendChild(content);
            item.appendChild(rightSide);
            list.appendChild(item);
        });
    };

    // Update pagination UI
    const updatePaginationControls = (totalPagesForUI) => {
        if (currentPage > totalPagesForUI) currentPage = totalPagesForUI;
        if (currentPage < 1) currentPage = 1;
        by('page-info').textContent = `Page ${currentPage} of ${totalPagesForUI}`;
        by('prev-btn').disabled = currentPage <= 1;
        by('next-btn').disabled = currentPage >= totalPagesForUI;
    };

    // Update summary cards
    const updateSummaryCards = (allTransactions) => {
        let totalIncome = 0, totalExpenses = 0;
        allTransactions.forEach(t => {
            const amt = Number(t.amount) || 0;
            if (t.type === 'income') totalIncome += amt;
            else totalExpenses += amt;
        });
        const balance = totalIncome - totalExpenses;
        by('total-income').textContent = formatIndianCurrency(totalIncome);
        by('total-expenses').textContent = formatIndianCurrency(totalExpenses);
        by('balance').textContent = formatIndianCurrency(balance);
        by('balance').style.color = balance >= 0 ? '#007bff' : '#dc3545';
    };

    // Draw charts
    const fetchSummaryAndDrawChart = (allTransactions) => {
        // Expenses by Category
        const expensesByCategory = {};
        allTransactions.forEach(t => { if (t.type === 'expense') expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount || 0); });

        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);
        const ctx = by('expenses-chart').getContext('2d');
        if (window.myPieChart) window.myPieChart.destroy();
        window.myPieChart = new Chart(ctx, { type: 'doughnut', data: { labels: categories, datasets: [{ data: amounts }] }, options: { responsive: true } });

        // Expenses Over Time
        const expensesOverTime = {};
        allTransactions.forEach(t => { if (t.type === 'expense') expensesOverTime[new Date(t.date).toLocaleDateString()] = (expensesOverTime[new Date(t.date).toLocaleDateString()] || 0) + Number(t.amount || 0); });
        const dates = Object.keys(expensesOverTime).sort((a, b) => new Date(a) - new Date(b));
        const expenseAmounts = dates.map(d => expensesOverTime[d]);
        const timeCtx = by('expenses-over-time-chart').getContext('2d');
        if (window.myLineChart) window.myLineChart.destroy();
        window.myLineChart = new Chart(timeCtx, { type: 'line', data: { labels: dates, datasets: [{ label: 'Expenses Over Time', data: expenseAmounts, borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.2)', fill: true, tension: 0.1 }] }, options: { responsive: true } });

        // Income Over Time
        const incomeOverTime = {};
        allTransactions.forEach(t => { if (t.type === 'income') incomeOverTime[new Date(t.date).toLocaleDateString()] = (incomeOverTime[new Date(t.date).toLocaleDateString()] || 0) + Number(t.amount || 0); });
        const incomeDates = Object.keys(incomeOverTime).sort((a, b) => new Date(a) - new Date(b));
        const incomeAmounts = incomeDates.map(d => incomeOverTime[d]);
        const incomeCtx = by('income-over-time-chart').getContext('2d');
        if (window.myIncomeChart) window.myIncomeChart.destroy();
        window.myIncomeChart = new Chart(incomeCtx, { type: 'line', data: { labels: incomeDates, datasets: [{ label: 'Income Over Time', data: incomeAmounts, borderColor: '#28a745', backgroundColor: 'rgba(40,167,69,0.2)', fill: true, tension: 0.1 }] }, options: { responsive: true } });
    };

    // Fetch page (supports server-side pagination if backend provides total)
    const fetchPage = async (page, limit, filters) => {
        const url = buildTransactionsURL({ page, limit, ...filters });
        const res = await fetch(url);
        const payload = await res.json();
        const data = payload?.data || [];
        const total = payload?.total || data.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return { data, totalCount: total, totalPages };
    };

    // Fetch all for summary
    const fetchAllForSummary = async (filters) => {
        const url = buildTransactionsURL(filters);
        const res = await fetch(url);
        const payload = await res.json();
        return payload?.data || [];
    };

    // Refresh all data
    const refreshAllData = async () => {
        try {
            const filters = getDateFilters();
            const pageResult = await fetchPage(currentPage, PAGE_LIMIT, filters);
            allTransactionsCache = pageResult.data;

            renderTransactionList(allTransactionsCache);
            updatePaginationControls(pageResult.totalPages);

            const fullData = await fetchAllForSummary(filters);
            updateSummaryCards(fullData);
            fetchSummaryAndDrawChart(fullData);
        } catch (err) {
            console.error(err);
        }
    };

    // Add transaction
    by('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTransaction = {
            type: by('transaction-type').value,
            amount: Number(by('transaction-amount').value),
            category: by('transaction-category').value,
            description: by('transaction-description').value,
            date: by('transaction-date').value,
        };
        const res = await fetch(`${API_URL}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTransaction) });
        if (res.ok) { by('add-transaction-form').reset(); currentPage = 1; refreshAllData(); }
    });

    // Delete transaction
    const deleteTransaction = async (id) => {
        const res = await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
        if (res.ok) refreshAllData();
    };

    // Receipt upload
    by('upload-receipt-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = by('receipt-file').files[0];
        if (!file) return alert('Select a file first');
        const formData = new FormData();
        const isPDF = file.type === 'application/pdf';
        formData.append(isPDF ? 'pdf' : 'receipt', file);
        const endpoint = isPDF ? `${API_URL}/receipts/extract-pdf` : `${API_URL}/receipts/upload`;
        const res = await fetch(endpoint, { method: 'POST', body: formData });
        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            by('transaction-amount').value = result.data.amount;
            by('transaction-category').value = result.data.category;
            by('transaction-description').value = result.data.description;
        } else alert(result.error);
    });

    // Pagination buttons
    by('prev-btn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; refreshAllData(); } });
    by('next-btn').addEventListener('click', async () => { currentPage++; refreshAllData(); });

    // Filter
    by('filter-btn').addEventListener('click', () => { currentPage = 1; refreshAllData(); });

    // Initial load
    refreshAllData();
});
