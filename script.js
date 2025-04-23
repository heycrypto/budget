// python3 -m http.server
console.log("Script loaded!");

// --- DOM Element References (Declare with let, assign in initializeApp) ---
let dashboardSection;
let transactionsSection;
let balancesList;
let rtaValueElement;
let budgetViewRtaValueElement;
let transactionsTbody;
let currentYearSpan;
let summaryMonthElement;
let summaryIncomeElement;
let summarySpendingElement;
let filterSearchInput;
let filterAccountSelect;
let filterCategorySelect;
let filterStartDateInput;
let filterEndDateInput;
let resetFiltersButton;
let noResultsMessage;
let db; // Variable to hold the database instance

let addExpenseFormSection;
let newTxForm;
let txTypeSelect;
let txDateInput;
let txAccountSelect;
let payeeGroup;
let payeeLabel;
let txPayeeInput;
let txTransferToAccountSelect;
let categoryGroup;
let txCategorySelect;
let txAmountInput;
let txMemoInput;
let addTxStatusDiv;

let syncSection;
let syncStandaloneContent;

// --- Import/Export Elements ---
let exportStandaloneButton;
let exportStandaloneStatusDiv;
let importStandaloneFileInput;
let importStandaloneButton;
let importStandaloneStatusDiv;
let statusMessageDiv;

let localBudgetData = null; // Store data loaded/managed in the app

let budgetViewSection;
let budgetViewMonthSpan;
let budgetTbody;
let totalBudgetedValueTd;
let totalSpentValueTd;
let totalAvailableValueTd;
let budgetNoDataMsg;

let chartsSection;
let spendingChartCanvas;
let chartMonthDisplaySpan;
let chartNoDataMsg;
let spendingPieChartInstance = null; // To destroy previous chart before rendering new one

// NEW Chart Refs
let showPieChartBtn;
let showBarChartBtn;
let spendingPieChartArea;
let incomeExpenseBarChartArea; // <<< The problematic one!
let incomeExpenseBarChartCanvas;
let trendChartNoDataMsg;
let incomeExpenseBarChartInstance = null; // Instance for the new bar chart


let menuToggleButton;
let menuCloseButton;
let sideMenu;
let overlay;
let navLinks; // Will be assigned via querySelectorAll
let mainSections; // Will be assigned via querySelectorAll

// --- Manage Accounts Elements ---
let manageAccountsSection;
let manageAccountsContent; // Wrapper div
let addAccountForm;
let newAccountNameInput;
let newAccountTypeSelect;
let newAccountBalanceInput;
let addAccountStatusDiv;
let existingAccountsList;

// --- Manage Categories Elements ---
let manageCategoriesSection;
let manageCategoriesContent;
let addCategoryForm;
let newCategoryNameInput;
let newCategoryGroupSelect;
let addCategoryStatusDiv;
let existingCategoriesListDiv; // The div containing the list

// --- Date Navigation Buttons ---
let budgetPrevMonthBtn;
let budgetNextMonthBtn;
let chartPrevMonthBtn;
let chartNextMonthBtn;

// --- Yearly Summary Elements ---
let yearlySummarySection;
let yearlySummaryYearSpan;
let yearlySummaryTbody;
let yearlySummaryTfoot;
let yearlySummaryNoDataMsg;
let yearlyPrevYearBtn;
let yearlyNextYearBtn;

// --- Define Constants ---
const DB_NAME = 'budgetAppDB';
const DB_VERSION = 2; // 
const TX_STORE_NAME = 'transactions';
const ACCOUNT_STORE_NAME = 'accounts';
const CATEGORY_STORE_NAME = 'categories';
const GROUP_STORE_NAME = 'categoryGroups';
const BUDGET_PERIOD_STORE_NAME = 'budgetPeriods';
const METADATA_STORE_NAME = 'metadata'; // For RTA, etc.

const INCOME_GROUP_NAME = "Income";
const UNKNOWN_INCOME_SOURCE = "Unknown Income Source";
const UNCATEGORIZED = "Uncategorized";
const SAVINGS_GROUP_NAME = "Savings Goals";
const ARCHIVED_GROUP_NAME = "Archived";

// --- Global Variables ---
let currentBudgetMonth = null; // Stores "YYYY-MM" for the budget view
let currentChartMonth = null;  // Stores "YYYY-MM" for the chart view
let earliestDataMonth = null; // Stores "YYYY-MM" of the first transaction
let latestDataMonth = null;   // Stores "YYYY-MM" of the last transaction (or current month)
let activeBudgetInput = null;
let currentYearlySummaryYear = null; // Stores integer year (e.g., 2024)
let earliestDataYear = null; // Stores earliest year from data
let latestDataYear = null; // Stores latest year from data
let activeChartType = 'pie'; // 'pie' or 'bar' - Track currently selected chart

/**
 * Initializes the IndexedDB database.
 */
function initDB() {
    return new Promise((resolve, reject) => {
        console.log("Initializing IndexedDB...");
        if (db) {
            console.log("DB already initialized.");
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.error);
            reject("Error opening IndexedDB.");
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("IndexedDB initialized successfully:", db);
            db.onerror = (event) => {
                console.error("Database error:", event.target.error);
            };
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            console.log("IndexedDB upgrade needed...");
            let tempDb = event.target.result;
            const transaction = event.target.transaction;

            if (!tempDb.objectStoreNames.contains(TX_STORE_NAME)) {
                 console.log(`Creating object store: ${TX_STORE_NAME}`);
                 const store = tempDb.createObjectStore(TX_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                 store.createIndex('dateIndex', 'date', { unique: false });
                 store.createIndex('categoryIndex', 'category', { unique: false });
                 store.createIndex('accountIndex', 'account', { unique: false });
                 console.log("Created main transaction store.");
            }
            if (!tempDb.objectStoreNames.contains(ACCOUNT_STORE_NAME)) {
                console.log(`Creating object store: ${ACCOUNT_STORE_NAME}`);
                tempDb.createObjectStore(ACCOUNT_STORE_NAME, { keyPath: 'name' });
                 console.log("Created account store.");
            }
             if (!tempDb.objectStoreNames.contains(CATEGORY_STORE_NAME)) {
                console.log(`Creating object store: ${CATEGORY_STORE_NAME}`);
                tempDb.createObjectStore(CATEGORY_STORE_NAME, { keyPath: 'name' });
                 console.log("Created category store.");
            }
            if (!tempDb.objectStoreNames.contains(GROUP_STORE_NAME)) {
                console.log(`Creating object store: ${GROUP_STORE_NAME}`);
                 tempDb.createObjectStore(GROUP_STORE_NAME, { keyPath: 'categoryName' });
                 console.log("Created category group store.");
            }
            if (!tempDb.objectStoreNames.contains(BUDGET_PERIOD_STORE_NAME)) {
                console.log(`Creating object store: ${BUDGET_PERIOD_STORE_NAME}`);
                 tempDb.createObjectStore(BUDGET_PERIOD_STORE_NAME, { keyPath: 'period' });
                 console.log("Created budget period store.");
            }
             if (!tempDb.objectStoreNames.contains(METADATA_STORE_NAME)) {
                console.log(`Creating object store: ${METADATA_STORE_NAME}`);
                tempDb.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' });
                 console.log("Created metadata store.");
            }

            transaction.oncomplete = () => {
                console.log("IndexedDB upgrade transaction complete.");
            };
             transaction.onerror = (event) => {
                 console.error("IndexedDB upgrade transaction error:", event.target.error);
             };
             console.log("IndexedDB upgrade handler finished.");
        };
    });
}

// --- Application Initialization ---
async function initializeApp() {
    console.log("Initializing application...");
    await initDB().catch(error => { // Initialize DB first
        console.error("FATAL: Failed to initialize IndexedDB:", error);
        // Attempt to update status, might fail if statusMessageDiv isn't assigned yet
         try { updateStatus("Critical Error: Offline storage unavailable. App cannot function correctly.", "error"); } catch(e){}
        return; // Stop further initialization
    });

    // <<< --- ASSIGN DOM ELEMENTS HERE --- >>>
    dashboardSection = document.getElementById('dashboard-summary');
    transactionsSection = document.getElementById('transactions-list');
    balancesList = document.getElementById('balances-list');
    rtaValueElement = document.getElementById('rta-value');
    budgetViewRtaValueElement = document.getElementById('budget-view-rta-value');
    transactionsTbody = document.getElementById('transactions-tbody');
    currentYearSpan = document.getElementById('current-year');
    summaryMonthElement = document.getElementById('summary-month');
    summaryIncomeElement = document.getElementById('summary-income');
    summarySpendingElement = document.getElementById('summary-spending');
    filterSearchInput = document.getElementById('filter-search');
    filterAccountSelect = document.getElementById('filter-account');
    filterCategorySelect = document.getElementById('filter-category');
    filterStartDateInput = document.getElementById('filter-start-date');
    filterEndDateInput = document.getElementById('filter-end-date');
    resetFiltersButton = document.getElementById('reset-filters');
    noResultsMessage = document.getElementById('no-results-message');

    addExpenseFormSection = document.getElementById('add-expense-form');
    newTxForm = document.getElementById('new-tx-form');
    txTypeSelect = document.getElementById('tx-type');
    txDateInput = document.getElementById('tx-date');
    txAccountSelect = document.getElementById('tx-account');
    payeeGroup = document.getElementById('payee-group');
    payeeLabel = document.getElementById('payee-label');
    txPayeeInput = document.getElementById('tx-payee');
    txTransferToAccountSelect = document.getElementById('tx-transfer-to-account');
    categoryGroup = document.getElementById('category-group');
    txCategorySelect = document.getElementById('tx-category');
    txAmountInput = document.getElementById('tx-amount');
    txMemoInput = document.getElementById('tx-memo');
    addTxStatusDiv = document.getElementById('add-tx-status');

    syncSection = document.getElementById('sync-section');
    syncStandaloneContent = document.getElementById('sync-standalone-content');
    exportStandaloneButton = document.getElementById('export-standalone-button');
    exportStandaloneStatusDiv = document.getElementById('export-standalone-status');
    importStandaloneFileInput = document.getElementById('import-standalone-file');
    importStandaloneButton = document.getElementById('import-standalone-button');
    importStandaloneStatusDiv = document.getElementById('import-standalone-status');
    statusMessageDiv = document.getElementById('status-message'); // Assign the main status div

    budgetViewSection = document.getElementById('budget-view');
    budgetViewMonthSpan = document.getElementById('budget-view-month');
    budgetTbody = document.getElementById('budget-tbody');
    totalBudgetedValueTd = document.getElementById('total-budgeted-value');
    totalSpentValueTd = document.getElementById('total-spent-value');
    totalAvailableValueTd = document.getElementById('total-available-value');
    budgetNoDataMsg = document.getElementById('budget-no-data');

    chartsSection = document.getElementById('charts-section');
    spendingChartCanvas = document.getElementById('spendingPieChart');
    chartMonthDisplaySpan = document.getElementById('chart-month-display');
    chartNoDataMsg = document.getElementById('chart-no-data');

    // Chart Refs Assignment
    showPieChartBtn = document.getElementById('show-pie-chart-btn');
    showBarChartBtn = document.getElementById('show-bar-chart-btn');
    spendingPieChartArea = document.getElementById('spending-pie-chart-area');
    incomeExpenseBarChartArea = document.getElementById('income-expense-bar-chart-area'); // Assigned here!
    incomeExpenseBarChartCanvas = document.getElementById('incomeExpenseBarChart');
    trendChartNoDataMsg = document.getElementById('trend-chart-no-data');

    menuToggleButton = document.getElementById('menu-toggle');
    menuCloseButton = document.getElementById('menu-close');
    sideMenu = document.getElementById('side-menu');
    overlay = document.getElementById('overlay');
    navLinks = document.querySelectorAll('.nav-link'); // querySelectorAll is fine here
    mainSections = document.querySelectorAll('.main-section'); // querySelectorAll is fine here

    manageAccountsSection = document.getElementById('manage-accounts-section');
    manageAccountsContent = document.getElementById('manage-accounts-content');
    addAccountForm = document.getElementById('add-account-form');
    newAccountNameInput = document.getElementById('new-account-name');
    newAccountTypeSelect = document.getElementById('new-account-type');
    newAccountBalanceInput = document.getElementById('new-account-balance');
    addAccountStatusDiv = document.getElementById('add-account-status');
    existingAccountsList = document.getElementById('existing-accounts-list');

    manageCategoriesSection = document.getElementById('manage-categories-section');
    manageCategoriesContent = document.getElementById('manage-categories-content');
    addCategoryForm = document.getElementById('add-category-form');
    newCategoryNameInput = document.getElementById('new-category-name');
    newCategoryGroupSelect = document.getElementById('new-category-group');
    addCategoryStatusDiv = document.getElementById('add-category-status');
    existingCategoriesListDiv = document.getElementById('existing-categories-list');

    budgetPrevMonthBtn = document.getElementById('budget-prev-month');
    budgetNextMonthBtn = document.getElementById('budget-next-month');
    chartPrevMonthBtn = document.getElementById('chart-prev-month');
    chartNextMonthBtn = document.getElementById('chart-next-month');

    yearlySummarySection = document.getElementById('yearly-summary-section');
    yearlySummaryYearSpan = document.getElementById('yearly-summary-year');
    yearlySummaryTbody = document.getElementById('yearly-summary-tbody');
    yearlySummaryTfoot = document.getElementById('yearly-summary-tfoot');
    yearlySummaryNoDataMsg = document.getElementById('yearly-summary-no-data');
    yearlyPrevYearBtn = document.getElementById('yearly-prev-year');
    yearlyNextYearBtn = document.getElementById('yearly-next-year');
    // <<< --- END OF DOM ELEMENT ASSIGNMENTS --- >>>


    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    setupMenuListeners();
    setupNavLinks();
    setupFilterListeners();
    setupAddFormListeners();
    setupSyncButtonListeners();
    setupStandaloneEventListeners();
    setupNavButtonListeners();
    setupBudgetEditingListener();
    setupYearlyNavButtonListeners();
    setupChartToggleButtons(); // Setup listeners AFTER elements are assigned

    await loadDataFromDB();

    // Default to dashboard after load
    showSection('dashboard-summary'); // Use helper to show initial section

    if(txTypeSelect) updateAddFormForTxType(txTypeSelect.value);

    console.log("Application initialization complete.");
}


// --- Setup Chart Toggle Button Listeners ---
function setupChartToggleButtons() {
    if (showPieChartBtn) {
        showPieChartBtn.addEventListener('click', () => switchChartView('pie'));
    }
    if (showBarChartBtn) {
        showBarChartBtn.addEventListener('click', () => switchChartView('bar'));
    }
}
// --- Function to switch between chart views ---
function switchChartView(chartType) {
    if (activeChartType === chartType) return; // No change needed

    activeChartType = chartType;

    const isPieActive = chartType === 'pie';

    // Toggle button active states
    showPieChartBtn?.classList.toggle('active-chart-button', isPieActive);
    showBarChartBtn?.classList.toggle('active-chart-button', !isPieActive);

    // Toggle chart area visibility
    spendingPieChartArea?.classList.toggle('hidden', !isPieActive);
    incomeExpenseBarChartArea?.classList.toggle('hidden', isPieActive);

    // Optional: Re-render or ensure data is fresh for the activated chart
    // Since data is calculated when navigating to the section, just switching visibility might be enough.
    // If data could become stale, you might call updateChartView() or updateTrendChartView() here.
    console.log(`Switched chart view to: ${chartType}`);

    // Ensure the correct chart is rendered if it wasn't already
    if (isPieActive) {
         if (currentChartMonth) updateChartView(currentChartMonth);
    } else {
         updateTrendChartView(); // Recalculate/render trend chart
    }
}


// --- Setup Budget Editing Listener ---
function setupBudgetEditingListener() {
    if (budgetTbody) {
        // Keep the listener attachment logic
        budgetTbody.addEventListener('click', handleBudgetCellClick);
        console.log("Budget editing listener attached.");
    } else {
        console.warn("Could not attach budget editing listener: budgetTbody not found.");
    }
}

function setupStandaloneEventListeners() {
    if (addAccountForm) {
        addAccountForm.addEventListener('submit', handleAddAccount);
         // Re-enable form elements if they were disabled by companion mode logic on a previous load
         addAccountForm.style.opacity = '1';
         const inputs = addAccountForm.querySelectorAll('input, select, button');
         inputs.forEach(el => el.disabled = false);
    }
    if (addCategoryForm) { // Add listener for category form
        addCategoryForm.addEventListener('submit', handleAddCategory);
         // Re-enable category form if needed
        addCategoryForm.style.opacity = '1';
        addCategoryForm.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
    }
    // --- Import Listeners ---
    if (importStandaloneFileInput) {
        importStandaloneFileInput.addEventListener('change', () => {
            // Enable import button only if a file is selected
            if (importStandaloneButton) {
                 importStandaloneButton.disabled = !importStandaloneFileInput.files || importStandaloneFileInput.files.length === 0;
            }
            if(importStandaloneStatusDiv) importStandaloneStatusDiv.textContent = ''; // Clear status on new file select
        });
    }
    if (importStandaloneButton) {
        importStandaloneButton.addEventListener('click', handleStandaloneImport);
    }
}

// --- Setup Listeners for Date Navigation Buttons ---
function setupNavButtonListeners() {
    if (budgetPrevMonthBtn) budgetPrevMonthBtn.addEventListener('click', handleBudgetNav);
    if (budgetNextMonthBtn) budgetNextMonthBtn.addEventListener('click', handleBudgetNav);
    if (chartPrevMonthBtn) chartPrevMonthBtn.addEventListener('click', handleChartNav);
    if (chartNextMonthBtn) chartNextMonthBtn.addEventListener('click', handleChartNav);
}

// --- Event Handlers for Date Navigation ---
function handleBudgetNav(event) {
    const direction = event.target.id.includes('prev') ? 'prev' : 'next';
    const current = currentBudgetMonth;
    if (!current) return; // Cannot navigate if no month is set

    const targetMonth = (direction === 'prev')
        ? getPreviousPeriodJS(current)
        : getNextPeriodJS(current);

    if (targetMonth) {
        updateBudgetView(targetMonth);
    } else {
        console.warn(`Could not calculate ${direction} month from ${current}`);
    }
}

function handleChartNav(event) {
    const direction = event.target.id.includes('prev') ? 'prev' : 'next';
    const current = currentChartMonth;
    if (!current) return;

    const targetMonth = (direction === 'prev')
        ? getPreviousPeriodJS(current)
        : getNextPeriodJS(current);

    if (targetMonth) {
        updateChartView(targetMonth);
    } else {
        console.warn(`Could not calculate ${direction} month from ${current}`);
    }
}

// --- Event Handlers for Year Navigation ---
function handleYearlySummaryNav(event) {
    const direction = event.target.id.includes('prev') ? 'prev' : 'next';
    const current = currentYearlySummaryYear;
    if (!current) return; // Cannot navigate if no year is set

    const targetYear = (direction === 'prev') ? current - 1 : current + 1;

    updateYearlySummaryView(targetYear);
}

// --- Event Listener Setup Functions --- (Grouped for clarity)

function setupMenuListeners() {
    if (menuToggleButton) menuToggleButton.addEventListener('click', () => toggleMenu());
    if (menuCloseButton) menuCloseButton.addEventListener('click', () => toggleMenu(true));
    if (overlay) overlay.addEventListener('click', () => toggleMenu(true));
}

function setupNavLinks() {
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
}

function setupFilterListeners() {
    if (filterSearchInput) filterSearchInput.addEventListener('input', filterTransactions);
    if (filterAccountSelect) filterAccountSelect.addEventListener('change', filterTransactions);
    if (filterCategorySelect) filterCategorySelect.addEventListener('change', filterTransactions);
    if (filterStartDateInput) filterStartDateInput.addEventListener('input', filterTransactions);
    if (filterEndDateInput) filterEndDateInput.addEventListener('input', filterTransactions);
    if (resetFiltersButton) resetFiltersButton.addEventListener('click', resetAllFilters);
}

function setupAddFormListeners() {
    if (newTxForm) newTxForm.addEventListener('submit', handleAddTransaction);
    if (txDateInput) txDateInput.valueAsDate = new Date(); // Default date

     // --- Listener for TYPE change ---
     if (txTypeSelect) {
        txTypeSelect.addEventListener('change', (event) => {
            updateAddFormForTxType(event.target.value); // Call the main update function
        });
        // Set initial form state based on default type
        updateAddFormForTxType(txTypeSelect.value);
    }

    // --- Listener for FROM ACCOUNT change (to update TO ACCOUNT dropdown) ---
    if (txAccountSelect) {
        txAccountSelect.addEventListener('change', () => {
            // If the type is currently 'transfer', update the 'To' dropdown
            if (txTypeSelect && txTypeSelect.value === 'transfer') {
                populateTransferToAccountDropdown();
            }
        });
    }
}

function setupSyncButtonListeners() {
    if (exportStandaloneButton) exportStandaloneButton.addEventListener('click', handleExportStandaloneData); 
}

function setupYearlyNavButtonListeners() {
    if (yearlyPrevYearBtn) yearlyPrevYearBtn.addEventListener('click', handleYearlySummaryNav);
    if (yearlyNextYearBtn) yearlyNextYearBtn.addEventListener('click', handleYearlySummaryNav);
}

