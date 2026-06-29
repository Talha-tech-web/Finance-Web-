

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let allData = [];
let filteredData = [];
let currentPage = 1;
let editingId = null;
let deletingId = null;
let searchQuery = '';

// Dom
const tbody = document.getElementById('txn-tbody');
const searchInput = document.getElementById('search-input');
const topSearchInput = document.getElementById('top-search');
const addBtn = document.getElementById('add-btn');
const txnModal = document.getElementById('txn-modal');
const deleteModal = document.getElementById('delete-modal');
const modalTitle = document.getElementById('modal-title');
const txnForm = document.getElementById('txn-form');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const closeModalBtn = document.getElementById('close-modal');
const toast = document.getElementById('toast');
const paginationEl = document.getElementById('pagination');
const rowCountEl = document.getElementById('row-count');

// Summary elements
const totalEl = document.getElementById('total-amount');
const incomeEl = document.getElementById('income-amount');
const expenseEl = document.getElementById('expense-amount');

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEvents();
});

// ── LOAD DATA ──
async function loadData() {
  setLoading(true);
  const { data, error } = await db
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Failed to load data: ' + error.message, 'error');
    setLoading(false);
    return;
  }

  allData = data || [];
  applySearch();
  updateSummary();
  window.dispatchEvent(new Event('finledger:loaded'));
}

function updateSummary() {
  const income = allData.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount || 0), 0);
  const expense = allData.filter(r => r.type === 'expense').reduce((s, r) => s + Number(r.amount || 0), 0);
  const total = income - expense;

  totalEl.innerHTML = formatCurrencyHTML(total);
  incomeEl.innerHTML = formatCurrencyHTML(income);
  expenseEl.innerHTML = formatCurrencyHTML(expense);
}

// ── SEARCH ──
function applySearch() {
  const q = searchQuery.toLowerCase().trim();
  if (!q) {
    filteredData = [...allData];
  } else {
    filteredData = allData.filter(r =>
      (r.category || '').toLowerCase().includes(q) ||
      (r.method || '').toLowerCase().includes(q) ||
      (r.type || '').toLowerCase().includes(q) ||
      (r.customer_supplier || '').toLowerCase().includes(q) ||
      (r.product || '').toLowerCase().includes(q) ||
      (r.invoice_no || '').toLowerCase().includes(q) ||
      String(r.amount || '').includes(q)
    );
  }
  currentPage = 1;
  renderTable();
  renderPagination();
}