// --- Menu Toggle Functionality ---
function toggleMenu(forceClose = false) {
    if (!sideMenu || !overlay) return;
    const isOpen = sideMenu.classList.contains('open');
    if (forceClose || isOpen) {
        sideMenu.classList.remove('open');
        overlay.classList.remove('visible');
    } else {
        sideMenu.classList.add('open');
        overlay.classList.add('visible');
    }
}

// --- Navigation Link Click Handler ---
function handleNavLinkClick(event) {
    event.preventDefault();
    const sectionId = event.currentTarget.dataset.section;

    // Deactivate all links
    navLinks.forEach(nav => {
        nav.classList.remove('active-link');
        nav.removeAttribute('aria-current');
    });

    // Activate clicked link
    event.currentTarget.classList.add('active-link');
    event.currentTarget.setAttribute('aria-current', 'page');

    // Hide all sections
    mainSections.forEach(section => section.classList.add('hidden'));

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        console.log(`Navigating to section: #${sectionId}`);

    } else {
        console.warn(`Target section not found: #${sectionId}`);
        // Fallback to dashboard
        const fallbackSection = document.getElementById('dashboard-summary');
        if (fallbackSection) {
            fallbackSection.classList.remove('hidden');
            setActiveNavLink('dashboard-summary'); // Activate dashboard link
        }
        // Remove active state from the link that failed
         event.currentTarget.classList.remove('active-link');
         event.currentTarget.removeAttribute('aria-current');
    }

    toggleMenu(true); // Close menu
}
function showSection(sectionId) {
    // Deactivate all links
    navLinks.forEach(nav => {
       nav.classList.remove('active-link');
       nav.removeAttribute('aria-current');
   });

   // Hide all sections
   mainSections.forEach(section => section.classList.add('hidden'));

   // Show target section
   const targetSection = document.getElementById(sectionId);
   if (targetSection) {
       targetSection.classList.remove('hidden');
       setActiveNavLink(sectionId); // Activate the corresponding link
       console.log(`Navigating to section: #${sectionId}`);

       // --- Special actions when navigating TO a section ---
       if (sectionId === 'charts-section') {
           // Ensure default chart view is set when entering the section
           switchChartView('pie'); // Default to pie chart view

           // Ensure both charts have data calculated when the section loads
           const monthToUse = currentChartMonth || findLatestMonth(localBudgetData?.transactions) || getCurrentRealMonth();
           updateChartView(monthToUse); // Update pie chart for latest/current month
           updateTrendChartView(); // Update the trend chart
       } else if (sectionId === 'budget-view') {
           const monthToUse = currentBudgetMonth || findLatestMonth(localBudgetData?.transactions) || getCurrentRealMonth();
           updateBudgetView(monthToUse);
       } else if (sectionId === 'yearly-summary-section') {
           const yearToUse = currentYearlySummaryYear || findLatestYear(localBudgetData?.transactions) || getCurrentRealYear();
           updateYearlySummaryView(yearToUse);
       }
       // Add other section-specific initializations if needed

   } else {
       console.warn(`Target section not found: #${sectionId}`);
       // Fallback to dashboard
       const fallbackSection = document.getElementById('dashboard-summary');
       if (fallbackSection) {
           fallbackSection.classList.remove('hidden');
           setActiveNavLink('dashboard-summary'); // Activate dashboard link
       }
   }
}

/** Utility to activate a specific nav link by its data-section ID */
function setActiveNavLink(sectionId) {
    navLinks.forEach(nav => {
        const isActive = nav.dataset.section === sectionId;
        nav.classList.toggle('active-link', isActive);
        if (isActive) {
            nav.setAttribute('aria-current', 'page');
        } else {
            nav.removeAttribute('aria-current');
        }
    });
}

// --- Core Functions ---

/**
 * Displays existing accounts in the Manage Accounts section list.
 * @param {object} accounts The accounts object { accountName: balance }.
 */
function displayExistingAccounts(accounts) {
    if (!existingAccountsList) return;
    existingAccountsList.innerHTML = ''; // Clear placeholder/previous list

    const accountNames = Object.keys(accounts || {}).sort();

    if (accountNames.length === 0) {
        existingAccountsList.innerHTML = '<li>No accounts added yet.</li>';
        return;
    }

    accountNames.forEach(name => {
        const balance = accounts[name];
        const li = document.createElement('li');
        // Display Name and Balance (similar to dashboard)
        const nameSpan = document.createElement('span'); nameSpan.textContent = `${name}: `;
        const balanceSpan = document.createElement('span');
        balanceSpan.textContent = formatCurrency(balance);
        balanceSpan.className = `currency ${getCurrencyClass(balance, true)}`; // Show color
        li.appendChild(nameSpan);
        li.appendChild(balanceSpan);
        existingAccountsList.appendChild(li);
    });
}

/**
 * Populates the 'Category Group' dropdown in the Add Category form.
 * @param {object} groupsData The category groups object { categoryName: groupName }.
 * @param {Array<string>} categories List of all categories.
 */
function populateCategoryGroupDropdown(groupsData = {}, categories = []) {
    if (!newCategoryGroupSelect) return;
    newCategoryGroupSelect.innerHTML = ''; // Clear existing options

    const uniqueGroups = new Set();
    // Add groups associated with existing categories
    categories.forEach(cat => {
        if (groupsData[cat]) {
            uniqueGroups.add(groupsData[cat]);
        }
    });
     // Add common default groups if they aren't already present
     ['Income', 'Expenses', 'Bills', 'Savings Goals', 'Archived'].forEach(g => uniqueGroups.add(g));
     // Special internal/unwanted groups (remove if accidentally added)
     uniqueGroups.delete(UNKNOWN_INCOME_SOURCE);
     uniqueGroups.delete(null); // Remove null/undefined if present
     uniqueGroups.delete(undefined);


    const sortedGroups = Array.from(uniqueGroups).sort();

    // Add the default "Select Group" option
    newCategoryGroupSelect.add(new Option('-- Select Group --', ''));

    // Add each unique group
    sortedGroups.forEach(groupName => {
        if (groupName) { // Ensure group name is not empty
            newCategoryGroupSelect.add(new Option(groupName, groupName));
        }
    });

    // Optionally add "Create New..." later
    // newCategoryGroupSelect.add(new Option('Create New Group...', 'CREATE_NEW'));
}

/**
 * Displays existing categories, grouped visually, with controls to change groups.
 * @param {Array<string>} categories List of category names.
 * @param {object} groupsData The category groups object { categoryName: groupName }.
 */
function displayExistingCategories(categories = [], groupsData = {}) {
    if (!existingCategoriesListDiv) return;
    existingCategoriesListDiv.innerHTML = ''; // Clear placeholder/previous list

    if (!categories || categories.length === 0) {
        existingCategoriesListDiv.innerHTML = '<p>No categories added yet.</p>';
        return;
    }

    // --- Get list of available group names (for the dropdowns) ---
    const availableGroups = new Set();
    Object.values(groupsData).forEach(group => { if(group) availableGroups.add(group); });
     // Add common default groups if they aren't already present from data
     ['Income', 'Expenses', 'Bills', 'Savings Goals', 'Archived'].forEach(g => availableGroups.add(g));
     availableGroups.delete(null); // Remove null/undefined if present
     availableGroups.delete(undefined);
    const sortedAvailableGroups = Array.from(availableGroups).sort();
    // --- --- ---

    const categoriesByGroup = {};
    categories.forEach(cat => {
        const group = groupsData[cat] || 'Unassigned';
        if (!categoriesByGroup[group]) {
            categoriesByGroup[group] = [];
        }
        categoriesByGroup[group].push(cat);
    });

    const sortedGroupNames = Object.keys(categoriesByGroup).sort((a, b) => { /* ... keep existing sort logic ... */
        if (a === 'Unassigned') return 1; if (b === 'Unassigned') return -1;
        const order = { "Savings Goals": 1, "Archived": 2 };
        const orderA = order[a] || 0; const orderB = order[b] || 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
    });

    // Create HTML for each group
    sortedGroupNames.forEach(groupName => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group-block';

        const groupHeading = document.createElement('h4');
        groupHeading.textContent = groupName;
        groupDiv.appendChild(groupHeading);

        const categoryList = document.createElement('ul');
        categoriesByGroup[groupName].sort().forEach(catName => { // Sort categories within group
            const listItem = document.createElement('li');
            listItem.classList.add('category-list-item'); // Add class for styling/selection

            // 1. Category Name Span
            const nameSpan = document.createElement('span');
            nameSpan.textContent = catName;
            nameSpan.className = 'category-name';
            listItem.appendChild(nameSpan);

            // 2. Group Selection Dropdown
            const groupSelect = document.createElement('select');
            groupSelect.className = 'category-group-changer';
            groupSelect.dataset.categoryName = catName; // Store category name for the handler

            // Add options to the dropdown
            sortedAvailableGroups.forEach(availGroup => {
                const option = new Option(availGroup, availGroup);
                if (availGroup === (groupsData[catName] || '')) { // Select the current group
                    option.selected = true;
                }
                groupSelect.add(option);
            });
             // Add "Unassigned" option if it wasn't in the main list
             if (!sortedAvailableGroups.includes('Unassigned')) {
                 const unassignedOption = new Option('Unassigned', ''); // Use empty value for Unassigned
                 if (groupName === 'Unassigned') {
                     unassignedOption.selected = true;
                 }
                 groupSelect.add(unassignedOption);
             }

            listItem.appendChild(groupSelect);

            // 3. Change Button
            const changeButton = document.createElement('button');
            changeButton.textContent = 'Update';
            changeButton.className = 'button button-small category-group-update-button';
            changeButton.dataset.categoryName = catName; // Store category name
            changeButton.addEventListener('click', handleChangeCategoryGroup); // Attach listener directly
            listItem.appendChild(changeButton);

            // 4. Status Div (Optional, for feedback per item)
            const itemStatusDiv = document.createElement('div');
            itemStatusDiv.className = 'item-status';
            itemStatusDiv.id = `status-cat-${catName.replace(/\s+/g, '-')}`; // Unique ID for status
            listItem.appendChild(itemStatusDiv);


            categoryList.appendChild(listItem);
        });
        groupDiv.appendChild(categoryList);

        existingCategoriesListDiv.appendChild(groupDiv);
    });
}

/**
 * Handles the click event for the "Update" button next to an existing category.
 * @param {Event} event The button click event.
 */
async function handleChangeCategoryGroup(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const categoryName = button.dataset.categoryName;
    const listItem = button.closest('.category-list-item');
    const groupSelect = listItem?.querySelector('.category-group-changer');
    const itemStatusDiv = listItem?.querySelector('.item-status');

    if (!categoryName || !groupSelect || !itemStatusDiv) {
        console.error("Could not find necessary elements for group change.");
        return;
    }

    const newGroupName = groupSelect.value;

    // Log the values being processed
    console.log(`Attempting to change group for "${categoryName}" to "${newGroupName}"`);

    updateStatusMessage(itemStatusDiv, "Updating...", "info");
    button.disabled = true;
    groupSelect.disabled = true; // Disable dropdown during update

    try {
        await updateCategoryGroup(categoryName, newGroupName); // Call DB function

        updateStatusMessage(itemStatusDiv, "Group updated!", "success");

        console.log("Category group updated in DB, reloading data to refresh UI...");
        await loadDataFromDB(); 

        if (localBudgetData && localBudgetData.category_groups) {
             if (newGroupName === '') { // Handle "Unassigned" case
                 delete localBudgetData.category_groups[categoryName];
             } else {
                 localBudgetData.category_groups[categoryName] = newGroupName;
             }
             console.log("In-memory category group data updated.");
        }

    } catch (error) {
        console.error(`Failed to update group for ${categoryName}:`, error);
        updateStatusMessage(itemStatusDiv, `Error: ${error}`, "error");
        // Re-enable controls on error
        button.disabled = false;
        groupSelect.disabled = false;
    } finally {
    }
}

/**
 * Updates the group assignment for an existing category in IndexedDB.
 * Uses 'put' which handles both adding and updating.
 * @param {string} categoryName The name of the category to update.
 * @param {string} newGroupName The new group name (empty string means unassigned/remove mapping).
 * @returns {Promise<void>}
 */
function updateCategoryGroup(categoryName, newGroupName) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized.");

        const transaction = db.transaction([GROUP_STORE_NAME], 'readwrite');
        const grpStore = transaction.objectStore(GROUP_STORE_NAME);

        let dbOperation;

        if (newGroupName === '') {
            // If setting to "Unassigned", we DELETE the mapping
            console.log(`Removing group assignment for category: ${categoryName}`);
            dbOperation = grpStore.delete(categoryName); // Use delete with the key
        } else {
            // Otherwise, we ADD or UPDATE the mapping using put
            console.log(`Updating group for category: ${categoryName} to ${newGroupName}`);
            const groupMapping = { categoryName: categoryName, groupName: newGroupName };
            dbOperation = grpStore.put(groupMapping); // Use put for add/update
        }

        dbOperation.onerror = (event) => {
            console.error("Error updating/deleting category group mapping in DB:", event.target.error);
            transaction.abort();
            reject(`Failed to update group assignment: ${event.target.error}`);
        };
        dbOperation.onsuccess = () => {
            console.log(`Group assignment for '${categoryName}' processed successfully.`);
        };

        transaction.oncomplete = () => {
            console.log("Update category group transaction complete.");
            resolve();
        };
        transaction.onerror = (event) => {
            console.error("Update category group transaction failed:", event.target.error);
            reject(`Transaction failed: ${event.target.error}`);
        };
    });
}

/**
 * Handles clicks within the budget table body for inline editing.
 * @param {Event} event The click event object.
 */
function handleBudgetCellClick(event) {
    const targetCell = event.target.closest('td.editable-budget'); // Find the editable TD

    // If clicked outside an editable cell or if already editing elsewhere, do nothing
    if (!targetCell || activeBudgetInput) {
        return;
    }

    const targetRow = targetCell.closest('tr[data-category]');
    if (!targetRow) return; // Should not happen if cell is found

    const categoryName = targetRow.dataset.category;
    const currentPeriod = currentBudgetMonth; // Use the globally tracked month

    if (!categoryName || !currentPeriod) {
        console.error("Missing category name or period for editing.");
        return;
    }

    const originalValueStr = targetCell.textContent;
    const originalValue = parseCurrency(originalValueStr); // Parse the displayed value

    // --- Create and configure the input field ---
    const input = document.createElement('input');
    input.type = 'text';
    input.value = formatCurrency(originalValue);
    input.dataset.originalValueStr = originalValueStr; // Store original formatted string
    input.dataset.categoryName = categoryName; // Store category for easy access
    input.dataset.period = currentPeriod;       // Store period
    input.inputMode = 'decimal'; 
    input.autocomplete = 'off';

    // --- Clear the cell and add the input ---
    targetCell.innerHTML = '';
    targetCell.appendChild(input);
    input.focus();
    input.select(); // Select the text

    activeBudgetInput = input; // Mark this input as active

    // --- Add listeners to the input for saving/canceling ---
    input.addEventListener('blur', handleBudgetInputBlur);
    input.addEventListener('keydown', handleBudgetInputKeydown);
}

/** Handles losing focus on the budget input field (saves). */
function handleBudgetInputBlur(event) {
    saveBudgetValue(event.target);
}

/** Handles key presses within the budget input field (Enter/Escape). */
function handleBudgetInputKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if inside one
        saveBudgetValue(event.target);
    } else if (event.key === 'Escape') {
        cancelBudgetValue(event.target);
    }
}

/**
 * Saves the new budget value from the input field.
 * @param {HTMLInputElement} input The input element being edited.
 */
async function saveBudgetValue(input) {
    if (!input || input !== activeBudgetInput) return; // Ensure it's the active input

    const newValueStr = input.value;
    const categoryName = input.dataset.categoryName;
    const period = input.dataset.period;
    const originalValueStr = input.dataset.originalValueStr; // Retrieve original formatted value

    activeBudgetInput = null; // Deactivate editing state

    let newValue = parseCurrency(newValueStr);

    // Basic validation
    // Basic validation (allow 0 for budget, but not negative)
    // parseCurrency returns 0 for invalid input, so check < 0
    if (newValue < 0) { // *** CHANGED validation logic slightly ***
        console.warn("Invalid budget amount entered (negative or parse failed):", newValueStr);
        // Revert to original value on invalid input
        input.parentElement.textContent = originalValueStr; // Restore original text
        updateStatusMessage(statusMessageDiv, "Budget amount cannot be negative.", "error"); // Inform user
        return;
    }

    const formattedNewValue = formatCurrency(newValue);

    // --- Optimistic UI Update (show new value immediately) ---
    input.parentElement.textContent = formattedNewValue;
    updateBudgetTableTotals();


    // --- Save to Database (async) ---
    try {
        console.log(`Saving budget: Period=${period}, Category=${categoryName}, Amount=${newValue}`);
        await updateBudgetAmountInDB(period, categoryName, newValue);

        // --- Update RTA display and potentially other data ---
        // Best practice: Reload data from DB after save to ensure full consistency
        console.log("Budget amount saved. Reloading data from DB for consistency...");
        await loadDataFromDB(); // This will re-render table, update RTA, etc.

    } catch (error) {
        console.error("Failed to save budget amount:", error);
        // Revert UI change on failure
        input.parentElement.textContent = originalValueStr; // Restore original
        updateBudgetTableTotals(); // Recalculate totals based on reverted value
        updateStatusMessage(statusMessageDiv, `Error saving budget: ${error}`, "error");

    } finally {
        // Cleanup: Ensure input is removed even if save failed but wasn't caught
        if (input.parentElement && input.parentElement.contains(input)) {
            input.remove();
        }
    }
}

/**
 * Cancels the budget edit and restores the original value.
 * @param {HTMLInputElement} input The input element being edited.
 */
function cancelBudgetValue(input) {
    if (!input || input !== activeBudgetInput) return; // Ensure it's the active input

    const originalValueStr = input.dataset.originalValueStr;
    activeBudgetInput = null; // Deactivate editing state

    // Restore original value and remove input
    input.parentElement.textContent = originalValueStr;
    console.log("Budget edit cancelled.");
}

/**
 * Updates a specific category's budgeted amount for a given period in IndexedDB,
 * and adjusts Ready To Assign accordingly.
 * @param {string} period The budget period (YYYY-MM).
 * @param {string} categoryName The name of the category.
 * @param {number} newAmount The new budgeted amount.
 * @returns {Promise<void>}
 */
function updateBudgetAmountInDB(period, categoryName, newAmount) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized.");

        const transaction = db.transaction([BUDGET_PERIOD_STORE_NAME, METADATA_STORE_NAME], 'readwrite');
        const bpStore = transaction.objectStore(BUDGET_PERIOD_STORE_NAME);
        const metaStore = transaction.objectStore(METADATA_STORE_NAME);

        let currentRTA = 0.0;
        let originalBudgetAmount = 0.0;

        // --- Get current RTA ---
        const metaGetReq = metaStore.get('appData');
        metaGetReq.onerror = (event) => reject(`Failed to read metadata: ${event.target.error}`);
        metaGetReq.onsuccess = (event) => {
            currentRTA = event.target.result?.ready_to_assign || 0.0;

            // --- Get current budget period data ---
            const bpGetReq = bpStore.get(period);
            bpGetReq.onerror = (event) => reject(`Failed to read budget period ${period}: ${event.target.error}`);
            bpGetReq.onsuccess = (event) => {
                let budgetPeriodData = event.target.result;

                if (!budgetPeriodData) {
                    budgetPeriodData = { period: period, budget: {} };
                    originalBudgetAmount = 0.0;
                } else {
                    originalBudgetAmount = budgetPeriodData.budget?.[categoryName] || 0.0;
                }

                if (!budgetPeriodData.budget) {
                    budgetPeriodData.budget = {};
                }
                budgetPeriodData.budget[categoryName] = newAmount;

                // --- Save the updated budget period data ---
                const bpPutReq = bpStore.put(budgetPeriodData);
                bpPutReq.onerror = (event) => reject(`Failed to save budget period ${period}: ${event.target.error}`);
                bpPutReq.onsuccess = () => {
                    console.log(`Budget updated for ${categoryName} in ${period} to ${newAmount}`);

                    // --- Calculate change and update RTA ---
                    const delta = newAmount - originalBudgetAmount;
                    const newRTA = currentRTA - delta;

                    // --- Save updated RTA ---
                    const updatedMetadata = { key: 'appData', ready_to_assign: newRTA };
                    const metaPutReq = metaStore.put(updatedMetadata);
                    metaPutReq.onerror = (event) => reject(`Budget saved, but failed to update RTA: ${event.target.error}`);
                    metaPutReq.onsuccess = () => {
                        console.log(`RTA updated successfully to: ${newRTA} (change: ${-delta})`);
                    };
                };
            };
        };

        transaction.oncomplete = () => {
            console.log("Update budget amount transaction complete.");
            resolve();
        };
        transaction.onerror = (event) => {
            console.error("Update budget amount transaction failed:", event.target.error);
            reject(`Transaction failed: ${event.target.error}`);
        };
    });
}

/**
 * Processes budget data and updates the UI.
 * @param {object} data The budget data object from DB.
 */
async function processBudgetData(data) {
    console.log(`Processing budget data...`);
    // --- Reset month state on new data load ---
    currentBudgetMonth = null;
    currentChartMonth = null;
    earliestDataMonth = null;
    latestDataMonth = null;
    earliestDataYear = null; 
    latestDataYear = null;   

    if (!data) {
        console.warn("processBudgetData called with null data.");
        // Display default "no data" state
        clearDataDisplay();
        const defaultPeriod = getCurrentRealMonth();
        const defaultYear = getCurrentRealYear();
        updateBudgetView(defaultPeriod); // Will show 'no data' message
        updateChartView(defaultPeriod);  // Will show 'no data' message for pie
        updateTrendChartView();          // Will show 'no data' message for bar
        updateYearlySummaryView(defaultYear); // Will show 'no data' message
        displayRTA(0);
        displayAccountBalances({});
        displayDashboardSummary({ latestMonth: 'N/A', income: 0, spending: 0 });
        displayTransactions([]); // Pass empty array explicitly
        displayExistingAccounts({});
        populateCategoryGroupDropdown({}, []); // Pass empty data
        displayExistingCategories([], {});
        setupStandaloneEventListeners();
        return;
    }

    // Ensure basic structure exists
    data.accounts = data.accounts || {};
    data.categories = data.categories || [];
    data.transactions = data.transactions || [];
    data.budget_periods = data.budget_periods || {};
    data.category_groups = data.category_groups || {};
    data.ready_to_assign = data.ready_to_assign || 0.0;

    // Store loaded data
    localBudgetData = JSON.parse(JSON.stringify(data));
    let allTransactionsForDisplay = data.transactions || [];

    try {
        // --- Determine date range ---
        earliestDataMonth = findEarliestMonth(allTransactionsForDisplay);
        latestDataMonth = findLatestMonth(allTransactionsForDisplay);
        earliestDataYear = findEarliestYear(allTransactionsForDisplay); 
        latestDataYear = findLatestYear(allTransactionsForDisplay);     
        const initialDisplayMonth = latestDataMonth || getCurrentRealMonth();
        const initialDisplayYear = latestDataYear || getCurrentRealYear();

        // --- Populate Static UI elements ---
        populateAccountFilter(data.accounts, [filterAccountSelect, txAccountSelect]);
        populateCategoryFilter(
            data.categories || [],
            allTransactionsForDisplay,
            [filterCategorySelect, txCategorySelect],
            data.category_groups || {}
            // No mode parameter needed anymore
        );
        displayExistingAccounts(data.accounts);
        // These are standalone features, always run
        populateCategoryGroupDropdown(
            data.category_groups || {},
            data.categories || []
        );
        displayExistingCategories(data.categories, data.category_groups);


        // --- Display Dashboard ---
        let dashboardSummaryMonth = latestDataMonth || 'N/A';
        let monthSummary = { latestMonth: dashboardSummaryMonth, income: 0, spending: 0 };
        if (latestDataMonth) {
            monthSummary = {
                latestMonth: dashboardSummaryMonth,
                ...calculatePeriodSummary(dashboardSummaryMonth, allTransactionsForDisplay)
            };
        }
        displayDashboardSummary(monthSummary);
        displayAccountBalances(data.accounts);
        displayRTA(data.ready_to_assign);

        // --- Display Transactions List (shows all transactions from DB) ---
        displayTransactions(allTransactionsForDisplay); // Only pass the single list
        resetAllFilters();

        // --- Update Views for Initial Period ---
        updateBudgetView(initialDisplayMonth);
        updateChartView(initialDisplayMonth); // Handles Pie Chart
        updateTrendChartView();              // Handles Bar Chart Trend
        updateYearlySummaryView(initialDisplayYear);

    } catch (uiError) {
        console.error("Error updating UI:", uiError);
        updateStatus(`Error displaying data: ${uiError.message}`, "error");
        clearDataDisplay(); // Clear display on error
        const defaultYear = getCurrentRealYear();
        const defaultPeriod = getCurrentRealMonth();
        updateYearlySummaryView(defaultYear);
        updateBudgetView(defaultPeriod);
        updateChartView(defaultPeriod);
        updateTrendChartView(); // Also clear/show no data for trend chart  
    }
}
// --- Budget Calculation Helper Functions ---

/**
 * Gets the current real-world month in "YYYY-MM" format.
 * @returns {string}
 */
function getCurrentRealMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Gets the previous month's period string (YYYY-MM).
 * @param {string} periodStr The current period (YYYY-MM).
 * @returns {string|null} The previous period string or null if input is invalid.
 */
function getPreviousPeriodJS(periodStr) {
    if (!periodStr || !/^\d{4}-\d{2}$/.test(periodStr)) {
        return null;
    }
    try {
        const [year, month] = periodStr.split('-').map(Number);
        // Create a date object for the first of the current month
        const currentDate = new Date(year, month - 1, 1); // month is 0-indexed
        // Subtract one day to get to the last day of the previous month
        currentDate.setDate(currentDate.getDate() - 1);
        // Format the resulting date
        const prevYear = currentDate.getFullYear();
        const prevMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // month + 1, pad with zero
        return `${prevYear}-${prevMonth}`;
    } catch (e) {
        console.error("Error getting previous period:", e);
        return null;
    }
}

/**
 * Gets the next month's period string (YYYY-MM).
 * @param {string} periodStr The current period (YYYY-MM).
 * @returns {string|null} The next period string or null if input is invalid.
 */
function getNextPeriodJS(periodStr) {
    if (!periodStr || !/^\d{4}-\d{2}$/.test(periodStr)) {
        return null;
    }
    try {
        const [year, month] = periodStr.split('-').map(Number);
        // Create a date object for the first of the current month
        const currentDate = new Date(year, month - 1, 1); // month is 0-indexed
        // Add one month. setMonth handles year rollover automatically.
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Format the resulting date
        const nextYear = currentDate.getFullYear();
        const nextMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        return `${nextYear}-${nextMonth}`;
    } catch (e) {
        console.error("Error getting next period:", e);
        return null;
    }
}

/** Gets the current real-world year */
function getCurrentRealYear() {
    return new Date().getFullYear();
}

/**
 * Updates the Budget View section for a specific period.
 * @param {string} period The target period ("YYYY-MM").
 */
function updateBudgetView(period) {
    console.log(`Updating Budget View for: ${period}`);
    currentBudgetMonth = period; // Update state

    const data = localBudgetData;
    if (!data) {
        console.warn("No data available to update budget view.");
        renderBudgetTable([], { budgeted: 0, spent: 0, available: 0 }, period); // Render empty state
        return;
    }

    // Transactions always come from the main store in localBudgetData
    let transactionsToUse = data.transactions || [];
    let titleSuffix = ""; // No pending suffix needed

    // Calculate data for the specific period
    const budgetViewData = calculateBudgetViewData(
        period,
        data.categories || [],
        data.budget_periods || {},
        transactionsToUse, 
        data.category_groups || {}
    );

    // Render the table
    renderBudgetTable(budgetViewData.rows, budgetViewData.totals, period, titleSuffix);

    // Update navigation button states
    updateNavButtonStates(budgetPrevMonthBtn, budgetNextMonthBtn, period);
}

// --- Chart Update Functions ---

/**
 * Updates the MONTHLY SPENDING PIE CHART View section for a specific period.
 * @param {string} period The target period ("YYYY-MM").
 */
function updateChartView(period) {
    console.log(`Updating Monthly Spending Chart View for: ${period}`);
    currentChartMonth = period; // Update state FOR THE PIE CHART

    const data = localBudgetData;
     if (!data) {
        console.warn("No data available to update monthly chart view.");
        renderSpendingChart(null); // Render empty state for pie chart
        if (chartMonthDisplaySpan) chartMonthDisplaySpan.textContent = period || '--';
        return;
    }

    // Transactions always come from the main store in localBudgetData
    let transactionsToUse = data.transactions || [];
    // let titleSuffix = ""; // No pending suffix needed

     if (chartMonthDisplaySpan) chartMonthDisplaySpan.textContent = period; // No suffix needed

    // Calculate chart data
    const chartData = calculateSpendingBreakdown(
        period,
        transactionsToUse, // Use the standalone transactions
        data.category_groups || {}
    );

    // Render the chart
    renderSpendingChart(chartData); // Renders the PIE chart

    // Update navigation button states for the MONTHLY chart
    updateNavButtonStates(chartPrevMonthBtn, chartNextMonthBtn, period);
}

/**
 * Updates the INCOME/EXPENSE TREND BAR CHART View.
 * Calculates data for the last 12 months and renders the bar chart.
 */
function updateTrendChartView() {
    console.log(`Updating Income/Expense Trend Chart View`);

    const data = localBudgetData;
    if (!data || !data.transactions || data.transactions.length === 0) {
       console.warn("No data available to update trend chart view.");
       renderIncomeExpenseBarChart(null); // Render empty state for bar chart
       return;
    }

    // Calculate trend data (e.g., for the last 12 months)
    const trendData = calculateIncomeExpenseTrendData(data.transactions);

    // Render the bar chart
    renderIncomeExpenseBarChart(trendData);
}

/**
 * Updates the enabled/disabled state of Previous/Next month buttons.
 * @param {HTMLButtonElement} prevBtn The Previous button element.
 * @param {HTMLButtonElement} nextBtn The Next button element.
 * @param {string} displayedPeriod The currently displayed period ("YYYY-MM").
 */
function updateNavButtonStates(prevBtn, nextBtn, displayedPeriod) {
    if (!prevBtn || !nextBtn || !displayedPeriod) return;

    nextBtn.disabled = false;

    // Disable "Previous" if displaying the earliest month with data (or some limit)
    prevBtn.disabled = !!earliestDataMonth && displayedPeriod <= earliestDataMonth;
}

/**
 * Finds the earliest month (YYYY-MM) present in transaction data.
 * @param {Array} transactions The transactions array.
 * @returns {string|null} The earliest month string or null if none found.
 */
function findEarliestMonth(transactions) {
    let earliest = null;
    if (!transactions || transactions.length === 0) return null;
    transactions.forEach(tx => {
        if (tx.date && typeof tx.date === 'string' && tx.date.length >= 7) {
            const month = tx.date.substring(0, 7);
            if (/^\d{4}-\d{2}$/.test(month)) {
                if (earliest === null || month < earliest) {
                    earliest = month;
                }
            }
        }
    });
    return earliest;
}

/** Finds the earliest year present in transaction data. */
function findEarliestYear(transactions) {
    let earliest = null;
    if (!transactions || transactions.length === 0) return null;
    transactions.forEach(tx => {
        if (tx.date && typeof tx.date === 'string' && tx.date.length >= 4) {
            const year = parseInt(tx.date.substring(0, 4), 10);
            if (!isNaN(year)) {
                if (earliest === null || year < earliest) {
                    earliest = year;
                }
            }
        }
    });
    return earliest;
}

/** Finds the latest year present in transaction data. */
function findLatestYear(transactions) {
    let latest = null;
    if (!transactions || transactions.length === 0) return null;
    transactions.forEach(tx => {
        if (tx.date && typeof tx.date === 'string' && tx.date.length >= 4) {
            const year = parseInt(tx.date.substring(0, 4), 10);
            if (!isNaN(year)) {
                if (latest === null || year > latest) {
                    latest = year;
                }
            }
        }
    });
    return latest;
}

/**
 * Calculates NET spending for a specific category within a specific period.
 * Mirrors Python's calculate_category_spending (basic version).
 * @param {string} period The period prefix (YYYY-MM).
 * @param {string} categoryName The category to calculate spending for.
 * @param {Array} transactions The list of transactions to check.
 * @returns {number} The net spending amount for that category in that period.
 */
function calculateCategorySpendingJS(period, categoryName, transactions) {
    let netSpent = 0.0;
    if (!period || !categoryName || !transactions) {
        return 0.0;
    }

    transactions.forEach(tx => {
        // Check category, date, and type
        if (tx.category === categoryName &&
            tx.date && tx.date.startsWith(period) &&
            (tx.type === 'expense' || tx.type === 'refund'))
        {
            try {
                const amount = parseFloat(tx.amount || 0);
                 if (isNaN(amount)) return; // Skip invalid amounts

                if (tx.type === 'expense') {
                    netSpent += amount;
                } else if (tx.type === 'refund') {
                    netSpent -= amount;
                }
            } catch (e) {
                 console.warn(`Error parsing amount during category spending calc: ${e}`, tx);
            }
        }
    });
    return netSpent;
}

// --- Main Budget View Calculation Function ---

// --- Main Budget View Calculation Function ---

/**
 * Calculates the data needed for the budget view table for a specific period.
 * @param {string} period The target period (YYYY-MM).
 * @param {Array} categories List of all category names.
 * @param {object} budgetPeriodsData Budget data { "YYYY-MM": { "Category": Amount } }.
 * @param {Array} transactions List of transactions (use original, not pending).
 * @param {object} groupsData Category groups mapping { "Category": "Group Name" }.
 * @returns {{rows: Array<object>, totals: {budgeted: number, spent: number, available: number}}}
 */
function calculateBudgetViewData(period, categories = [], budgetPeriodsData = {}, transactions = [], groupsData = {}) {
    const budgetRows = [];
    let totalBudgeted = 0.0;
    let totalSpent = 0.0; // Activity total
    // Total available is calculated at the end

    // Exclude internal/special categories and sort
    let displayCategories = categories.filter(c => c !== UNKNOWN_INCOME_SOURCE);
    // Don't filter out archived categories *yet*
    displayCategories.sort();
    // Ensure Uncategorized is last if present
    if (displayCategories.includes(UNCATEGORIZED)) {
        displayCategories = displayCategories.filter(c => c !== UNCATEGORIZED);
        displayCategories.push(UNCATEGORIZED);
    }

    const periodBudget = budgetPeriodsData[period] || {};
    const previousPeriod = getPreviousPeriodJS(period);
    const previousPeriodBudget = previousPeriod ? (budgetPeriodsData[previousPeriod] || {}) : {};

    console.log(`Budget Data for ${period}:`, periodBudget);
    console.log(`Previous Period: ${previousPeriod}`);

    displayCategories.forEach(cat => {
        const group = groupsData[cat] || 'Unassigned'; // Use 'Unassigned' if no group found
        const isArchived = group === ARCHIVED_GROUP_NAME;
        const isSavingsGoal = group === SAVINGS_GROUP_NAME;

        // Skip income categories from budget view
        if (group === 'Income') {
            console.log(`Skipping income category from budget view: ${cat}`);
            return; // Continue to the next category in the loop
        }

        // *** Calculate values FIRST, even for archived ***
        const budgeted = periodBudget[cat] || 0.0;
        const spent = calculateCategorySpendingJS(period, cat, transactions);

        let prevAvailable = 0.0;
        if (previousPeriod) {
            const prevBudgeted = previousPeriodBudget[cat] || 0.0;
            const prevSpent = calculateCategorySpendingJS(previousPeriod, cat, transactions);
            prevAvailable = prevBudgeted - prevSpent;
        }

        const available = prevAvailable + budgeted - spent;

        // Skip ONLY if archived AND has zero budget, zero activity, AND zero carry-over
        const tolerance = 0.005;
        if (isArchived &&
            Math.abs(budgeted) < tolerance &&
            Math.abs(spent) < tolerance &&
            Math.abs(prevAvailable) < tolerance)
        {
            console.log(`Skipping fully zero archived category: ${cat}`);
            return; // Continue to next category
        }

        // *** If not skipped, add to rows ***
        budgetRows.push({
            name: cat,
            group: group,
            prev_avail: prevAvailable,
            budgeted: budgeted,
            spent: spent, // This is 'Activity'
            available: available,
            is_savings_goal: isSavingsGoal,
            is_archived: isArchived // Pass the archived status to the renderer
        });

        // Accumulate totals (only for rows added)
        totalBudgeted += budgeted;
        totalSpent += spent;
        // Total available is calculated cumulatively at the end from totals
    });

    // Calculate overall total available based on the rows included
    const totalPrevAvailable = budgetRows.reduce((sum, row) => sum + row.prev_avail, 0);
    const totalAvailable = totalPrevAvailable + totalBudgeted - totalSpent;

    return {
        rows: budgetRows,
        totals: {
            budgeted: totalBudgeted,
            spent: totalSpent,
            available: totalAvailable
        }
    };
}
// --- Budget Table Rendering Function ---

/**
 * Renders the calculated budget data into the HTML table.
 * ADDS data-category to rows and editable-budget class to budgeted cells.
 * @param {Array<object>} budgetRows Array of row data objects.
 * @param {{budgeted: number, spent: number, available: number}} totals Calculated totals.
 * @param {string} period The period being displayed (YYYY-MM).
 * @param {string} titleSuffix Optional suffix for the title (no longer used).
 */
function renderBudgetTable(budgetRows, totals, period, titleSuffix = "") {
    if (budgetTbody) budgetTbody.innerHTML = '';
    if (budgetViewMonthSpan) budgetViewMonthSpan.textContent = (period || '--');

    if (totalBudgetedValueTd) totalBudgetedValueTd.textContent = '--';
    if (totalSpentValueTd) totalSpentValueTd.textContent = '--';
    if (totalAvailableValueTd) totalAvailableValueTd.textContent = '--';
    if (budgetNoDataMsg) budgetNoDataMsg.classList.add('hidden');

    if (!budgetTbody || !budgetRows || budgetRows.length === 0) {
         if (budgetNoDataMsg) budgetNoDataMsg.classList.remove('hidden');
        console.warn("No budget rows to render for period:", period);
        if (totalBudgetedValueTd) totalBudgetedValueTd.textContent = formatCurrency(0);
        if (totalSpentValueTd) totalSpentValueTd.textContent = formatCurrency(0);
        if (totalAvailableValueTd) totalAvailableValueTd.textContent = formatCurrency(0);
        return;
    }

    const rowsByGroup = {};
    budgetRows.forEach(row => {
        const group = row.group || 'Unassigned';
        if (!rowsByGroup[group]) rowsByGroup[group] = [];
        rowsByGroup[group].push(row);
    });

    const sortedGroupNames = Object.keys(rowsByGroup).sort((a, b) => {
        // Prioritize specific groups, then sort alphabetically
        // Added "Archived" to sorting logic if needed, placing it last among visible groups
        const groupOrder = {
            'Income': 1, // Should be filtered out before rendering rows, but included for robustness
            'Bills': 2,
            'Expenses': 3,
            'Savings Goals': 10,
            'Archived': 11, // Place archived after Savings
            'Unassigned': 99
        };
        // Default order for groups not explicitly listed (assign 5)
        const orderA = groupOrder[a] !== undefined ? groupOrder[a] : 5;
        const orderB = groupOrder[b] !== undefined ? groupOrder[b] : 5;

        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b); // Alphabetical fallback
    });

    sortedGroupNames.forEach(groupName => {
        const headerRow = budgetTbody.insertRow();
        headerRow.className = 'budget-group-header';
        const headerCell = headerRow.insertCell();
        headerCell.colSpan = 5; // Adjust colspan if columns changed
        headerCell.textContent = groupName;

        const groupRows = rowsByGroup[groupName].sort((a, b) => a.name.localeCompare(b.name));

        groupRows.forEach(row => {
            const tr = budgetTbody.insertRow();
            tr.dataset.category = row.name;

            // --- APPLY STYLING FOR SAVINGS AND ARCHIVED ---
            if (row.is_savings_goal) tr.classList.add('savings-goal-row');
            if (row.is_archived) tr.classList.add('archived-category-row'); // Apply class if archived

            const cellCat = tr.insertCell(); cellCat.textContent = row.name;

            const cellPrevAvail = tr.insertCell();
            cellPrevAvail.textContent = formatCurrency(row.prev_avail);
            cellPrevAvail.className = `currency ${getCurrencyClass(row.prev_avail)}`;
            cellPrevAvail.style.textAlign = 'right';

            const cellBudgeted = tr.insertCell();
            cellBudgeted.textContent = formatCurrency(row.budgeted);
            cellBudgeted.className = `currency ${getCurrencyClass(row.budgeted, true)}`;
            cellBudgeted.style.textAlign = 'right';

            // Only make Budgeted cell editable if it's NOT an archived category
            if (!row.is_archived) {
                cellBudgeted.classList.add('editable-budget');
                cellBudgeted.title = "Click to edit budget";
            } else {
                cellBudgeted.style.cursor = 'default'; // Indicate non-editable for archived
            }

            const cellSpent = tr.insertCell();
            cellSpent.textContent = formatCurrency(row.spent);
            cellSpent.className = `currency ${row.spent > 0 ? 'negative-currency' : (row.spent < 0 ? 'positive-currency' : 'zero-currency')}`;
            cellSpent.style.textAlign = 'right';

            const cellAvailable = tr.insertCell();
            cellAvailable.textContent = formatCurrency(row.available);
            // Determine base classes first
            let availableClasses = `currency ${getCurrencyClass(row.available)}`;
            // Add 'overspent-available' class if the available amount is negative
            const overspentThreshold = -0.005;
            if (row.available < overspentThreshold) {
                availableClasses += ' overspent-available';
            }
            cellAvailable.className = availableClasses;
            cellAvailable.style.textAlign = 'right';
        });
    });
    // Populate totals
    if (totalBudgetedValueTd) {
        totalBudgetedValueTd.textContent = formatCurrency(totals.budgeted);
        totalBudgetedValueTd.className = `currency ${getCurrencyClass(totals.budgeted, true)}`;
    }
    if (totalSpentValueTd) {
        totalSpentValueTd.textContent = formatCurrency(totals.spent);
         totalSpentValueTd.className = `currency ${totals.spent > 0 ? 'negative-currency' : (totals.spent < 0 ? 'positive-currency' : 'zero-currency')}`;
    }
    if (totalAvailableValueTd) {
        totalAvailableValueTd.textContent = formatCurrency(totals.available);
        totalAvailableValueTd.className = `currency ${getCurrencyClass(totals.available)}`;
    }

    updateBudgetTableTotals();
}/**
 * Renders the calculated budget data into the HTML table.
 * ADDS data-category to rows and editable-budget class to budgeted cells.
 * @param {Array<object>} budgetRows Array of row data objects.
 * @param {{budgeted: number, spent: number, available: number}} totals Calculated totals.
 * @param {string} period The period being displayed (YYYY-MM).
 * @param {string} titleSuffix Optional suffix for the title (no longer used).
 */