// ── RENDER TABLE ──
function renderTable() {
  setLoading(false);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredData.slice(start, start + PAGE_SIZE);

  rowCountEl.textContent = `Showing ${filteredData.length === 0 ? 0 : start + 1}–${Math.min(start + PAGE_SIZE, filteredData.length)} of ${filteredData.length} records`;

  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" class="td-empty-large">
        <svg class="empty-svg-container" xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/></svg>
        <p>No transactions found</p>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = pageData.map(r => `
    <tr>
      <td>${formatDate(r.created_at)}</td>
      <td class="text-muted">${r.created_at ? new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</td>
      <td class="text-muted">${escHtml(r.customer_supplier || '—')}</td>
      <td><span class="cat-pill">${escHtml(r.category || '—')}</span></td>
      <td class="text-muted">${escHtml(r.product || '—')}</td>
      <td>${escHtml(r.method || '—')}</td>
      <td class="${r.type === 'income' ? 'amount-income' : 'amount-expense'}">
        ${r.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(r.amount))}
      </td>
      <td class="text-muted">${escHtml(r.mobile_no || '—')}</td>
      <td><span class="type-badge ${r.type === 'income' ? 'type-income' : 'type-expense'}">${r.type || '—'}</span></td>
      <td>
        <div class="action-btns">
          <button class="icon-btn" onclick="openEdit(${r.id})" title="Edit" aria-label="Edit transaction">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
          </button>
          <button class="icon-btn delete" onclick="openDelete(${r.id})" title="Delete" aria-label="Delete transaction">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  if (totalPages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';
  // Prev
  html += `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<span class="pagination-dots">…</span>`;
      continue;
    }
    const isActive = i === currentPage;
    html += `<button class="page-btn ${isActive ? 'active' : ''}" onclick="goPage(${i})"${isActive ? ' aria-current="page"' : ''} aria-label="Page ${i}">${i}</button>`;
  }

  // Next
  html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">›</button>`;
  paginationEl.innerHTML = html;
}

function goPage(p) {
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  renderTable();
  renderPagination();
}

// ── OPEN ADD MODAL ──
function openAdd() {
  editingId = null;
  modalTitle.textContent = 'Add Transaction';
  txnForm.reset();
  document.getElementById('field-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('field-time').value = new Date().toTimeString().slice(0, 5);
  openModal(txnModal);
}

// Open Edit Modal
function openEdit(id) {
  const r = allData.find(x => x.id === id);
  if (!r) return;
  editingId = id;
  modalTitle.textContent = 'Edit Transaction';

  document.getElementById('field-category').value = r.category || '';
    const created = new Date(r.created_at);
    document.getElementById('field-date').value = created.toISOString().split('T')[0];
    document.getElementById('field-time').value = created.toTimeString().slice(0,5);
  document.getElementById('field-amount').value = r.amount || '';
  document.getElementById('field-method').value = r.method || '';
  document.getElementById('field-type').value = r.type || 'expense';
  document.getElementById('field-customer').value = r.customer_supplier || '';
  document.getElementById('field-product').value = r.product || '';
  document.getElementById('field-mobile').value = r.mobile_no || '';
  document.getElementById('field-invoice').value = (r.invoice_no || '').replace(/^INV-/i, '');

  openModal(txnModal);
}

// Save
async function saveTransaction() {
  const dateVal = document.getElementById('field-date').value;
  const timeVal = document.getElementById('field-time').value || "00:00";
  let createdAtPayload = null;
  if (dateVal) {
    const [year, month, day] = dateVal.split('-').map(Number);
    const [hours, minutes] = timeVal.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hours, minutes);
    createdAtPayload = localDate.toISOString();
  }

  const payload = {
    category: document.getElementById('field-category').value.trim(),
    amount: parseFloat(document.getElementById('field-amount').value),
    method: document.getElementById('field-method').value,
    type: document.getElementById('field-type').value,
    customer_supplier: document.getElementById('field-customer').value.trim(),
    product: document.getElementById('field-product').value.trim(),
    mobile_no: document.getElementById('field-mobile').value.trim(),
    invoice_no: document.getElementById('field-invoice').value.trim()
      ? 'INV-' + document.getElementById('field-invoice').value.trim()
      : '',
    created_at: createdAtPayload
  };

  if (!payload.category || !createdAtPayload || isNaN(payload.amount)) {
    showToast('Please select a Category and fill in Date and Amount.', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  let error;
  if (editingId) {
    ({ error } = await db.from(TABLE_NAME).update(payload).eq('id', editingId));
  } else {
    ({ error } = await db.from(TABLE_NAME).insert([payload]));
  }

  saveBtn.disabled = false;
  saveBtn.textContent = 'Save';

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  closeModal(txnModal);
  showToast(editingId ? 'Transaction updated!' : 'Transaction added!', 'success');
  loadData();
}

// ── DELETE ──
function openDelete(id) {
  deletingId = id;
  openModal(deleteModal);
}

async function confirmDelete() {
  if (!deletingId) return;
  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting…';

  const { error } = await db.from(TABLE_NAME).delete().eq('id', deletingId);

  confirmDeleteBtn.disabled = false;
  confirmDeleteBtn.textContent = 'Delete';

  if (error) {
    showToast('Error: ' + error.message, 'error');
    return;
  }

  closeModal(deleteModal);
  showToast('Transaction deleted.', 'success');
  deletingId = null;
  loadData();
}

// Modal helpers
function openModal(modal) { modal.classList.add('open'); }
function closeModal(modal) { modal.classList.remove('open'); }

// Setup events
function setupEvents() {
  addBtn.addEventListener('click', openAdd);
  saveBtn.addEventListener('click', saveTransaction);
  cancelBtn.addEventListener('click', () => closeModal(txnModal));
  closeModalBtn.addEventListener('click', () => closeModal(txnModal));
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  cancelDeleteBtn.addEventListener('click', () => closeModal(deleteModal));

  // Close modal on overlay click
  txnModal.addEventListener('click', e => { if (e.target === txnModal) closeModal(txnModal); });
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeModal(deleteModal); });

  // Live search (table search)
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      if (topSearchInput) topSearchInput.value = e.target.value;
      applySearch();
    });
  }

  // Top bar search
  if (topSearchInput) {
    topSearchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      if (searchInput) searchInput.value = e.target.value;
      applySearch();
    });
  }

  // Press Enter in any form field to save
  txnForm.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveTransaction();
    }
  });
}

// Utils
function setLoading(state) {
  if (state) {
    tbody.innerHTML = `<tr class="loading-row"><td colspan="10">Loading transactions…</td></tr>`;
  }
}

function formatCurrency(n) {
  const formatted = Number(Math.abs(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? '-' : '') + 'Rs,' + formatted;
}

function formatCurrencyHTML(n) {
  const isNegative = n < 0;
  const formatted = Number(Math.abs(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `<span class="amount-currency">${isNegative ? '-' : ''}Rs,</span> <span class="amount-value">${formatted}</span>`;
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