function renderBudgetTable(budgetRows, totals, period, titleSuffix = "") {
    if (budgetTbody) budgetTbody.innerHTML = '';
    if (budgetViewMonthSpan) budgetViewMonthSpan.textContent = (period || '--');

    if (totalBudgetedValueTd) totalBudgetedValueTd.textContent = '--';
    if (totalSpentValueTd) totalSpentValueTd.textContent = '--';
    if (totalAvailableValueTd) totalAvailableValueTd.textContent = '--';
    if (budgetNoDataMsg) budgetNoDataMsg.classList.add('hidden');

    if (!budgetTbody || !budgetRows || budgetRows.length === 0) {
         if (budgetNoDataMsg) budgetNoDataMsg.classList.remove('hidden');
        console.warn("No budget rows to render for period:", period);
        if (totalBudgetedValueTd) totalBudgetedValueTd.textContent = formatCurrency(0);
        if (totalSpentValueTd) totalSpentValueTd.textContent = formatCurrency(0);
        if (totalAvailableValueTd) totalAvailableValueTd.textContent = formatCurrency(0);
        return;
    }

    const rowsByGroup = {};
    budgetRows.forEach(row => {
        const group = row.group || 'Unassigned';
        if (!rowsByGroup[group]) rowsByGroup[group] = [];
        rowsByGroup[group].push(row);
    });

    const sortedGroupNames = Object.keys(rowsByGroup).sort((a, b) => {
        // Prioritize specific groups, then sort alphabetically
        // Added "Archived" to sorting logic if needed, placing it last among visible groups
        const groupOrder = {
            'Income': 1, // Should be filtered out before rendering rows, but included for robustness
            'Bills': 2,
            'Expenses': 3,
            'Savings Goals': 10,
            'Archived': 11, // Place archived after Savings
            'Unassigned': 99
        };
        // Default order for groups not explicitly listed (assign 5)
        const orderA = groupOrder[a] !== undefined ? groupOrder[a] : 5;
        const orderB = groupOrder[b] !== undefined ? groupOrder[b] : 5;

        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b); // Alphabetical fallback
    });

    sortedGroupNames.forEach(groupName => {
        const headerRow = budgetTbody.insertRow();
        headerRow.className = 'budget-group-header';
        const headerCell = headerRow.insertCell();
        headerCell.colSpan = 5; // Adjust colspan if columns changed
        headerCell.textContent = groupName;

        const groupRows = rowsByGroup[groupName].sort((a, b) => a.name.localeCompare(b.name));

        groupRows.forEach(row => {
            const tr = budgetTbody.insertRow();
            tr.dataset.category = row.name;

            // --- APPLY STYLING FOR SAVINGS AND ARCHIVED ---
            if (row.is_savings_goal) tr.classList.add('savings-goal-row');
            if (row.is_archived) tr.classList.add('archived-category-row'); // Apply class if archived

            const cellCat = tr.insertCell(); cellCat.textContent = row.name;

            const cellPrevAvail = tr.insertCell();
            cellPrevAvail.textContent = formatCurrency(row.prev_avail);
            cellPrevAvail.className = `currency ${getCurrencyClass(row.prev_avail)}`;
            cellPrevAvail.style.textAlign = 'right';

            const cellBudgeted = tr.insertCell();
            cellBudgeted.textContent = formatCurrency(row.budgeted);
            cellBudgeted.className = `currency ${getCurrencyClass(row.budgeted, true)}`;
            cellBudgeted.style.textAlign = 'right';

            // Only make Budgeted cell editable if it's NOT an archived category
            if (!row.is_archived) {
                cellBudgeted.classList.add('editable-budget');
                cellBudgeted.title = "Click to edit budget";
            } else {
                cellBudgeted.style.cursor = 'default'; // Indicate non-editable for archived
            }

            const cellSpent = tr.insertCell();
            cellSpent.textContent = formatCurrency(row.spent);
            cellSpent.className = `currency ${row.spent > 0 ? 'negative-currency' : (row.spent < 0 ? 'positive-currency' : 'zero-currency')}`;
            cellSpent.style.textAlign = 'right';

            const cellAvailable = tr.insertCell();
            cellAvailable.textContent = formatCurrency(row.available);
            // Determine base classes first
            let availableClasses = `currency ${getCurrencyClass(row.available)}`;
            // Add 'overspent-available' class if the available amount is negative
            const overspentThreshold = -0.005;
            if (row.available < overspentThreshold) {
                availableClasses += ' overspent-available';
            }
            cellAvailable.className = availableClasses;
            cellAvailable.style.textAlign = 'right';
        });
    });
    // Populate totals
    if (totalBudgetedValueTd) {
        totalBudgetedValueTd.textContent = formatCurrency(totals.budgeted);
        totalBudgetedValueTd.className = `currency ${getCurrencyClass(totals.budgeted, true)}`;
    }
    if (totalSpentValueTd) {
        totalSpentValueTd.textContent = formatCurrency(totals.spent);
         totalSpentValueTd.className = `currency ${totals.spent > 0 ? 'negative-currency' : (totals.spent < 0 ? 'positive-currency' : 'zero-currency')}`;
    }
    if (totalAvailableValueTd) {
        totalAvailableValueTd.textContent = formatCurrency(totals.available);
        totalAvailableValueTd.className = `currency ${getCurrencyClass(totals.available)}`;
    }

    updateBudgetTableTotals();
}

// --- Helper Function: Update Budget Table Totals ---
/** Recalculates and updates the footer totals based on current table data. */
function updateBudgetTableTotals() {
    if (!budgetTbody || !totalBudgetedValueTd || !totalSpentValueTd || !totalAvailableValueTd) {
        console.warn("Cannot update totals: Missing elements.");
        return;
    }

    let totalBudgeted = 0.0;
    let totalSpent = 0.0;
    let totalAvailable = 0.0;

    const rows = budgetTbody.querySelectorAll('tr[data-category]'); // Select only data rows

    rows.forEach(row => {
        // Find the cells within this row (use indices - adjust if columns change)
        const budgetedCell = row.cells[2]; // Assuming 3rd cell (index 2) is Budgeted
        const spentCell = row.cells[3];    // Assuming 4th cell (index 3) is Activity/Spent
        const availableCell = row.cells[4]; // Assuming 5th cell (index 4) is Available

        // Extract and parse values safely
        totalBudgeted += parseCurrency(budgetedCell?.textContent || '0');
        totalSpent += parseCurrency(spentCell?.textContent || '0');
        // Available total is trickier - it depends on previous month's carryover too.
        // For simplicity here, we recalculate it based on the displayed budgeted/spent for this month.
        // A full recalculation (`calculateBudgetViewData`) might be needed for perfect accuracy including carryover.
        // Let's sum the displayed available values for now.
        totalAvailable += parseCurrency(availableCell?.textContent || '0');
    });

     // Update the footer cells
    totalBudgetedValueTd.textContent = formatCurrency(totalBudgeted);
    totalBudgetedValueTd.className = `currency ${getCurrencyClass(totalBudgeted, true)}`;

    totalSpentValueTd.textContent = formatCurrency(totalSpent);
    totalSpentValueTd.className = `currency ${totalSpent > 0 ? 'negative-currency' : (totalSpent < 0 ? 'positive-currency' : 'zero-currency')}`;

    // Recalculate total available based on sums (more robust than summing individual available cells)
    // This relies on having the 'prev_available' conceptually available, which isn't stored directly in the DOM easily.
    // For now, summing the displayed 'available' might be sufficient for visual update,
    // but a full data reload (`loadDataFromDB`) after saving is the most reliable way.
    // Let's stick to summing the displayed available column for immediate visual feedback after edit.
    totalAvailableValueTd.textContent = formatCurrency(totalAvailable);
    totalAvailableValueTd.className = `currency ${getCurrencyClass(totalAvailable)}`;

    // Re-calculate and display RTA after updating totals - Needs DB read for accuracy.
    // We'll trigger this after the save operation instead.
    // updateRTAFromMetadata(); // Placeholder for a function to read and display RTA
}

/**
 * Updates the Yearly Summary View section for a specific year.
 * @param {number} year The target year (e.g., 2024).
 */
function updateYearlySummaryView(year) {
    console.log(`Updating Yearly Summary View for: ${year}`);
    currentYearlySummaryYear = year; // Update state

    if (!localBudgetData) {
        console.warn("No data available to update yearly summary view.");
        renderYearlySummaryTable(year, null); // Render empty state
        return;
    }

    // Use standalone data
    const transactionsToUse = localBudgetData.transactions || [];
    const categoriesToUse = localBudgetData.categories || [];
    const groupsToUse = localBudgetData.category_groups || {};

    // Calculate data for the specific year
    const summaryData = calculateYearlySummaryData(
        year,
        transactionsToUse,
        categoriesToUse,
        groupsToUse
    );

    // Render the table
    renderYearlySummaryTable(year, summaryData);

    // Update navigation button states
    updateYearlyNavButtonStates(year);
}

/**
 * Updates the enabled/disabled state of Previous/Next year buttons.
 * @param {number} displayedYear The currently displayed year.
 */
function updateYearlyNavButtonStates(displayedYear) {
    if (!yearlyPrevYearBtn || !yearlyNextYearBtn || !displayedYear) return;

    const currentRealYear = getCurrentRealYear();

    // Disable "Next" if displaying the current real year or later
    yearlyNextYearBtn.disabled = displayedYear >= currentRealYear;

    // Disable "Previous" if displaying the earliest year with data
    yearlyPrevYearBtn.disabled = !!earliestDataYear && displayedYear <= earliestDataYear;
}

/**
 * Calculates the data needed for the yearly summary report table.
 * @param {number} year The target year (e.g., 2024).
 * @param {Array} transactions List of all transactions.
 * @param {Array} categories List of all category names.
 * @param {object} groupsData Category groups mapping { "Category": "Group Name" }.
 * @returns {{incomeRows: Array<object>, expenseRows: Array<object>, monthlyResults: Array<number>, yearlyResult: number}|null} Structured data or null if no relevant data.
 */
function calculateYearlySummaryData(year, transactions = [], categories = [], groupsData = {}) {
    const yearPrefix = year.toString();
    const monthlyData = {}; // { category: { '01': amount, '02': amount, ..., 'total': amount } }
    const monthlyTotals = { income: Array(12).fill(0.0), expense: Array(12).fill(0.0) };

    // 1. Filter transactions for the year and aggregate by category/month
    transactions.forEach(tx => {
        if (!tx.date || !tx.date.startsWith(yearPrefix) || tx.type === 'transfer') {
            return; // Skip if not in year or is a transfer
        }

        const category = tx.category || (tx.type === 'income' ? UNKNOWN_INCOME_SOURCE : UNCATEGORIZED);
        const group = groupsData[category];

        // Skip categories we don't want in the summary (Savings, Archived)
        if (group === SAVINGS_GROUP_NAME || group === ARCHIVED_GROUP_NAME) {
            return;
        }

        const monthIndex = parseInt(tx.date.substring(5, 7), 10) - 1; // 0-11
        if (monthIndex < 0 || monthIndex > 11) return; // Invalid month

        try {
            const amount = parseFloat(tx.amount || 0);
            if (isNaN(amount)) return;

            if (!monthlyData[category]) {
                // Initialize category with 12 months + total
                monthlyData[category] = { monthly: Array(12).fill(0.0), total: 0.0 };
            }

            let effectiveAmount = 0;
            if (tx.type === 'income') {
                effectiveAmount = amount;
                monthlyTotals.income[monthIndex] += amount;
            } else if (tx.type === 'expense') {
                effectiveAmount = amount; // Store as positive expense
                monthlyTotals.expense[monthIndex] += amount;
            } else if (tx.type === 'refund') {
                effectiveAmount = -amount; // Store refund as negative expense
                monthlyTotals.expense[monthIndex] -= amount; // Reduce expense total
            }

            monthlyData[category].monthly[monthIndex] += effectiveAmount;
            monthlyData[category].total += effectiveAmount;

        } catch (e) {
            console.warn(`Error processing transaction amount during yearly summary calc: ${e}`, tx);
        }
    });

    // 2. Prepare rows, separating Income and Expenses
    const incomeRows = [];
    const expenseRows = [];

    const relevantCategories = Object.keys(monthlyData).sort();

    relevantCategories.forEach(cat => {
        const group = groupsData[cat] || 'Unassigned';
        const isIncome = group === INCOME_GROUP_NAME || cat === UNKNOWN_INCOME_SOURCE; // Check group or specific internal income category
        const rowData = {
            category: cat,
            monthly: monthlyData[cat].monthly,
            total: monthlyData[cat].total
        };

        // Skip rows with zero total and zero monthly values unless needed
        if (rowData.total === 0 && rowData.monthly.every(m => m === 0)) {
             // console.log(`Skipping zero-value category: ${cat}`); // Optional log
             return;
        }


        if (isIncome) {
            incomeRows.push(rowData);
        } else {
            expenseRows.push(rowData);
        }
    });

    // 3. Calculate Monthly Results (Income - Expense)
    const monthlyResults = [];
    let yearlyIncomeTotal = 0;
    let yearlyExpenseTotal = 0;
    for (let i = 0; i < 12; i++) {
        const income = monthlyTotals.income[i];
        const expense = monthlyTotals.expense[i];
        monthlyResults.push(income - expense);
        yearlyIncomeTotal += income;
        yearlyExpenseTotal += expense;
    }
    const yearlyResult = yearlyIncomeTotal - yearlyExpenseTotal;

    // Return null if there's absolutely nothing to show
    if (incomeRows.length === 0 && expenseRows.length === 0) {
        return null;
    }

    return {
        incomeRows,
        expenseRows,
        monthlyIncomeTotals: monthlyTotals.income, 
        yearlyIncomeTotal,                       
        monthlyExpenseTotals: monthlyTotals.expense, 
        yearlyExpenseTotal,                      
        monthlyResults,
        yearlyResult
    };
}


/**
 * Helper to render a total row (Income or Expenses) in the yearly summary table tbody.
 * @param {HTMLTableSectionElement} tbody The table body element.
 * @param {string} label The text label for the row (e.g., "Total Income").
 * @param {Array<number>} monthlyTotals Array of 12 monthly total amounts.
 * @param {number} yearlyTotal The overall total for the year.
 * @param {boolean} isIncomeTotal True if this is the income total row, false for expense total.
 */
function renderYearlyTotalRow(tbody, label, monthlyTotals, yearlyTotal, isIncomeTotal) {
    const tr = tbody.insertRow();
    tr.className = 'yearly-total-row'; // Class for potential styling

    // Label Cell (using TH for semantic emphasis)
    const cellLabel = document.createElement('th'); // Use TH for the row header
    cellLabel.textContent = label;
    cellLabel.style.textAlign = 'left';
    cellLabel.style.fontWeight = 'bold';
    tr.appendChild(cellLabel);

    // Monthly Totals Cells
    monthlyTotals.forEach(amount => {
        const cell = tr.insertCell();
        cell.textContent = formatCurrency(amount);
        cell.style.fontWeight = 'bold';
        let currencyClass = '';
        if (isIncomeTotal) {
            // Style income totals like income (green if positive)
            currencyClass = getCurrencyClass(amount, true);
        } else {
            // Style expense totals like expenses (red if positive net expense, green if negative net expense/net refund)
            currencyClass = amount > 0.005 ? 'negative-currency' : (amount < -0.005 ? 'positive-currency' : 'zero-currency');
        }
        cell.className = `currency ${currencyClass}`;
    });

    // Yearly Total Cell
    const cellYearlyTotal = tr.insertCell();
    cellYearlyTotal.textContent = formatCurrency(yearlyTotal);
    cellYearlyTotal.style.fontWeight = 'bold';
    let totalClass = '';
     if (isIncomeTotal) {
         totalClass = getCurrencyClass(yearlyTotal, true);
     } else {
         totalClass = yearlyTotal > 0.005 ? 'negative-currency' : (yearlyTotal < -0.005 ? 'positive-currency' : 'zero-currency');
     }
    cellYearlyTotal.className = `currency ${totalClass}`;

}

/**
 * Renders the calculated yearly summary data into the HTML table.
 * @param {number} year The year being displayed.
 * @param {object|null} summaryData The structured data from calculateYearlySummaryData, or null.
 */
function renderYearlySummaryTable(year, summaryData) {
    const theadMonthsRow = document.getElementById('yearly-summary-thead-months');

    // Always clear previous content
    if (yearlySummaryTbody) yearlySummaryTbody.innerHTML = '';
    if (yearlySummaryTfoot) yearlySummaryTfoot.innerHTML = '';
    if (yearlySummaryYearSpan) yearlySummaryYearSpan.textContent = year || '--';
    if (yearlySummaryNoDataMsg) yearlySummaryNoDataMsg.classList.add('hidden');
    if (theadMonthsRow) theadMonthsRow.innerHTML = ''; // Clear headers too

    // Check if data exists and table elements are present
    if (!summaryData || (!summaryData.incomeRows.length && !summaryData.expenseRows.length)) {
         if (yearlySummaryNoDataMsg) yearlySummaryNoDataMsg.classList.remove('hidden');
         if (yearlySummaryTbody) yearlySummaryTbody.innerHTML = `<tr><td colspan="14">No transaction data found for ${year}.</td></tr>`; // Update colspan
        console.warn("No yearly summary data to render for year:", year);
         // Still render headers for empty state
         if (theadMonthsRow) renderYearlyHeaders(theadMonthsRow);
        return;
    }
     if (!yearlySummaryTbody || !yearlySummaryTfoot || !theadMonthsRow) {
         console.error("Yearly summary table elements (tbody, tfoot, thead row) not found.");
         return;
     }
    // Hide no-data message if we have *any* data object
    if (yearlySummaryNoDataMsg) yearlySummaryNoDataMsg.classList.add('hidden');

    // 1. Render Headers
    renderYearlyHeaders(theadMonthsRow);

    // 2. Render Income Rows
    summaryData.incomeRows.forEach(row => {
        renderYearlyCategoryRow(yearlySummaryTbody, row, true); // isIncome = true
    });
    if (summaryData.incomeRows.length > 0) { // Only show if there was income data
        renderYearlyTotalRow(
            yearlySummaryTbody,
            "Total Income",
            summaryData.monthlyIncomeTotals,
            summaryData.yearlyIncomeTotal,
            true // isIncomeTotal = true
        );
    }

    // 3. Render Separator (if both income and expenses exist)
    if (summaryData.incomeRows.length > 0 && summaryData.expenseRows.length > 0) {
        const sepRow = yearlySummaryTbody.insertRow();
        sepRow.className = 'expense-group-separator'; // Apply CSS class
        const cell = sepRow.insertCell();
        cell.colSpan = 14; // Span all columns
        cell.textContent = 'Expenses';
    } else if (summaryData.expenseRows.length > 0) {
         // Optional: Add header if ONLY expenses exist?
        // const sepRow = yearlySummaryTbody.insertRow(); /* ... */ cell.textContent = 'Expenses';
    }


    // 4. Render Expense Rows
    summaryData.expenseRows.forEach(row => {
        renderYearlyCategoryRow(yearlySummaryTbody, row, false); // isIncome = false
    });
    if (summaryData.expenseRows.length > 0) { // Only show if there was expense data
        renderYearlyTotalRow(
            yearlySummaryTbody,
            "Total Expenses",
            summaryData.monthlyExpenseTotals,
            summaryData.yearlyExpenseTotal,
            false // isIncomeTotal = false
        );
    }

    // 5. Render Footer (Monthly Result)
    renderYearlyFooter(yearlySummaryTfoot, summaryData.monthlyResults, summaryData.yearlyResult);
}

/** Helper to render the month headers for the yearly summary table */
function renderYearlyHeaders(theadRow) {
     theadRow.innerHTML = ''; // Clear first
     const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
     let th = document.createElement('th'); th.textContent = 'Category'; theadRow.appendChild(th);
     months.forEach(m => {
         th = document.createElement('th'); th.textContent = m; theadRow.appendChild(th);
     });
     th = document.createElement('th'); th.textContent = 'Total'; theadRow.appendChild(th);
}


/** Helper to render a single category row in the yearly summary table */
function renderYearlyCategoryRow(tbody, rowData, isIncome) {
    const tr = tbody.insertRow();
    const cellCat = tr.insertCell();
    cellCat.textContent = rowData.category;
    cellCat.style.textAlign = 'left'; // Ensure category name is left-aligned

    // Monthly values
    rowData.monthly.forEach(amount => {
        const cell = tr.insertCell();
        cell.textContent = formatCurrency(amount);
        // Income uses positive style, Expense uses negative style for positive amounts
        let currencyClass = '';
         if (isIncome) {
             currencyClass = getCurrencyClass(amount, true); // Allow positive green for income
         } else {
             // For expenses: positive amount -> red, negative amount (refund) -> green
             currencyClass = amount > 0.005 ? 'negative-currency' : (amount < -0.005 ? 'positive-currency' : 'zero-currency');
         }
        cell.className = `currency ${currencyClass}`;
    });

    // Total value
    const cellTotal = tr.insertCell();
    cellTotal.textContent = formatCurrency(rowData.total);
     let totalClass = '';
     if (isIncome) {
         totalClass = getCurrencyClass(rowData.total, true);
     } else {
         totalClass = rowData.total > 0.005 ? 'negative-currency' : (rowData.total < -0.005 ? 'positive-currency' : 'zero-currency');
     }
    cellTotal.className = `currency ${totalClass}`;
    cellTotal.style.fontWeight = 'bold'; // Make total bold
}

/** Helper to render the footer row (Monthly Result) */
function renderYearlyFooter(tfoot, monthlyResults, yearlyResult) {
    tfoot.innerHTML = ''; // Clear previous footer
    const tr = tfoot.insertRow();
    tr.className = 'monthly-result-row'; // Apply CSS class

    const cellLabel = tr.insertCell(); // Use TH for semantic meaning?
    cellLabel.outerHTML = `<th>Monthly Result</th>`; // Change to TH

    monthlyResults.forEach(result => {
        const cell = tr.insertCell();
        cell.textContent = formatCurrency(result);
        cell.className = `currency ${getCurrencyClass(result, true)}`; // Allow positive results to be green
    });

    const cellTotal = tr.insertCell();
    cellTotal.textContent = formatCurrency(yearlyResult);
    cellTotal.className = `currency ${getCurrencyClass(yearlyResult, true)}`;
    cellTotal.style.fontWeight = 'bold'; // Make total bold
}

// --- Helper Function: Parse Formatted Currency ---
/**
 * Parses a formatted number string (potentially with '.' thousands and ',' decimal)
 * back into a number. Handles parentheses for negatives.
 * @param {string} value The formatted string (e.g., "1.234,56" or "(50,00)").
 * @returns {number} The parsed number, or 0 if parsing fails.
 */
function parseCurrency(value) {
    if (typeof value !== 'string' || !value.trim()) return 0;
    let numStr = value.trim();
    let isNegative = false;
    if (numStr.startsWith('(') && numStr.endsWith(')')) {
        isNegative = true;
        numStr = numStr.substring(1, numStr.length - 1);
    }
    numStr = numStr.replace(/\./g, ''); // Remove thousands dots
    numStr = numStr.replace(/,/g, '.'); // Replace decimal comma with dot
    let number = parseFloat(numStr);
    if (isNaN(number)) {
        console.warn(`Could not parse currency value: "${value}" -> "${numStr}"`);
        return NaN;
    }
    return isNegative ? -number : number;
}
// --- Chart Data Calculation Function ---

/**
 * Calculates positive net spending aggregated by category for a pie chart.
 * Excludes Savings Goals and internal categories.
 * @param {string} period The target period (YYYY-MM).
 * @param {Array} transactions List of transactions (use original).
 * @param {object} groupsData Category groups mapping { "Category": "Group Name" }.
 * @returns {{labels: Array<string>, data: Array<number>}|null} Object with labels and data arrays, or null if no data.
 */
function calculateSpendingBreakdown(period, transactions = [], groupsData = {}) {
    const spendingByCategory = {}; // { CategoryName: netSpending }

    transactions.forEach(tx => {
        if (!tx.date || !tx.date.startsWith(period) || tx.type === 'transfer' || tx.type === 'income') {
            return; // Skip if not in period or not expense/refund
        }

        const category = tx.category || UNCATEGORIZED; // Default to Uncategorized
        const group = groupsData[category];

        // Skip Savings Goals and internal categories
        if (group === SAVINGS_GROUP_NAME || category === UNKNOWN_INCOME_SOURCE) {
            return;
        }

        try {
            const amount = parseFloat(tx.amount || 0);
            if (isNaN(amount)) return;

            if (!spendingByCategory[category]) {
                spendingByCategory[category] = 0;
            }

            if (tx.type === 'expense') {
                spendingByCategory[category] += amount;
            } else if (tx.type === 'refund') {
                spendingByCategory[category] -= amount;
            }
        } catch (e) {
            console.warn(`Error parsing amount during spending breakdown calc: ${e}`, tx);
        }
    });

    // Filter out categories with zero or negative net spending, sort by amount desc
    const spendingEntries = Object.entries(spendingByCategory)
        .filter(([cat, amount]) => amount > 0.005) // Keep only positive net spending
        .sort(([, amountA], [, amountB]) => amountB - amountA); // Sort descending

    if (spendingEntries.length === 0) {
        return null; // No data for the chart
    }

    // Optional: Group small slices into "Other"
    const threshold = 0.03; // Example: Group slices less than 3% of total
    const totalSpending = spendingEntries.reduce((sum, [, amount]) => sum + amount, 0);
    let otherAmount = 0;
    const finalEntries = [];

    spendingEntries.forEach(([cat, amount]) => {
        if (amount / totalSpending < threshold && spendingEntries.length > 5) { // Only group if there are enough slices
            otherAmount += amount;
        } else {
            finalEntries.push([cat, amount]);
        }
    });

    if (otherAmount > 0.005) {
        finalEntries.push(["Other", otherAmount]);
    }

    // Prepare data for Chart.js
    const labels = finalEntries.map(([cat]) => cat);
    const data = finalEntries.map(([, amount]) => amount);

    return { labels, data };
}

/**
 * Calculates income and expense totals for the last 12 months.
 * @param {Array} transactions List of all transactions.
 * @returns {{labels: Array<string>, incomeData: Array<number>, expenseData: Array<number>}|null} Data for the bar chart or null.
 */
function calculateIncomeExpenseTrendData(transactions = []) {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    // 1. Determine the 12-month range (ending in the latest transaction month or current month)
    const latestMonth = findLatestMonth(transactions) || getCurrentRealMonth();
    const endDate = new Date(latestMonth + '-01T12:00:00Z'); // Use UTC noon to avoid timezone issues near month end

    const months = []; // Array to store { period: "YYYY-MM", income: 0, expense: 0 }
    const labels = []; // Array for chart labels (e.g., "Jan 24")

    for (let i = 0; i < 12; i++) {
        // Calculate the date for the start of the month, 'i' months ago
        const targetDate = new Date(endDate);
        targetDate.setUTCMonth(endDate.getUTCMonth() - i); // Go back i months

        const year = targetDate.getUTCFullYear();
        const month = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const period = `${year}-${month}`;

        // Format label (e.g., "Jan 24")
        const shortMonthName = targetDate.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
        const shortYear = year.toString().slice(-2);
        labels.push(`${shortMonthName} ${shortYear}`);

        months.push({ period: period, income: 0, expense: 0 });
    }

    months.reverse(); // Put in chronological order (oldest first)
    labels.reverse();

    // 2. Iterate through transactions and aggregate
    transactions.forEach(tx => {
        if (!tx.date || tx.type === 'transfer') return; // Skip transfers and tx without dates

        const period = tx.date.substring(0, 7);
        const monthData = months.find(m => m.period === period);

        if (monthData) {
             try {
                const amount = parseFloat(tx.amount || 0);
                if (isNaN(amount)) return;

                if (tx.type === 'income') {
                    monthData.income += amount;
                } else if (tx.type === 'expense') {
                    monthData.expense += amount;
                } else if (tx.type === 'refund') {
                    monthData.expense -= amount; // Refunds reduce expense total
                }
            } catch (e) {
                 console.warn(`Error parsing amount during trend calc: ${e}`, tx);
            }
        }
    });

    // 3. Extract data for Chart.js
    const incomeData = months.map(m => m.income);
    const expenseData = months.map(m => m.expense);

    // Check if there's any actual data to display
    const hasData = incomeData.some(d => d > 0) || expenseData.some(d => d > 0);
    if (!hasData) {
        return null;
    }


    return { labels, incomeData, expenseData };
}


// --- Chart Rendering Functions ---

/**
 * Renders the spending pie chart using Chart.js.
 * @param {{labels: Array<string>, data: Array<number>}} chartData Object with labels and data arrays.
 */
function renderSpendingChart(chartData) {
    if (!spendingChartCanvas || !chartData) {
        console.error("Cannot render chart: Canvas not found or no data.");
        return;
    }
     if (spendingChartCanvas.parentElement) spendingChartCanvas.parentElement.style.display = 'block'; // Ensure container is visible


    // Destroy previous chart instance if it exists
    if (spendingPieChartInstance) {
        spendingPieChartInstance.destroy();
         console.log("Destroyed previous chart instance.");
    }

    const ctx = spendingChartCanvas.getContext('2d');
    spendingPieChartInstance = new Chart(ctx, {
        type: 'pie', // or 'doughnut'
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Spending',
                data: chartData.data,
                // Chart.js provides default colors, or you can define your own array:
                // backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8', '#007bff', '#6f42c1', '#e83e8c'],
                 borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow canvas resizing based on container
            plugins: {
                legend: {
                    position: 'top', // Or 'bottom', 'left', 'right'
                },
                tooltip: {
                    callbacks: {
                         // Format tooltip to show currency and percentage
                         label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed || 0;
                            label += formatCurrency(value); // Add formatted currency

                            // Calculate percentage
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0.0%';
                            label += ` (${percentage})`;

                            return label;
                        }
                    }
                },
                title: { // Optional chart title within the canvas area
                    display: false, // Already have h2 above
                    // text: `Spending Breakdown for ${latestMonth}` // Use variable if needed
                }
            }
        }
    });
    console.log("Rendered new spending chart.");
}

/**
 * Renders the Income vs. Expense bar chart using Chart.js.
 * @param {{labels: Array<string>, incomeData: Array<number>, expenseData: Array<number>}|null} chartData Data object or null.
 */
function renderIncomeExpenseBarChart(chartData) {
    const canvas = incomeExpenseBarChartCanvas;
    const noDataMsg = trendChartNoDataMsg;
    const container = incomeExpenseBarChartArea; // The container div

    if (!canvas || !noDataMsg || !container) {
        console.error("Cannot render trend chart: Required elements not found.");
        return;
    }

    // Hide message, show container by default
    noDataMsg.classList.add('hidden');
    // container.classList.remove('hidden'); // Visibility is controlled by switchChartView now

    // Destroy previous chart instance if it exists
    if (incomeExpenseBarChartInstance) {
        incomeExpenseBarChartInstance.destroy();
        incomeExpenseBarChartInstance = null;
        console.log("Destroyed previous trend chart instance.");
    }

    // Handle case where there is no data
    if (!chartData) {
        console.log("No data to render for trend chart.");
        noDataMsg.classList.remove('hidden'); // Show the 'no data' message
        // Optionally hide the canvas container too if you want it completely gone
        // canvas.style.display = 'none';
        return;
    } else {
        // Ensure canvas is visible if we have data
        // canvas.style.display = 'block';
    }


    const ctx = canvas.getContext('2d');
    incomeExpenseBarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: chartData.incomeData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)', // Greenish
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: chartData.expenseData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)', // Reddish
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        // Optional: Format Y-axis ticks as currency
                        callback: function(value, index, values) {
                            return formatCurrency(value); // Use your existing formatter
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            const value = context.parsed.y || 0;
                            label += formatCurrency(value); // Format tooltip value
                            return label;
                        }
                    }
                },
                title: {
                    display: false, // Already have an h3 above the chart
                    // text: 'Income vs. Expense Trend (Last 12 Months)'
                }
            }
        }
    });
    console.log("Rendered new income/expense trend chart.");
}

// --- Helper Functions --- 
/** Helper to get the appropriate CSS class for currency values. */
function getCurrencyClass(amount, allowPositive = false) {
    const tolerance = 0.005;
    if (amount < -tolerance) return 'negative-currency';
    else if (amount > tolerance && allowPositive) return 'positive-currency';
    else if (amount > tolerance && !allowPositive) return '';
    else return 'zero-currency';
 }
 /** Finds the latest month (YYYY-MM) present in the transaction data. */
 function findLatestMonth(transactions) {
     let latestMonth = null;
     if (!transactions || transactions.length === 0) return null;
     transactions.forEach(tx => {
         if (tx.date && typeof tx.date === 'string' && tx.date.length >= 7) {
             const month = tx.date.substring(0, 7);
             if (/^\d{4}-\d{2}$/.test(month)) {
                 if (latestMonth === null || month > latestMonth) latestMonth = month;
             }
         }
     });
     return latestMonth;
 }
/** Calculates income and net spending for a specific period prefix (YYYY-MM). */
function calculatePeriodSummary(periodPrefix, transactions) {
    let totalIncome = 0.0, totalExpense = 0.0, totalRefund = 0.0;
    if (!periodPrefix || !transactions) return { income: 0.0, spending: 0.0 };
    transactions.forEach(tx => {
        if (tx.date && typeof tx.date === 'string' && tx.date.startsWith(periodPrefix) && tx.type !== 'transfer') {
            try {
                const amount = parseFloat(tx.amount || 0); if (isNaN(amount)) return;
                if (tx.type === 'income') totalIncome += amount;
                else if (tx.type === 'expense') totalExpense += amount;
                else if (tx.type === 'refund') totalRefund += amount;
            } catch (e) { console.error(`Error processing amount for transaction ID ${tx.id || 'N/A'}:`, e); }
        }
    });
    return { income: totalIncome, spending: totalExpense - totalRefund };
}
/**
 * Formats a number to use '.' for thousands separation and ',' for the decimal point,
 * always showing 2 decimal places and using parentheses for negative numbers.
 * Currency symbol is OMITTED.
 * @param {number} amount The number to format.
 * @returns {string} The formatted number string (e.g., "1.234,56" or "(50,00)").
 */
function formatCurrency(amount) {
    // Handle non-numeric or NaN input
    if (typeof amount !== 'number' || isNaN(amount)) {
        return "?.??"; // Return a placeholder for invalid input
    }

    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);

    // 1. Format the number to exactly 2 decimal places using '.' as the initial decimal sep.
    const fixedString = absoluteAmount.toFixed(2);

    // 2. Split the string into integer and decimal parts
    const parts = fixedString.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // 3. Add the thousands separator ('.') to the integer part
    // Use a regular expression for efficient insertion of dots
    // \B matches a non-word boundary (ensures we don't put a dot at the start)
    // (?=(\d{3})+(?!\d)) is a positive lookahead that finds positions followed by
    // one or more groups of 3 digits, but not followed by another digit (end of string or start of decimal).
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // 4. Combine the integer and decimal parts with the desired decimal separator (',')
    const formattedNumber = integerPart + "," + decimalPart;

    // 5. Add parentheses for negative numbers, otherwise return the formatted number
    return isNegative ? `(${formattedNumber})` : formattedNumber;
}

/**
 * Updates a specific status message element and optionally auto-hides success messages.
 *
 * @param {HTMLElement} element The DOM element to update (e.g., addTxStatusDiv).
 * @param {string} message The message text to display.
 * @param {'info'|'success'|'error'} type The type of message (controls styling and auto-hide).
 * @param {number} [autoHideDelay=4000] The delay in milliseconds before hiding success messages.
 */
function updateStatusMessage(element, message, type, autoHideDelay = 4000) {
    if (!element) {
        console.warn("updateStatusMessage called with invalid element for message:", message);
        return;
    }

    // --- Clear any existing timeout for this specific element ---
    const existingTimeoutId = element.dataset.hideTimeoutId;
    if (existingTimeoutId) {
        clearTimeout(parseInt(existingTimeoutId));
        delete element.dataset.hideTimeoutId;
        // console.log(`Cleared existing timeout ${existingTimeoutId} for element`, element.id);
    }

    // --- Set the new message and class ---
    element.textContent = message;
    // Ensure base classes are kept if needed, adjust if your CSS structure requires it
    element.className = `status-${type}`; // Assumes your CSS uses status-info, status-success, status-error directly

    console.log(`Status [${type}] for ${element.id || 'element'}: ${message}`);

    // --- Set a new timeout ONLY for success messages ---
    if (type === 'success' && autoHideDelay > 0) {
        const newTimeoutId = setTimeout(() => {
            // Double-check if the message is still the one we set before clearing
            if (element.textContent === message) {
                element.textContent = ''; // Clear the message
                element.className = ''; // Optionally reset class
                delete element.dataset.hideTimeoutId; // Clean up dataset
                // console.log(`Auto-hid success message for element`, element.id);
            } else {
                // console.log(`Timeout expired but message changed for element`, element.id);
                 delete element.dataset.hideTimeoutId; // Still clean up dataset
            }
        }, autoHideDelay);

        // Store the new timeout ID on the element's dataset
        element.dataset.hideTimeoutId = newTimeoutId;
        // console.log(`Set new timeout ${newTimeoutId} for element`, element.id);
    }
}

/** Updates the main status message area using the centralized handler. */
function updateStatus(message, type = "info") {
    const statusElement = statusMessageDiv; // Target the main status div at the top
    if (!statusElement) {
        console.warn("Main status element (statusMessageDiv) not found for message:", message);
        return;
    }
    // Call the centralized function, which will handle auto-hide for success types
    updateStatusMessage(statusElement, message, type);
}

/** Clears the data display areas. */
function clearDataDisplay() {
    if (balancesList) balancesList.innerHTML = '<li>--</li>';
    if (rtaValueElement) { rtaValueElement.textContent = '--'; rtaValueElement.className = 'summary-value zero-currency'; }
    if (budgetViewRtaValueElement) { 
        budgetViewRtaValueElement.textContent = '--';
        budgetViewRtaValueElement.className = 'summary-value zero-currency';
    }
    if (transactionsTbody) transactionsTbody.innerHTML = '<tr><td colspan="6">No data loaded.</td></tr>';
    if (summaryMonthElement) summaryMonthElement.textContent = '--';
    if (summaryIncomeElement) { summaryIncomeElement.textContent = '--'; summaryIncomeElement.className = ''; }
    if (summarySpendingElement) { summarySpendingElement.textContent = '--'; summarySpendingElement.className = ''; }
    if (budgetTbody) budgetTbody.innerHTML = '<tr><td colspan="5">No data loaded.</td></tr>';
    if (totalBudgetedValueTd) totalBudgetedValueTd.textContent = '--';
    if (totalSpentValueTd) totalSpentValueTd.textContent = '--';
    if (totalAvailableValueTd) totalAvailableValueTd.textContent = '--';
    if (budgetNoDataMsg) budgetNoDataMsg.classList.remove('hidden'); // Show no data msg
    if (chartMonthDisplaySpan) chartMonthDisplaySpan.textContent = '--';
    renderSpendingChart(null); // Clear chart
}


// --- UI Update Functions ---

/** Displays the account balances in the list. */
function displayAccountBalances(accounts) {
    if (!balancesList) return;
    balancesList.innerHTML = ''; // Clear previous balances
    const accountNames = Object.keys(accounts || {}).sort();
    if (accountNames.length === 0) {
        balancesList.innerHTML = '<li>No accounts found.</li>';
        return;
    }
    accountNames.forEach(accountName => {
        const balance = accounts[accountName];
        const li = document.createElement('li');
        const nameSpan = document.createElement('span'); nameSpan.textContent = `${accountName}: `;
        const balanceSpan = document.createElement('span');
        balanceSpan.textContent = formatCurrency(balance);
        balanceSpan.className = `currency ${getCurrencyClass(balance, true)}`; // Allow positive green here
        li.appendChild(nameSpan); li.appendChild(balanceSpan);
        balancesList.appendChild(li);
    });
}

/** Displays the calculated dashboard summary for the latest month. */
function displayDashboardSummary(summaryData) {
    if (!summaryMonthElement || !summaryIncomeElement || !summarySpendingElement) return;
    const month = summaryData?.latestMonth || 'N/A';
    const income = summaryData?.income || 0;
    const spending = summaryData?.spending || 0;
    summaryMonthElement.textContent = month;
    summaryIncomeElement.textContent = formatCurrency(income);
    summaryIncomeElement.className = `currency ${getCurrencyClass(income, true)}`;
    summarySpendingElement.textContent = formatCurrency(spending);
    summarySpendingElement.className = `currency ${spending > 0 ? 'negative-currency' : (spending < 0 ? 'positive-currency' : 'zero-currency')}`;
}

/** Displays the Ready to Assign value. */
function displayRTA(rta = 0.0) {
    const formattedRTA = formatCurrency(rta);
    const rtaClass = `summary-value currency ${getCurrencyClass(rta, true)}`; // Allow positive green

    // Update original dashboard RTA (will only be visible if dashboard section is shown)
    if (rtaValueElement) {
        rtaValueElement.textContent = formattedRTA;
        rtaValueElement.className = rtaClass;
    }

    // Update budget view RTA (will only be visible if budget view section is shown)
    if (budgetViewRtaValueElement) {
        budgetViewRtaValueElement.textContent = formattedRTA;
        budgetViewRtaValueElement.className = rtaClass;
    }
}

/**
 * Displays transactions in the table 
 * @param {Array} displayTransactions Transactions to display 
 */
function displayTransactions(displayTransactions = []) {
    if (!transactionsTbody) return;
    transactionsTbody.innerHTML = '';

    let combinedForSort = displayTransactions.map(tx => ({
        ...tx,
        db_id: tx.id // This 'id' comes from the main transaction store's keyPath
    }));

    if (combinedForSort.length === 0) {
        transactionsTbody.innerHTML = `<tr><td colspan="7">No transactions found.</td></tr>`;
        if (noResultsMessage) noResultsMessage.classList.add('hidden');
        return;
    }

     const sortedTransactions = combinedForSort.sort((a, b) => {
         const dateA = a.date || '0000-00-00';
         const dateB = b.date || '0000-00-00';
         if (dateB !== dateA) return dateB.localeCompare(dateA);
         const idA = a.db_id || 0;
         const idB = b.db_id || 0;
         if (typeof idA === 'number' && typeof idB === 'number') {
            return idB - idA;
         }
        return String(idB).localeCompare(String(idA));
     });

     sortedTransactions.forEach(tx => {
        const row = transactionsTbody.insertRow();
        const transactionDbId = tx.db_id;
        const txType = tx.type || 'unknown'; // Use txType variable consistently
        const isTransfer = txType === 'transfer';

        // Store data attributes
        const txDate = tx.date || '';
        const fromAccount = tx.account || ''; // Account is always 'From'
        const toAccountOrPayee = tx.payee || ''; // Payee holds 'To' account for transfers
        const txCategory = isTransfer ? null : (tx.category || UNCATEGORIZED);
        const txMemo = tx.memo || '';

        row.dataset.date = txDate;
        row.dataset.account = fromAccount; // Store 'from' account
        row.dataset.category = txCategory || '';
        // Store payee/toAccount differently? Maybe store both if needed for filtering?
        row.dataset.payee = isTransfer ? `Transfer to: ${toAccountOrPayee}` : toAccountOrPayee;
        row.dataset.memo = txMemo;
        row.dataset.dbId = transactionDbId;
        row.dataset.type = txType; // Store type for potential filtering

        // Populate Cells (with icon)
        const cellIcon = row.insertCell(0); cellIcon.classList.add('td-icon');
        const icon = document.createElement('i');
        icon.classList.add('fa-solid');
        let iconClass = 'fa-question-circle';
        let iconTitle = txType.charAt(0).toUpperCase() + txType.slice(1);
        let iconColor = '#6c757d'; // Default grey

        switch (txType) {
            case 'income': iconClass = 'fa-arrow-down'; iconColor = '#28a745'; break;
            case 'expense': iconClass = 'fa-arrow-up'; iconColor = '#dc3545'; break;
            case 'refund': iconClass = 'fa-rotate-left'; iconColor = '#17a2b8'; break;
            case 'transfer': iconClass = 'fa-exchange-alt'; iconColor = '#007bff'; break; // Use a different color (e.g., blue) for transfers
        }
        icon.classList.add(iconClass);
        icon.style.color = iconColor;
        icon.title = iconTitle;
        icon.setAttribute('aria-label', iconTitle);
        cellIcon.appendChild(icon);

        const cellDate = row.insertCell(1); cellDate.textContent = txDate || 'N/A';
        const cellAccount = row.insertCell(2); cellAccount.textContent = fromAccount; // Always show 'From' account
        const cellPayee = row.insertCell(3);
        // Display "Transfer to: [Account]" for transfers, otherwise payee/memo
        cellPayee.textContent = isTransfer ? `Transfer to: ${toAccountOrPayee}` : (toAccountOrPayee || txMemo || 'N/A');
        if (isTransfer) cellPayee.style.fontStyle = 'italic';

        const cellCategory = row.insertCell(4); cellCategory.textContent = isTransfer ? '-' : (txCategory || '-'); // Show dash for transfers
        const cellAmount = row.insertCell(5); cellAmount.textContent = formatCurrency(tx.amount || 0);
        cellAmount.style.textAlign = 'right'; cellAmount.style.fontFamily = 'monospace';

        // Assign currency class based on type
        let amountClass = 'zero-currency'; // Default to neutral
        switch(txType) {
             case 'income': amountClass = 'positive-currency'; break;
             case 'expense': amountClass = 'negative-currency'; break;
             case 'refund': amountClass = 'positive-currency'; break; // Treat refund amount display like income
             // Keep transfer as neutral/zero
         }
        cellAmount.classList.add(amountClass);

         // --- DELETE BUTTON CELL ---
        const cellAction = row.insertCell(6);
        cellAction.classList.add('td-action');
        if (transactionDbId !== null) {
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-tx-button');
            deleteButton.setAttribute('aria-label', 'Delete Transaction');
            deleteButton.title = 'Delete Transaction';
            deleteButton.dataset.txId = transactionDbId;

            const deleteIcon = document.createElement('i');
            deleteIcon.classList.add('fa-solid', 'fa-trash-can');
            deleteButton.appendChild(deleteIcon);

            deleteButton.addEventListener('click', handleDeleteTransactionClick);

            cellAction.appendChild(deleteButton);
        }
        // --- END OF DELETE BUTTON CELL ---
    });

    if (noResultsMessage) noResultsMessage.classList.add('hidden');
}

/**
 * Populates account filter dropdown(s).
 * @param {object} accounts Accounts object { accountName: balance }.
 * @param {Array<HTMLSelectElement>} selectElements Array of select elements to populate.
 */
function populateAccountFilter(accounts, selectElements = []) {
    if (!accounts) return;
    const accountNames = Object.keys(accounts).sort();
    selectElements.forEach(select => {
        if (!select) return;
        const firstOptionText = select.options.length > 0 ? select.options[0].text : "";
        select.length = 0;
        if(firstOptionText.toLowerCase().includes("all") || firstOptionText.toLowerCase().includes("select")){
            select.add(new Option(firstOptionText, ""));
        }
        accountNames.forEach(name => select.add(new Option(name, name)));
    });
}

/**
 * Populates category filter dropdown(s). Filters out internal/archived for the add form.
 * @param {Array} categories Base categories array.
 * @param {Array} transactions Transactions list (to find implicit categories).
 * @param {Array<HTMLSelectElement>} selectElements Array of select elements to populate.
 * @param {object} groupsData Category groups mapping { "Category": "Group Name" }.
 * @param {string} mode Current app mode.
 */
function populateCategoryFilter(categories = [], transactions = [], selectElements = [], groupsData = {}) {
    const categorySet = new Set(categories);
    transactions.forEach(tx => {
        if (tx.category && tx.type !== 'transfer') categorySet.add(tx.category);
        else if (!tx.category && tx.type !== 'transfer') categorySet.add(UNCATEGORIZED);
    });
    categorySet.delete(UNKNOWN_INCOME_SOURCE); // Remove internal

    let allSortedCategories = Array.from(categorySet).sort();

    selectElements.forEach(select => {
        if (!select) return;
        const firstOptionText = select.options.length > 0 ? select.options[0].text : "";
        select.length = 0;
        if(firstOptionText.toLowerCase().includes("all") || firstOptionText.toLowerCase().includes("select")){
             select.add(new Option(firstOptionText, ""));
        }

        let categoriesForThisSelect = allSortedCategories;

        // Filter for the ADD form dropdown (exclude certain groups)
        if (select.id === 'tx-category') {
            categoriesForThisSelect = allSortedCategories.filter(cat =>
                groupsData[cat] !== SAVINGS_GROUP_NAME &&
                groupsData[cat] !== ARCHIVED_GROUP_NAME
            );
        }

        categoriesForThisSelect.forEach(name => {
            if (name) select.add(new Option(name, name));
        });
    // --- After initial population, specifically update the Add Form dropdown based on its default type ---
     if (txCategorySelect && txTypeSelect) {
        updateCategoryDropdownForTxType(txTypeSelect.value); // Call the dynamic update function
    }
    });
}

/**
 * Dynamically updates the category dropdown in the Add Transaction form
 * based on the selected transaction type 
 * @param {string} selectedType The value from the tx-type select ('income', 'expense', 'refund').
 */
function updateCategoryDropdownForTxType(selectedType) {
    if (selectedType === 'transfer' || !txCategorySelect) {
        return; // Do nothing if it's a transfer or element missing
    }

    const data = localBudgetData; 

    if (!data || !data.categories || !data.category_groups) {
        console.warn("Cannot update category dropdown: Missing category data.");
        txCategorySelect.innerHTML = '<option value="">-- No Categories Loaded --</option>';
        return;
    }

    const allCategories = data.categories || [];
    const groupsData = data.category_groups || {};
    let filteredCategories = [];

    // Filter categories based on the selected transaction type
    if (selectedType === 'income') {
        // Show ONLY categories assigned to the INCOME group
        filteredCategories = allCategories.filter(cat => groupsData[cat] === INCOME_GROUP_NAME);
    } else { // For 'expense' and 'refund'
        // Show categories NOT assigned to INCOME, SAVINGS, or ARCHIVED groups
        filteredCategories = allCategories.filter(cat => {
            const group = groupsData[cat];
            return group !== INCOME_GROUP_NAME &&
                   group !== SAVINGS_GROUP_NAME &&
                   group !== ARCHIVED_GROUP_NAME;
        });
    }

    // Sort the filtered categories
    filteredCategories.sort();

    // Remember the currently selected value, if any
    const previouslySelectedValue = txCategorySelect.value;

    // Clear existing options
    txCategorySelect.innerHTML = '';

    // Add the default "-- Select Category --" option
    txCategorySelect.add(new Option('-- Select Category --', ''));

    // Add the filtered options
    filteredCategories.forEach(name => {
        if (name) {
            const option = new Option(name, name);
            txCategorySelect.add(option);
        }
    });

    // Try to re-select the previous value if it still exists in the new list
    if (filteredCategories.includes(previouslySelectedValue)) {
        txCategorySelect.value = previouslySelectedValue;
    } else {
        txCategorySelect.value = ''; // Reset selection if previous value is no longer valid
    }

    console.log(`Category dropdown updated for type: ${selectedType}`);
}

// --- Transaction Deletion Handler ---
async function handleDeleteTransactionClick(event) {
    const button = event.currentTarget;
    const transactionId = button.dataset.txId;

    if (!transactionId) {
        console.error("Delete button clicked but no transaction ID found.");
        updateStatusMessage(statusMessageDiv, "Error: Could not identify transaction to delete.", "error");
        return;
    }

    if (!confirm(`Are you sure you want to delete this transaction? This action cannot be undone.`)) {
        return; // User cancelled
    }

    button.disabled = true;
    const icon = button.querySelector('i');
    if (icon) { icon.classList.replace('fa-trash-can', 'fa-spinner'); icon.classList.add('fa-spin'); }

    try {
        // Always delete from standalone store
        console.log(`Attempting to delete standalone transaction ID: ${transactionId}`);
        await deleteTransactionStandalone(parseInt(transactionId, 10)); // Assume ID is numeric key
        updateStatusMessage(statusMessageDiv, "Transaction deleted successfully.", "success");

    } catch (error) {
        console.error("Failed to delete transaction:", error);
        updateStatusMessage(statusMessageDiv, `Error deleting transaction: ${error}`, "error");
        button.disabled = false; // Re-enable button on error
         if (icon) { icon.classList.replace('fa-spinner', 'fa-trash-can'); icon.classList.remove('fa-spin'); }
    }
}

// --- IndexedDB Interaction Functions ---
/**
 * Checks if the core budget data structures appear empty.
 * @param {object} data 
 * @returns {boolean} 
 */
function isDataEmpty(data) {
    if (!data) return true;
    const accountsEmpty = !data.accounts || Object.keys(data.accounts).length === 0;
    const categoriesEmpty = !data.categories || data.categories.length === 0;
    return accountsEmpty && categoriesEmpty;
}
/**
 * Adds default account and categories to an empty database.
 * @returns {Promise<void>}
 */
function seedInitialData() {
    console.log("Database appears empty. Seeding initial data...");
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized for seeding.");

        const storeNames = [
            ACCOUNT_STORE_NAME, CATEGORY_STORE_NAME, GROUP_STORE_NAME, METADATA_STORE_NAME
        ];
        const transaction = db.transaction(storeNames, 'readwrite');
        const stores = {
            acc: transaction.objectStore(ACCOUNT_STORE_NAME),
            cat: transaction.objectStore(CATEGORY_STORE_NAME),
            grp: transaction.objectStore(GROUP_STORE_NAME),
            meta: transaction.objectStore(METADATA_STORE_NAME)
        };

        let errorOccurred = false;
        let writeErrors = [];

        try {
            // --- Seed Data Definitions ---
            const defaultAccount = { name: 'Cash', balance: 0.0, type: 'cash' };
            const defaultCategories = [
                { name: 'Salary', group: 'Income' },
                { name: 'Groceries', group: 'Expenses' },
                { name: 'Dining Out', group: 'Expenses' },
                { name: 'Shopping', group: 'Expenses' },
                { name: 'Rent/Mortgage', group: 'Bills' },
                { name: 'Subscriptions', group: 'Bills' },
                { name: 'Utilities', group: 'Bills' },
                { name: 'Transport', group: 'Expenses' },
                { name: UNCATEGORIZED, group: 'Expenses' } // Ensure Uncategorized exists
            ];
            const defaultMetadata = { key: 'appData', ready_to_assign: 0.0 }; // RTA starts at 0

            // 1. Write Account
            console.log("Seeding Account:", defaultAccount.name);
            const accReq = stores.acc.put(defaultAccount);
            accReq.onerror = (e) => { errorOccurred = true; writeErrors.push(`Account: ${e.target.error}`); console.error("Seed Acc Error:", e.target.error); };

            // 2. Write Categories & Groups
            for (const catData of defaultCategories) {
                console.log(`Seeding Category: ${catData.name}, Group: ${catData.group}`);
                // Write Category Name
                const catReq = stores.cat.put({ name: catData.name });
                catReq.onerror = (e) => { errorOccurred = true; writeErrors.push(`Category '${catData.name}': ${e.target.error}`); console.error("Seed Cat Error:", e.target.error);};

                // Write Group Mapping
                const grpReq = stores.grp.put({ categoryName: catData.name, groupName: catData.group });
                grpReq.onerror = (e) => { errorOccurred = true; writeErrors.push(`GroupMap '${catData.name}': ${e.target.error}`); console.error("Seed Grp Error:", e.target.error);};
            }

            // 3. Write Metadata (RTA)
            console.log("Seeding Metadata (RTA=0)");
            const metaReq = stores.meta.put(defaultMetadata);
            metaReq.onerror = (e) => { errorOccurred = true; writeErrors.push(`Metadata: ${e.target.error}`); console.error("Seed Meta Error:", e.target.error);};

        } catch (seedError) {
            console.error("Error during seed data preparation:", seedError);
            errorOccurred = true;
            writeErrors.push(`Preparation error: ${seedError.message}`);
            transaction.abort(); // Abort if preparation fails
            return reject(`Error preparing seed data: ${seedError.message}`);
        }

        // Transaction completion handling
        transaction.oncomplete = () => {
            if (errorOccurred) {
                console.error("Seed data transaction completed, but errors occurred:", writeErrors);
                reject(`Seeding completed with errors: ${writeErrors.join("; ")}`);
            } else {
                console.log("Initial data seeded successfully.");
                resolve();
            }
        };

        transaction.onerror = (event) => {
            console.error("Seed data transaction failed:", event.target.error);
            reject(`Database transaction failed during seeding: ${event.target.error}`);
        };
    });
}

/** Loads all budget data from IndexedDB stores. */
async function loadDataFromDB() {
    console.log("Attempting to load data from IndexedDB...");
    if (!db) {
        console.error("DB not available for loading.");
        updateStatus("Error: Cannot load data, database unavailable.", "error");
        processBudgetData(null); // Process null to show 'no data' state
        return; 
    }
 
    const transaction = db.transaction([
        TX_STORE_NAME, ACCOUNT_STORE_NAME, CATEGORY_STORE_NAME,
        GROUP_STORE_NAME, BUDGET_PERIOD_STORE_NAME, METADATA_STORE_NAME
    ], 'readonly');
 
    const stores = {
        tx: transaction.objectStore(TX_STORE_NAME),
        acc: transaction.objectStore(ACCOUNT_STORE_NAME),
        cat: transaction.objectStore(CATEGORY_STORE_NAME),
        grp: transaction.objectStore(GROUP_STORE_NAME),
        bp: transaction.objectStore(BUDGET_PERIOD_STORE_NAME),
        meta: transaction.objectStore(METADATA_STORE_NAME),
    };
 
    const requests = {
        transactions: stores.tx.getAll(),
        accounts: stores.acc.getAll(),
        categories: stores.cat.getAll(),
        groups: stores.grp.getAll(),
        periods: stores.bp.getAll(),
        metadata: stores.meta.get('appData') 
    };
 
    try {
        const results = await new Promise((resolve, reject) => {
            let res = {};
            let completed = 0;
            const totalRequests = Object.keys(requests).length;
 
            Object.entries(requests).forEach(([key, req]) => {
                req.onsuccess = (event) => {
                    res[key] = event.target.result;
                    completed++;
                    if (completed === totalRequests) {
                        resolve(res); // Resolve with the results object
                    }
                };
                req.onerror = (event) => {
                    console.error(`Error loading from ${key} store:`, event.target.error);
                     completed++; // Still count as completed to avoid hanging
                     if (completed === totalRequests) {
                         resolve(res); // Resolve even if some parts failed
                     }
                };
            });
 
             transaction.oncomplete = () => {
                 console.log("Read transaction from IndexedDB complete.");
             };
             transaction.onerror = (event) => {
                 // This might fire if the transaction is aborted due to an error above
                 console.error("Read transaction error:", event.target.error);
                 // Reject the promise if the transaction itself fails fundamentally
                 reject(new Error(`Database read transaction failed: ${event.target.error}`));
             };
        }); // End Promise
 
        const loadedData = {
            transactions: results.transactions || [],
            accounts: (results.accounts || []).reduce((acc, item) => { acc[item.name] = item.balance; return acc; }, {}),
            categories: (results.categories || []).map(item => item.name),
            category_groups: (results.groups || []).reduce((acc, item) => { acc[item.categoryName] = item.groupName; return acc; }, {}),
            budget_periods: (results.periods || []).reduce((acc, item) => { acc[item.period] = item.budget; return acc; }, {}),
            ready_to_assign: results.metadata?.ready_to_assign || 0.0
        };
        console.log("Loaded data from IndexedDB:", loadedData);
 
        if (isDataEmpty(loadedData)) {
            try {
                await seedInitialData();
                // IMPORTANT: Reload data AFTER seeding is complete
                console.log("Seeding complete, reloading data...");
                await loadDataFromDB(); // Recursive call to reload the newly seeded data
                return; // Exit this execution context as the recursive call handles the rest
            } catch (seedError) {
                console.error("Failed to seed initial data:", seedError);
                updateStatus("Error: Could not set up initial data.", "error");
                processBudgetData(loadedData);
            }
        } else {
            // Process the loaded data if it wasn't empty
            processBudgetData(loadedData);
        }
 
    } catch (loadError) {
        console.error("Failed to load data from IndexedDB:", loadError);
        updateStatus(`Error loading data: ${loadError.message}`, "error");
        processBudgetData(null); // Show empty state on significant loading error
    }
 } 

/** Saves a transaction (expense, income, refund, or transfer) and updates state */
async function saveTransactionStandalone(transaction) {
    updateStatusMessage(addTxStatusDiv, "Adding transaction to database...", "info"); // Update status specifically for this operation

    return new Promise(async (resolve, reject) => {
        if (!db) {
            console.error("saveTransactionStandalone: Database not initialized.");
            return reject("Database not initialized.");
        }

        // Remove temporary pending status if present (though likely not used here)
        delete transaction.status;
        transaction.entry_timestamp = new Date().toISOString(); // Add timestamp

        const isTransfer = transaction.type === 'transfer';
        // Determine required stores: Transfers don't need METADATA
        const storeNames = isTransfer
            ? [TX_STORE_NAME, ACCOUNT_STORE_NAME]
            : [TX_STORE_NAME, ACCOUNT_STORE_NAME, METADATA_STORE_NAME];

        let tx; // Declare transaction variable outside try block
        try {
             tx = db.transaction(storeNames, 'readwrite');
        } catch (dbError) {
             console.error("saveTransactionStandalone: Failed to start DB transaction.", dbError);
             return reject(`Database transaction error: ${dbError.message}`);
        }

        const txStore = tx.objectStore(TX_STORE_NAME);
        const accStore = tx.objectStore(ACCOUNT_STORE_NAME);
        // Only get metaStore if needed (not a transfer)
        const metaStore = !isTransfer ? tx.objectStore(METADATA_STORE_NAME) : null;

        const amount = parseFloat(transaction.amount || 0);
        const fromAccountName = transaction.account;
        // Payee holds the 'to' account name *only* for transfers
        const toAccountName = isTransfer ? transaction.payee : null;

        // --- Add the transaction record first ---
        const addRequest = txStore.add(transaction);

        addRequest.onerror = (event) => {
            console.error("Error adding transaction record:", event.target.error); 
            tx.abort(); // Abort the transaction
            reject(`Error saving transaction record: ${event.target.error}`);
        };

        addRequest.onsuccess = async (event) => {
            const newTxId = event.target.result;

            try {
                if (isTransfer) {
                    // --- Transfer Logic ---
                    // 1. Decrease balance of 'From' account
                    const fromAccData = await getAccountData(accStore, fromAccountName);
                    if (!fromAccData) throw new Error(`Source account '${fromAccountName}' not found.`);
                    fromAccData.balance -= amount;
                    await putAccountData(accStore, fromAccData);

                    // 2. Increase balance of 'To' account
                    const toAccData = await getAccountData(accStore, toAccountName);
                    if (!toAccData) throw new Error(`Destination account '${toAccountName}' not found.`);
                    toAccData.balance += amount;
                    await putAccountData(accStore, toAccData);
                } else {
                    // --- Expense/Income/Refund Logic ---
                    const accountData = await getAccountData(accStore, fromAccountName);
                    if (!accountData) {
                         console.warn(` -> Account '${fromAccountName}' not found for balance update. Balance may be incorrect.`);
                         // Decide if RTA update should still happen? For income, probably yes.
                    } else {
                         // Update balance based on type
                         const originalBalance = accountData.balance;
                         if (transaction.type === 'income' || transaction.type === 'refund') {
                             accountData.balance += amount;
                         } else if (transaction.type === 'expense') {
                             accountData.balance -= amount;
                         }
                         await putAccountData(accStore, accountData);
                    }

                    // Update RTA if income
                    if (transaction.type === 'income') {
                         if (!metaStore) throw new Error("Metadata store not available for RTA update."); // Safety check
                         const metadata = await getMetadata(metaStore);
                         const originalRTA = metadata.ready_to_assign;
                         metadata.ready_to_assign += amount;
                         await putMetadata(metaStore, metadata);
                    }
                }
                // If all updates succeed, the transaction will complete below.

            } catch (updateError) {
                console.error("Error during account/RTA update:", updateError); // Log 8: Update Error
                tx.abort(); // Abort transaction on error during updates
                // Reject the main promise here, as oncomplete won't fire after abort
                reject(`Failed during balance/RTA update: ${updateError.message}`);
                return; // Prevent further execution in this path
            }
        }; // End addRequest.onsuccess

        tx.oncomplete = () => {
            // Update status and reset form ONLY on successful completion
            updateStatusMessage(addTxStatusDiv, "Transaction added successfully.", "success");
            if (newTxForm) {
                newTxForm.reset();
                if(txDateInput) txDateInput.valueAsDate = new Date();
                // Reset form UI state based on the type that was just added
                if(txTypeSelect) updateAddFormForTxType(txTypeSelect.value);
            }
            // Reload data to reflect changes AFTER success
            loadDataFromDB().catch(console.error);
            resolve(); // Resolve the main promise
        };

        tx.onerror = (event) => {
            // This catches errors from the transaction itself (e.g., if aborted by an earlier error)
            console.error("Save transaction DB transaction error:", event.target.error); // Log 10: Transaction Error
            // Update status to show failure
            updateStatusMessage(addTxStatusDiv, `Error saving transaction: ${event.target.error || 'Unknown DB error'}`, "error");
            // Reject the main promise - it might have been rejected already by updateError, but this is a fallback
            reject(`Database Transaction failed: ${event.target.error || 'Unknown reason'}`);
        };
    }); // End Promise
}

// --- Helper functions for DB operations within saveTransactionStandalone ---
function getAccountData(store, accountName) {
    return new Promise((resolve, reject) => {
        if (!accountName) return reject("Account name is missing for getAccountData"); // Added check
        const req = store.get(accountName);
        req.onsuccess = (e) => resolve(e.target.result); // Can be undefined if not found, handled by caller
        req.onerror = (e) => {
            console.error(`Error getting account ${accountName}:`, e.target.error);
            reject(new Error(`DB error getting account ${accountName}: ${e.target.error}`));
        };
    });
}

function putAccountData(store, accountData) {
    return new Promise((resolve, reject) => {
         if (!accountData || !accountData.name) return reject("Invalid account data for putAccountData"); // Added check
        const req = store.put(accountData);
        req.onsuccess = () => resolve();
        req.onerror = (e) => {
             console.error(`Error putting account ${accountData?.name}:`, e.target.error);
             reject(new Error(`DB error putting account ${accountData.name}: ${e.target.error}`));
        };
    });
}

function getMetadata(store) {
    return new Promise((resolve, reject) => {
       const req = store.get('appData');
       req.onsuccess = (e) => resolve(e.target.result || { key: 'appData', ready_to_assign: 0.0 }); // Return default if not found
       req.onerror = (e) => {
           console.error("Error getting metadata:", e.target.error);
           reject(new Error(`DB error getting metadata: ${e.target.error}`));
       };
   });
}

function putMetadata(store, metadata) {
    return new Promise((resolve, reject) => {
       if (!metadata || metadata.key !== 'appData') return reject("Invalid metadata for putMetadata"); // Added check
       const req = store.put(metadata);
       req.onsuccess = () => resolve();
       req.onerror = (e) => {
            console.error("Error putting metadata:", e.target.error);
            reject(new Error(`DB error putting metadata: ${e.target.error}`));
       };
   });
}

/** Exports all data from IndexedDB */
async function handleExportStandaloneData() {
    console.warn("Standalone export ");
    if (exportStandaloneStatusDiv) {
        updateStatusMessage(exportStandaloneStatusDiv, "Exporting all local data...", "info");
    }

    // 1. Read ALL data from ALL relevant stores (similar to loadDataFromDB)
    // 2. Format into the standard budget_data.json structure
    // 3. Trigger download

    try {
         // Reuse loading logic but capture the data directly
        const transaction = db.transaction([
            TX_STORE_NAME, ACCOUNT_STORE_NAME, CATEGORY_STORE_NAME,
            GROUP_STORE_NAME, BUDGET_PERIOD_STORE_NAME, METADATA_STORE_NAME
        ], 'readonly');
        // ... (get stores and requests as in loadDataFromDB) ...
         const stores = { tx: transaction.objectStore(TX_STORE_NAME), acc: transaction.objectStore(ACCOUNT_STORE_NAME), cat: transaction.objectStore(CATEGORY_STORE_NAME), grp: transaction.objectStore(GROUP_STORE_NAME), bp: transaction.objectStore(BUDGET_PERIOD_STORE_NAME), meta: transaction.objectStore(METADATA_STORE_NAME) };
         const requests = { transactions: stores.tx.getAll(), accounts: stores.acc.getAll(), categories: stores.cat.getAll(), groups: stores.grp.getAll(), periods: stores.bp.getAll(), metadata: stores.meta.get('appData') };

        const results = await new Promise((resolve, reject) => {
             let res = {}; let completed = 0; const totalRequests = Object.keys(requests).length;
             Object.entries(requests).forEach(([key, req]) => {
                 req.onsuccess = (event) => { res[key] = event.target.result; completed++; if (completed === totalRequests) resolve(res); };
                 req.onerror = (event) => { console.error(`Error loading ${key} for export:`, event.target.error); reject(`Error loading ${key}`); transaction.abort(); };
             });
             transaction.oncomplete = () => console.log("Read complete for standalone export.");
             transaction.onerror = (event) => reject("Read transaction error during export: " + event.target.error);
         });

        // Format results
        const exportData = {
            transactions: (results.transactions || []).map(tx => { // Ensure IDs are strings if needed, clean up internal fields
                const { entry_timestamp, ...rest } = tx; // Remove internal timestamp
                return { ...rest, id: String(rest.id) }; // Ensure ID is string-like if exporting for external use
            }),
            accounts: (results.accounts || []).reduce((acc, item) => { acc[item.name] = item.balance; return acc; }, {}),
            categories: (results.categories || []).map(item => item.name),
            category_groups: (results.groups || []).reduce((acc, item) => { acc[item.categoryName] = item.groupName; return acc; }, {}),
            budget_periods: (results.periods || []).reduce((acc, item) => { acc[item.period] = item.budget; return acc; }, {}),
            ready_to_assign: results.metadata?.ready_to_assign || 0.0,
            // Add metadata like export timestamp
            _export_metadata: {
                 mode: "standalone",
                 timestamp: new Date().toISOString()
            }
        };

        // Trigger download (reuse existing logic)
         const jsonDataString = JSON.stringify(exportData, null, 4);
         const blob = new Blob([jsonDataString], { type: 'application/json' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `budget_data_standalone_${new Date().toISOString().slice(0, 10)}.json`;
         document.body.appendChild(a); a.click(); document.body.removeChild(a);
         URL.revokeObjectURL(url);

         if (exportStandaloneStatusDiv) {
            updateStatusMessage(exportStandaloneStatusDiv, "Data exported successfully.", "success");
         }

    } catch (error) {
         console.error("Standalone export failed:", error);
         if (exportStandaloneStatusDiv) {
             updateStatusMessage(exportStandaloneStatusDiv, `Export failed: ${error}`, "error");
         }
    }
}

/** Clears ALL budget data from IndexedDB */
async function clearAllStandaloneData() {
    console.warn("Clearing ALL standalone data from IndexedDB...");
    if (!db) {
        console.error("DB not available for clearing.");
        return Promise.reject("Database unavailable");
    }
    const storeNames = [
        TX_STORE_NAME, ACCOUNT_STORE_NAME, CATEGORY_STORE_NAME,
        GROUP_STORE_NAME, BUDGET_PERIOD_STORE_NAME, METADATA_STORE_NAME
    ];
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeNames, 'readwrite');
        let completed = 0;

        storeNames.forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
                const request = transaction.objectStore(storeName).clear();
                request.onsuccess = () => {
                    console.log(`Cleared store: ${storeName}`);
                    completed++;
                     if (completed === storeNames.length) {
                         // Resolve might happen before transaction.oncomplete
                     }
                };
                request.onerror = (event) => {
                    console.error(`Error clearing store ${storeName}:`, event.target.error);
                    // Don't reject immediately, try to clear others, but log error
                };
            } else {
                 console.warn(`Store ${storeName} not found for clearing.`);
                 completed++; // Count as completed
                  if (completed === storeNames.length) {
                      // Resolve might happen before transaction.oncomplete
                  }
            }
        });

        transaction.oncomplete = () => {
            localBudgetData = null; // Clear in-memory data too
            resolve();
        };
        transaction.onerror = (event) => {
            console.error("Standalone data clearing transaction error:", event.target.error);
            reject("Failed to clear all standalone data.");
        };
    });
}

// --- Delete Transaction ---
/**
 * Deletes a transaction and adjusts balances/RTA accordingly. NOW HANDLES TRANSFERS.
 * Reloads all data afterwards to refresh the UI.
 * @param {number} transactionId The ID (keyPath value) of the transaction to delete.
 * @returns {Promise<void>}
 */
function deleteTransactionStandalone(transactionId) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized.");
        if (typeof transactionId !== 'number' || isNaN(transactionId)) {
            return reject("Invalid ID provided for standalone deletion.");
        }

        // Determine necessary stores based on potential transaction type
        const storeNames = [TX_STORE_NAME, ACCOUNT_STORE_NAME, METADATA_STORE_NAME];
        const transaction = db.transaction(storeNames, 'readwrite');
        const txStore = transaction.objectStore(TX_STORE_NAME);
        const accStore = transaction.objectStore(ACCOUNT_STORE_NAME);
        const metaStore = transaction.objectStore(METADATA_STORE_NAME);

        let deletedTxData = null;

        // 1. Get the transaction data BEFORE deleting it
        const getReq = txStore.get(transactionId);
        getReq.onerror = (event) => reject(`Could not find transaction to delete: ${event.target.error}`);
        getReq.onsuccess = async (event) => {
            deletedTxData = event.target.result;
            if (!deletedTxData) return reject(`Transaction with ID ${transactionId} not found.`);

            // 2. Delete the transaction record
            const deleteReq = txStore.delete(transactionId);
            deleteReq.onerror = (event) => reject(`Failed to delete transaction record: ${event.target.error}`);
            deleteReq.onsuccess = async () => {
                console.log(`Transaction record ID ${transactionId} deleted.`);

                // 3. Adjust Balances / RTA based on type
                const amount = parseFloat(deletedTxData.amount || 0);
                const txType = deletedTxData.type;
                const fromAccountName = deletedTxData.account;
                const toAccountName = (txType === 'transfer') ? deletedTxData.payee : null; // Payee holds 'To' account for transfers

                try {
                    if (txType === 'transfer') {
                        // --- Reverse Transfer ---
                        console.log(`Reversing transfer ${transactionId}: ${amount} from ${fromAccountName} to ${toAccountName}`);
                        // Add amount back to 'From' account
                        if (fromAccountName) {
                            const fromAccData = await getAccountData(accStore, fromAccountName);
                            if (fromAccData) {
                                fromAccData.balance += amount;
                                await putAccountData(accStore, fromAccData);
                                console.log(` -> Added ${amount} back to ${fromAccountName}`);
                            } else console.warn(`'From' account ${fromAccountName} not found for reversal.`);
                        }
                        // Subtract amount from 'To' account
                        if (toAccountName) {
                            const toAccData = await getAccountData(accStore, toAccountName);
                            if (toAccData) {
                                toAccData.balance -= amount;
                                await putAccountData(accStore, toAccData);
                                console.log(` -> Subtracted ${amount} from ${toAccountName}`);
                            } else console.warn(`'To' account ${toAccountName} not found for reversal.`);
                        }
                        // No RTA adjustment

                    } else {
                        // --- Reverse Expense/Income/Refund ---
                        console.log(`Reversing ${txType} ${transactionId}: ${amount} for account ${fromAccountName}`);
                        // Adjust 'From' account balance
                        if (fromAccountName) {
                            const accountData = await getAccountData(accStore, fromAccountName);
                            if (accountData) {
                                // REVERSE the original effect
                                if (txType === 'income' || txType === 'refund') {
                                    accountData.balance -= amount;
                                } else if (txType === 'expense') {
                                    accountData.balance += amount;
                                }
                                await putAccountData(accStore, accountData);
                                console.log(` -> Adjusted balance for ${fromAccountName}`);
                            } else console.warn(`Account ${fromAccountName} not found for reversal.`);
                        }

                        // Adjust RTA if it was Income
                        if (txType === 'income') {
                            const metadata = await getMetadata(metaStore);
                            metadata.ready_to_assign -= amount; // Subtract the income amount
                            await putMetadata(metaStore, metadata);
                        }
                    }
                    // Transaction completes below if no errors here

                } catch (adjustmentError) {
                    console.error("Error during balance/RTA adjustment:", adjustmentError);
                    transaction.abort(); // Abort on adjustment failure
                    reject(`Failed during balance/RTA adjustment: ${adjustmentError.message}`);
                }
            }; // end deleteReq.onsuccess
        }; // end getReq.onsuccess

        transaction.oncomplete = async () => {
            console.log("Delete transaction complete. Reloading data...");
            try {
                await loadDataFromDB(); // Reload UI
                resolve();
            } catch (loadError) {
                reject("Transaction deleted, but failed to refresh data.");
            }
        };
        transaction.onerror = (event) => {
            console.error("Delete transaction failed:", event.target.error);
            reject(`Transaction failed during delete: ${event.target.error}`);
        };
    });
}

/**
 * Handles the "Import File and Replace Data" button click .
 */
function handleStandaloneImport() {
    if (!importStandaloneFileInput || !importStandaloneStatusDiv || !importStandaloneButton) {
         console.error("Missing required elements for standalone import.");
         // Optionally provide feedback to the user if status div exists
         if (importStandaloneStatusDiv) {
            updateStatusMessage(importStandaloneStatusDiv, "Error: Import UI elements not found.", "error");
         }
         return;
    }

    const file = importStandaloneFileInput.files?.[0];

    if (!file) {
        updateStatusMessage(importStandaloneStatusDiv, "Error: No file selected.", "error");
        return;
    }
    if (file.type !== "application/json") {
        updateStatusMessage(importStandaloneStatusDiv, `Error: Selected file (${file.name}) is not a JSON file.`, "error");
        return;
    }

    updateStatusMessage(importStandaloneStatusDiv, `Reading file: ${file.name}...`, "info");
    importStandaloneButton.disabled = true; // Disable while processing

    const reader = new FileReader();

    reader.onload = async (e) => {
        const fileContent = e.target.result;
        let jsonData;

        try {
            jsonData = JSON.parse(fileContent);
        } catch (error) {
            console.error("Error parsing import JSON:", error);
            updateStatusMessage(importStandaloneStatusDiv, `Error: Could not parse JSON file. Is it valid? ${error.message}`, "error");
            importStandaloneButton.disabled = false; // Re-enable button
            return;
        }

        // Basic validation
        if (!validateImportData(jsonData)) {
             updateStatusMessage(importStandaloneStatusDiv, `Error: File does not appear to be valid budget data (missing key fields like accounts, transactions, etc.)`, "error");
             importStandaloneButton.disabled = false;
             return;
        }

        // *** CRITICAL: User Confirmation ***
        if (!confirm("IMPORTANT: Are you sure you want to replace ALL existing data on this device with the content of this file? This cannot be undone.")) {
            updateStatusMessage(importStandaloneStatusDiv, "Import cancelled by user.", "info");
            importStandaloneButton.disabled = false;
             importStandaloneFileInput.value = null; // Clear file input
             // Ensure button is disabled again since file is cleared
             importStandaloneButton.disabled = true;
            return;
        }

        try {
            // 1. Clear existing data
            updateStatusMessage(importStandaloneStatusDiv, "Clearing existing data...", "info");
            await clearAllStandaloneData();

            // 2. Write imported data
            updateStatusMessage(importStandaloneStatusDiv, "Importing data into database...", "info");
            await writeImportedDataToDB(jsonData);

             // 3. Reload data and refresh UI
             updateStatusMessage(importStandaloneStatusDiv, "Import successful. Reloading view...", "success");
             await loadDataFromDB();

             // 4. Reset import form
             importStandaloneFileInput.value = null;
             importStandaloneButton.disabled = true; // Should be disabled as file input is now empty
             // Optional: Clear success message after a delay
             // setTimeout(() => { if(importStandaloneStatusDiv.textContent.includes("successful")) importStandaloneStatusDiv.textContent = ''; }, 5000);

        } catch (error) {
             console.error("Import process failed:", error);
             // Provide more specific error from writeImportedDataToDB if possible
             updateStatusMessage(importStandaloneStatusDiv, `Import failed: ${error}`, "error");
             importStandaloneButton.disabled = false; // Re-enable button on error
        }
    };

    reader.onerror = (e) => {
        console.error("Error reading import file:", e);
        updateStatusMessage(importStandaloneStatusDiv, `Error reading file ${file.name}.`, "error");
        importStandaloneButton.disabled = false;
    };

    reader.readAsText(file);
}

/**
 * Performs basic validation on the structure of imported JSON data.
 * @param {object} data The parsed JSON data.
 * @returns {boolean} True if the basic structure seems valid, false otherwise.
 */
function validateImportData(data) {
    if (!data || typeof data !== 'object') return false;
    const hasAccounts = typeof data.accounts === 'object' && data.accounts !== null;
    const hasTransactions = Array.isArray(data.transactions);
    const hasCategories = Array.isArray(data.categories);
    const hasGroups = typeof data.category_groups === 'object' && data.category_groups !== null;
    const hasPeriods = typeof data.budget_periods === 'object' && data.budget_periods !== null;
    // ready_to_assign might be 0 or undefined, so just check its presence is okay
    const hasRTA = data.hasOwnProperty('ready_to_assign');

    // Require at least accounts and transactions for a minimal valid file
    return hasAccounts && hasTransactions && hasCategories && hasGroups && hasPeriods && hasRTA;
}

/**
 * Writes the structured data from an imported file into the Standalone IndexedDB stores.
 * ASSUMES `clearAllStandaloneData()` has already been called successfully.
 * Uses put() for safer writing.
 * @param {object} importedData The validated budget data object.
 * @returns {Promise<void>}
 */
function writeImportedDataToDB(importedData) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized for writing.");

        const storeNames = [
            TX_STORE_NAME, ACCOUNT_STORE_NAME, CATEGORY_STORE_NAME,
            GROUP_STORE_NAME, BUDGET_PERIOD_STORE_NAME, METADATA_STORE_NAME
        ];
        const transaction = db.transaction(storeNames, 'readwrite');
        const stores = {};
        storeNames.forEach(name => {
            if (db.objectStoreNames.contains(name)) {
                stores[name] = transaction.objectStore(name);
            } else {
                return reject(`Critical Error: Database store ${name} not found.`);
            }
        });

        let errorOccurred = false; // Flag to track errors during writes
        let writeErrors = []; // Store specific errors

        console.log("Starting data write process..."); // Add logging

        try {
            // 1. Write Transactions (Using put, still remove ID for auto-increment keyPath)
            console.log(`Attempting to write ${importedData.transactions?.length || 0} transactions...`);
            for (const tx of importedData.transactions || []) {
                const { id, ...txToWrite } = tx; // Remove potentially conflicting ID for auto-increment store
                if (txToWrite.amount === undefined || txToWrite.date === undefined || txToWrite.account === undefined || txToWrite.type === undefined || txToWrite.category === undefined) {
                    console.warn("Skipping transaction with missing essential fields:", tx);
                    continue;
                }
                // NOTE: If TX_STORE_NAME keyPath was NOT autoIncrement, you'd use put(tx) directly.
                // Since it IS autoIncrement, we must use add() here. Let's revert this part.
                // If IDs need preservation, the store schema needs changing.
                const request = stores[TX_STORE_NAME].add(txToWrite); // Keep add for auto-increment store
                request.onerror = (e) => {
                    const errorMsg = `Error adding transaction: ${e.target.error}`;
                    console.error(errorMsg, txToWrite);
                    writeErrors.push(errorMsg);
                    errorOccurred = true;
                };
            }

            // 2. Write Accounts (Using put, keyPath is 'name')
            console.log(`Attempting to write ${Object.keys(importedData.accounts || {}).length} accounts...`);
            for (const [accName, balance] of Object.entries(importedData.accounts || {})) {
                const accountType = importedData._account_types?.[accName] || 'unknown'; // Keep future enhancement example
                if (typeof accName !== 'string' || typeof balance !== 'number') {
                    console.warn("Skipping account with invalid name/balance:", accName, balance);
                    continue;
                }
                const accountData = { name: accName, balance: balance, type: accountType };
                const request = stores[ACCOUNT_STORE_NAME].put(accountData); // Use PUT
                request.onerror = (e) => {
                    const errorMsg = `Error writing account '${accName}': ${e.target.error}`;
                    console.error(errorMsg);
                    writeErrors.push(errorMsg);
                    errorOccurred = true;
                };
            }

            // 3. Write Categories (Using put, keyPath is 'name')
            console.log(`Attempting to write ${importedData.categories?.length || 0} categories...`);
            for (const catName of importedData.categories || []) {
                if (typeof catName !== 'string' || !catName) {
                    console.warn("Skipping invalid category name:", catName);
                    continue;
                }
                const categoryData = { name: catName };
                const request = stores[CATEGORY_STORE_NAME].put(categoryData); // Use PUT
                request.onerror = (e) => {
                    const errorMsg = `Error writing category '${catName}': ${e.target.error}`;
                    console.error(errorMsg);
                    writeErrors.push(errorMsg);
                    errorOccurred = true;
                };
            }

            // 4. Write Category Groups (Using put, keyPath is 'categoryName')
            console.log(`Attempting to write ${Object.keys(importedData.category_groups || {}).length} group mappings...`);
            for (const [catName, groupName] of Object.entries(importedData.category_groups || {})) {
                if (typeof catName !== 'string' || !catName || typeof groupName !== 'string' || !groupName) {
                    console.warn("Skipping invalid category group mapping:", catName, groupName);
                    continue;
                }
                const groupMapping = { categoryName: catName, groupName: groupName };
                const request = stores[GROUP_STORE_NAME].put(groupMapping); // Use PUT
                request.onerror = (e) => {
                    const errorMsg = `Error writing group mapping for '${catName}': ${e.target.error}`;
                    console.error(errorMsg);
                    writeErrors.push(errorMsg);
                    errorOccurred = true;
                };
            }

            // 5. Write Budget Periods (Using put, keyPath is 'period')
            console.log(`Attempting to write ${Object.keys(importedData.budget_periods || {}).length} budget periods...`);
            for (const [period, budgetData] of Object.entries(importedData.budget_periods || {})) {
                if (!/^\d{4}-\d{2}$/.test(period) || typeof budgetData !== 'object') {
                    console.warn("Skipping invalid budget period data:", period, budgetData);
                    continue;
                }
                const periodData = { period: period, budget: budgetData };
                const request = stores[BUDGET_PERIOD_STORE_NAME].put(periodData); // Use PUT
                request.onerror = (e) => {
                    const errorMsg = `Error writing budget period '${period}': ${e.target.error}`;
                    console.error(errorMsg);
                    writeErrors.push(errorMsg);
                    errorOccurred = true;
                };
            }

            // 6. Write Metadata (Using put, keyPath is 'key')
            console.log("Attempting to write metadata (RTA)...");
            const rtaValue = typeof importedData.ready_to_assign === 'number' ? importedData.ready_to_assign : 0.0;
            const metadata = { key: 'appData', ready_to_assign: rtaValue };
            const metaRequest = stores[METADATA_STORE_NAME].put(metadata); // Use PUT
            metaRequest.onerror = (e) => {
                const errorMsg = `Error writing metadata (RTA): ${e.target.error}`;
                console.error(errorMsg);
                writeErrors.push(errorMsg);
                errorOccurred = true;
            };

        } catch (loopError) {
            console.error("Critical error during data processing loop:", loopError);
            errorOccurred = true; // Mark error
            writeErrors.push(`Critical loop error: ${loopError.message}`);
            transaction.abort(); // Abort transaction immediately
            // Reject the promise directly here since the transaction is aborted
            return reject(`Error processing import data loop: ${loopError.message}`);
        }

        // Transaction completion handling
        transaction.oncomplete = () => {
            if (errorOccurred) {
                console.error("Import transaction completed, but errors occurred during writing. Data may be incomplete.", writeErrors);
                // REJECT the promise if errors occurred, providing details
                reject(`Import completed with errors: ${writeErrors.join("; ")}. Data might be incomplete.`);
            } else {
                console.log("Import data write transaction complete.");
                resolve(); // Resolve only on full success
            }
        };

        transaction.onerror = (event) => {
            // This catches errors that abort the transaction (like constraint errors from add)
            console.error("Import data write transaction failed:", event.target.error);
            reject(`Database transaction failed during import: ${event.target.error}`);
        };
    });
}

// --- Add Form Handling ---
/**
 * Handles the submission of the Add New Account form .
 * @param {Event} event The form submission event.
 */
async function handleAddAccount(event) {
    event.preventDefault();

    // Check required elements exist
    if (!addAccountForm || !newAccountNameInput || !newAccountBalanceInput || !addAccountStatusDiv || !newAccountTypeSelect) {
        console.error("Add account form elements missing.");
        return;
    }


    const accountName = newAccountNameInput.value.trim();
    const accountType = newAccountTypeSelect.value;
    const startingBalance = parseCurrency(newAccountBalanceInput.value);

    updateStatusMessage(addAccountStatusDiv, "Adding account...", "info");

    // Validation
    if (!accountName) {
        updateStatusMessage(addAccountStatusDiv, "Error: Account name cannot be empty.", "error");
        return;
    }
    if (isNaN(startingBalance)) {
        updateStatusMessage(addAccountStatusDiv, "Error: Invalid starting balance. Please use format like 1234,56 or (500,00).", "error");
        return;
    }

    // Check for duplicates using localBudgetData
    if (localBudgetData && localBudgetData.accounts && localBudgetData.accounts.hasOwnProperty(accountName)) {
        updateStatusMessage(addAccountStatusDiv, `Error: Account named "${accountName}" already exists.`, "error");
        return;
    }

    const newAccountData = {
        name: accountName,
        balance: startingBalance,
        type: accountType
    };

    try {
        await saveAccountAndAdjustRTA(newAccountData);

        updateStatusMessage(addAccountStatusDiv, `Account "${accountName}" added successfully.`, "success");
        addAccountForm.reset();

        // Refresh UI by reloading data
        await loadDataFromDB();

    } catch (error) {
        console.error("Failed to add account:", error);
        updateStatusMessage(addAccountStatusDiv, `Error adding account: ${error}`, "error");
    }
}

/**
 * Saves a new account to IndexedDB and adjusts Ready To Assign .
 * @param {object} accountData Object containing { name, balance, type }.
 * @returns {Promise<void>}
 */
function saveAccountAndAdjustRTA(accountData) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized.");

        const transaction = db.transaction([ACCOUNT_STORE_NAME, METADATA_STORE_NAME], 'readwrite');
        const accStore = transaction.objectStore(ACCOUNT_STORE_NAME);
        const metaStore = transaction.objectStore(METADATA_STORE_NAME);
        let currentRTA = 0;

        // 1. Get current RTA
        const metaGetReq = metaStore.get('appData');
        metaGetReq.onerror = (event) => {
            console.error("Error getting metadata for RTA:", event.target.error);
            // Don't necessarily fail the whole operation, maybe default RTA to 0?
            // transaction.abort(); // Or abort if RTA is critical
            // reject("Failed to read current RTA");
        };
        metaGetReq.onsuccess = (event) => {
            currentRTA = event.target.result?.ready_to_assign || 0.0;

            // 2. Add the new account
            const accAddReq = accStore.add(accountData);
            accAddReq.onerror = (event) => {
                console.error("Error adding account to DB:", event.target.error);
                transaction.abort(); // Abort on error
                reject(`Failed to save account: ${event.target.error}`);
            };
            accAddReq.onsuccess = () => {
                console.log(`Account '${accountData.name}' added to DB.`);

                // 3. Calculate and Update RTA
                // For simplicity: Add the balance directly.
                // A positive balance increases RTA, a negative (credit card) decreases it.
                const newRTA = currentRTA + accountData.balance;
                const updatedMetadata = { key: 'appData', ready_to_assign: newRTA };

                const metaPutReq = metaStore.put(updatedMetadata);
                metaPutReq.onerror = (event) => {
                    console.error("Error updating RTA metadata:", event.target.error);
                    // Account might be saved, but RTA failed. Decide how critical this is.
                    // transaction.abort(); // Maybe abort?
                    reject(`Account saved, but failed to update RTA: ${event.target.error}`);
                };
                metaPutReq.onsuccess = () => {
                    console.log(`RTA updated successfully to: ${newRTA}`);
                    // If we reach here, both operations likely succeeded within the transaction.
                };
            };
        };

        transaction.oncomplete = () => {
            console.log("Add account & update RTA transaction complete.");
            resolve(); // Resolve the promise when the transaction completes successfully
        };
        transaction.onerror = (event) => {
            console.error("Add account & update RTA transaction failed:", event.target.error);
            // Reject was likely already called by specific request errors
            // but we add a fallback reject here.
            reject(`Transaction failed: ${event.target.error}`);
        };
    });
}

/**
 * Handles the submission of the Add New Category form.
 * @param {Event} event The form submission event.
 */
async function handleAddCategory(event) {
    event.preventDefault();

     // Check required elements exist
     if (!addCategoryForm || !newCategoryNameInput || !newCategoryGroupSelect || !addCategoryStatusDiv) {
         console.error("Add category form elements missing.");
         return;
     }


    const categoryName = newCategoryNameInput.value.trim();
    const selectedGroup = newCategoryGroupSelect.value;

    updateStatusMessage(addCategoryStatusDiv, "Adding category...", "info");

    // Validation
    if (!categoryName) {
        updateStatusMessage(addCategoryStatusDiv, "Error: Category name cannot be empty.", "error");
        return;
    }
    if (!selectedGroup) {
        updateStatusMessage(addCategoryStatusDiv, "Error: Please select a category group.", "error");
        return;
    }

    // Check for duplicates using localBudgetData
     if (localBudgetData && localBudgetData.categories && localBudgetData.categories.includes(categoryName)) {
        updateStatusMessage(addCategoryStatusDiv, `Error: Category named "${categoryName}" already exists.`, "error");
        return;
    }

    const newCategoryData = {
        name: categoryName,
        group: selectedGroup
    };

    try {
        await saveCategoryAndGroup(newCategoryData);

        updateStatusMessage(addCategoryStatusDiv, `Category "${categoryName}" added successfully to group "${selectedGroup}".`, "success");
        addCategoryForm.reset();

        // Refresh UI by reloading data
        await loadDataFromDB();

    } catch (error) {
        console.error("Failed to add category:", error);
        updateStatusMessage(addCategoryStatusDiv, `Error adding category: ${error}`, "error");
    }
}

/**
 * Saves a new category name and its group assignment to IndexedDB.
 * @param {object} categoryData Object containing { name, group }.
 * @returns {Promise<void>}
 */
function saveCategoryAndGroup(categoryData) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject("Database not initialized.");

        const transaction = db.transaction([CATEGORY_STORE_NAME, GROUP_STORE_NAME], 'readwrite');
        const catStore = transaction.objectStore(CATEGORY_STORE_NAME);
        const grpStore = transaction.objectStore(GROUP_STORE_NAME);

        // 1. Add the category name
        // The object store expects { name: '...' } because keyPath is 'name'
        const catAddReq = catStore.add({ name: categoryData.name });
        catAddReq.onerror = (event) => {
            console.error("Error adding category name to DB:", event.target.error);
            transaction.abort();
            reject(`Failed to save category name: ${event.target.error}`);
        };
        catAddReq.onsuccess = () => {
            console.log(`Category '${categoryData.name}' added to Category store.`);

            // 2. Add the group assignment
            // The object store expects { categoryName: '...', groupName: '...' } because keyPath is 'categoryName'
            const groupMapping = { categoryName: categoryData.name, groupName: categoryData.group };
            const grpAddReq = grpStore.add(groupMapping);
            grpAddReq.onerror = (event) => {
                console.error("Error adding category group mapping to DB:", event.target.error);
                // Category name might be saved, but group failed. Abort to keep consistent?
                transaction.abort();
                reject(`Category name saved, but failed to save group assignment: ${event.target.error}`);
            };
            grpAddReq.onsuccess = () => {
                console.log(`Group mapping for '${categoryData.name}' to '${categoryData.group}' added.`);
            };
        };

        transaction.oncomplete = () => {
            console.log("Add category & group transaction complete.");
            resolve();
        };
        transaction.onerror = (event) => {
            console.error("Add category & group transaction failed:", event.target.error);
            reject(`Transaction failed: ${event.target.error}`);
        };
    });
}

/** Handles the submission of the new transaction form. */
async function handleAddTransaction(event) {
    event.preventDefault();

    const statusDiv = addTxStatusDiv;
    if (!statusDiv) return;
    updateStatusMessage(statusDiv, "Processing...", "info"); // Changed initial message slightly

    const txType = txTypeSelect.value;
    const isTransfer = txType === 'transfer';
    
    // --- Validation ---
    let validationPassed = true;
    let validationError = "";

    // Common Validations
    if (!txDateInput.value) {
        validationPassed = false; validationError = "Please select a date.";
    } else if (!txAccountSelect.value) {
        validationPassed = false; validationError = "Please select the source account.";
    }
    let amount = 0; // Declare amount variable
    if (validationPassed) {
        amount = parseCurrency(txAmountInput.value); // Use the custom parser

        // Validate the parsed number (parseCurrency returns 0 for invalid)
        if (amount <= 0) {
            validationPassed = false;
            validationError = "Invalid amount. Amount must be positive and correctly formatted (e.g., 5,50 or 1.234,56).";
        }
    }

    // Type-Specific Validations
    let payeeOrToAccountValue = '';
    if (validationPassed) {
        if (isTransfer) {
            payeeOrToAccountValue = txTransferToAccountSelect.value;
            if (!payeeOrToAccountValue) {
                validationPassed = false; validationError = "Please select a destination account for the transfer.";
            } else if (payeeOrToAccountValue === txAccountSelect.value) {
                validationPassed = false; validationError = "Cannot transfer to the same account.";
            }
        } else { // Expense, Income, Refund
            payeeOrToAccountValue = txPayeeInput.value.trim();
            if (!txCategorySelect.value) { // Category is required for non-transfers
                validationPassed = false; validationError = "Please select a category.";
            }
            // Payee is optional, default will be assigned later if empty
        }
    }

    if (!validationPassed) {
        console.error("Validation failed:", validationError); // LOG 3: Validation failure
        updateStatusMessage(statusDiv, `Error: ${validationError}`, "error");
        return;
    }

    // --- Assemble Transaction Object ---
    const newTx = {
        type: txType,
        date: txDateInput.value,
        account: txAccountSelect.value, // "From" account
        payee: isTransfer ? payeeOrToAccountValue : (payeeOrToAccountValue || `(${txType})`), // Use selected "To" account as Payee for transfers, or default for others
        category: isTransfer ? null : txCategorySelect.value, // No category for transfers
        amount: amount,
        memo: txMemoInput.value.trim(),
    };

    // --- Attempt to Save ---
    try {
        await saveTransactionStandalone(newTx);
        // Status update and form reset are now handled inside saveTransactionStandalone on success
    } catch (error) {
        console.error("Failed to add transaction:", error); 
        updateStatusMessage(statusDiv, `Error saving transaction: ${error}`, "error");
    }
}

/** Generates a Version 4 UUID string. */
function generateUUID() { /* ... keep existing UUID function ... */
    if (self.crypto && self.crypto.randomUUID) {
        return self.crypto.randomUUID();
    } else {
        console.warn("Using basic fallback for UUID generation.");
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

/**
 * Updates the Add Transaction form UI based on the selected transaction type.
 * Handles showing/hiding Payee/To Account and Category fields.
 * @param {string} selectedType The value from the tx-type select ('income', 'expense', 'refund', 'transfer').
 */
function updateAddFormForTxType(selectedType) {
    if (!payeeGroup || !payeeLabel || !txPayeeInput || !txTransferToAccountSelect || !categoryGroup || !txCategorySelect) {
        console.error("Add form dynamic elements not found.");
        return;
    }

    const isTransfer = selectedType === 'transfer';

    // --- Payee / To Account Fields ---
    payeeLabel.textContent = isTransfer ? "To Account:" : "Payee:";
    txPayeeInput.classList.toggle('hidden', isTransfer); // Hide Payee input if transfer
    txTransferToAccountSelect.classList.toggle('hidden', !isTransfer); // Show 'To Account' select if transfer

    // Set required attribute dynamically
    txPayeeInput.required = !isTransfer;
    txTransferToAccountSelect.required = isTransfer;

    // --- Category Field ---
    categoryGroup.classList.toggle('hidden', isTransfer); // Hide Category group if transfer
    txCategorySelect.required = !isTransfer; // Category is NOT required for transfers

    // --- Populate/Update Dropdowns ---
    if (isTransfer) {
        populateTransferToAccountDropdown(); // Populate the 'To' account dropdown
        txCategorySelect.value = ''; // Clear category selection for transfer
    } else {
        // For non-transfers, ensure the category dropdown is populated correctly for the type
        // (This was already handled by a previous function, but call it defensively)
        updateCategoryDropdownForTxType(selectedType);
    }

    console.log(`Add form updated for type: ${selectedType}`);
}

/**
 * Populates the "To Account" dropdown for transfers, excluding the selected "From Account".
 */
function populateTransferToAccountDropdown() {
    if (!txAccountSelect || !txTransferToAccountSelect || !localBudgetData || !localBudgetData.accounts) {
        console.warn("Cannot populate 'To Account' dropdown: Missing elements or data.");
        txTransferToAccountSelect.innerHTML = '<option value="">-- No Accounts Available --</option>';
        return;
    }

    const fromAccountName = txAccountSelect.value;
    const allAccountNames = Object.keys(localBudgetData.accounts).sort();
    const availableToAccounts = allAccountNames.filter(accName => accName !== fromAccountName);

    // Remember current selection if possible
    const currentToSelection = txTransferToAccountSelect.value;

    txTransferToAccountSelect.innerHTML = ''; // Clear existing options

    // Add default prompt
    txTransferToAccountSelect.add(new Option('-- Select Destination Account --', ''));

    // Add filtered accounts
    availableToAccounts.forEach(accName => {
        txTransferToAccountSelect.add(new Option(accName, accName));
    });

     // Try to restore previous selection
     if (availableToAccounts.includes(currentToSelection)) {
        txTransferToAccountSelect.value = currentToSelection;
    }
}


// --- Filter Functions --- 
/** Filters the displayed transaction rows based on current filter inputs. */
function filterTransactions() {
    if (!transactionsTbody) return;
    const searchTerm = (filterSearchInput?.value || '').toLowerCase().trim();
    const selectedAccount = filterAccountSelect?.value || '';
    const selectedCategory = filterCategorySelect?.value || '';
    const startDate = filterStartDateInput?.value || '';
    const endDate = filterEndDateInput?.value || '';

    const rows = transactionsTbody.rows;
    let visibleRowCount = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.dataset || !row.dataset.date) continue; // Check for valid data row

        const rowDate = row.dataset.date;
        const rowAccount = row.dataset.account || '';
        const rowCategory = row.dataset.category || '';
        const rowPayee = (row.dataset.payee || '').toLowerCase();
        const rowMemo = (row.dataset.memo || '').toLowerCase();

        let showRow = true;
        if (searchTerm && !(rowPayee.includes(searchTerm) || rowMemo.includes(searchTerm))) showRow = false;
        if (showRow && selectedAccount && rowAccount !== selectedAccount) showRow = false;
        if (showRow && selectedCategory && rowCategory !== selectedCategory) showRow = false;
        if (showRow && startDate && rowDate < startDate) showRow = false;
        if (showRow && endDate && rowDate > endDate) showRow = false;

        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleRowCount++;
    }
    if (noResultsMessage) noResultsMessage.classList.toggle('hidden', visibleRowCount > 0 || transactionsTbody.rows.length === 0 || transactionsTbody.rows[0]?.cells[0]?.textContent.includes('No transactions'));
}
/** Resets all filter inputs and re-applies filtering. */
function resetAllFilters() {
    if (filterSearchInput) filterSearchInput.value = '';
    if (filterAccountSelect) filterAccountSelect.value = '';
    if (filterCategorySelect) filterCategorySelect.value = '';
    if (filterStartDateInput) filterStartDateInput.value = '';
    if (filterEndDateInput) filterEndDateInput.value = '';
    filterTransactions();
}

// --- PWA Service Worker Registration --- 
// ... (Service Worker registration code remains the same) ...
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered successfully with scope:', registration.scope))
        .catch(error => console.error('SW registration failed:', error));
    });
  } else { console.log('Service Worker is not supported.'); }


// --- START THE APP ---
document.addEventListener('DOMContentLoaded', initializeApp);