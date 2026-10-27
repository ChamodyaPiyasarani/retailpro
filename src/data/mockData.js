// ============================================================
// RetailPro – Mock Data Store
// This layer mimics a Supabase/PostgreSQL backend.
// Replace fetch() calls here with actual Supabase queries.
// ============================================================

import { format, subDays, addDays } from 'date-fns';

// --- Helpers ------------------------------------------------
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const now = () => new Date().toISOString();
const d = (n) => format(subDays(new Date(), n), 'yyyy-MM-dd');
const fd = (n) => format(addDays(new Date(), n), 'yyyy-MM-dd');

// ============================================================
// USERS / AUTH
// ============================================================
export const USERS = [
  { id: 'U001', name: 'Amara Silva',   email: 'admin@gmail.com',    password: 'admin123',    role: 'admin',    avatar: '👩‍💼', active: true },
  { id: 'U002', name: 'Kamal Perera',  email: 'cashier@gmail.com',    password: 'sales123',    role: 'sales',    avatar: '🧑‍💼', active: true },
  { id: 'U003', name: 'Nimal Fernando',email: 'storekeeper@gmail.com',    password: 'store123',    role: 'storekeeper', avatar: '🧑‍🏭', active: true },
  { id: 'U004', name: 'Dilshan Ranjith',email:'purchase@gmail.com', password: 'purchase123', role: 'purchase', avatar: '🧑‍💻', active: true },
  { id: 'U005', name: 'Sanduni Perera', email:'finance@gmail.com',  password: 'finance123',  role: 'finance',  avatar: '👩‍💻', active: true },
  { id: 'U006', name: 'Ruwan Jayasena', email:'tech@gmail.com',     password: 'tech123',     role: 'technician', avatar: '🧑‍🔧', active: true },
];

export const ROLES = {
  admin:       { label: 'Admin / Manager',          color: 'accent' },
  sales:       { label: 'Sales Staff / Cashier',    color: 'primary' },
  storekeeper: { label: 'Storekeeper',              color: 'success' },
  purchase:    { label: 'Purchasing Manager',       color: 'warning' },
  finance:     { label: 'Finance Manager',          color: 'danger' },
  technician:  { label: 'Technician / Engineer',   color: 'accent' },
};

// ============================================================
// CUSTOMERS
// ============================================================
export let CUSTOMERS = [
  { id: 'C001', name: 'Lahiru Bandara',   phone: '0771234567', email: 'lahiru@email.com', address: 'No.12, Colombo 07', creditLimit: 150000, creditUsed: 45000, balance: 0, createdAt: d(120) },
  { id: 'C002', name: 'Priya Gunawardene',phone: '0769876543', email: 'priya@email.com',  address: 'No.45, Kandy Road', creditLimit: 80000,  creditUsed: 0,     balance: 12000, createdAt: d(90) },
  { id: 'C003', name: 'Chamara Wickrama', phone: '0751122334', email: 'chamara@email.com',address: 'No.8, Galle Road',  creditLimit: 200000, creditUsed: 80000, balance: 0, createdAt: d(60) },
  { id: 'C004', name: 'Nisala Jayaweera', phone: '0712223344', email: 'nisala@email.com', address: 'No.22, Negombo',   creditLimit: 50000,  creditUsed: 0,     balance: 5500, createdAt: d(30) },
  { id: 'C005', name: 'Tharushi Madushani',phone:'0783334455', email: 'tharushi@email.com',address:'No.77, Matara',    creditLimit: 100000, creditUsed: 30000, balance: 0, createdAt: d(15) },
];

// ============================================================
// SUPPLIERS
// ============================================================
export let SUPPLIERS = [
  { id: 'SUP001', name: 'TechDistrib Lanka Pvt Ltd', contact: 'Mahesh Dias',    phone: '0112345678', email: 'mahesh@techdist.lk', paymentTerms: 30, rating: 4.5, outstanding: 450000 },
  { id: 'SUP002', name: 'ElectroParts (Pvt) Ltd',    contact: 'Anura Rajapaksa',phone: '0113456789', email: 'anura@electroparts.lk', paymentTerms: 45, rating: 4.2, outstanding: 120000 },
  { id: 'SUP003', name: 'Global Computer Distributors (Pvt)',  contact: 'Samanthi Kumara',phone: '0114567890', email: 'samanthi@globalelec.lk', paymentTerms: 60, rating: 3.8, outstanding: 750000 },
  { id: 'SUP004', name: 'Premier Spares Ltd',        contact: 'Ruchira Fernando',phone:'0115678901', email: 'ruchira@premierspares.lk', paymentTerms: 30, rating: 4.7, outstanding: 85000 },
];

// ============================================================
// CATEGORIES & PRODUCTS
// ============================================================
export let CATEGORIES = [
  { id: 'CAT001', name: 'Processors', icon: '🔲', productCount: 2 },
  { id: 'CAT002', name: 'Motherboards', icon: '🧩', productCount: 1 },
  { id: 'CAT003', name: 'Memory & Storage', icon: '💾', productCount: 2 },
  { id: 'CAT004', name: 'Graphics Cards', icon: '🎮', productCount: 3 },
  { id: 'CAT005', name: 'Monitors & Peripherals', icon: '🖥️', productCount: 2 },
  { id: 'CAT006', name: 'Spare Parts', icon: '🔧', productCount: 2 },
];

export let PRODUCTS = [
  { id: 'P001', sku:'CPU-I9-14900K', name:'Intel Core i9-14900K Processor',    category:'CAT001', price:185000, cost:140000, stock:14, minStock:5,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP001', emoji:'🔲'  },
  { id: 'P002', sku:'GPU-RTX4070S', name:'NVIDIA RTX 4070 Super 12GB',category:'CAT004', price:245000, cost:190000, stock:7,  minStock:3,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP001', emoji:'🎮'  },
  { id: 'P003', sku:'CPU-R9-7900X',name:'AMD Ryzen 9 7900X Processor',category:'CAT001', price:135000, cost:105000, stock:9,  minStock:3,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP002', emoji:'🔲'  },
  { id: 'P004', sku:'MB-ROG-Z790E',name:'ASUS ROG Strix Z790-E Motherboard',category:'CAT002', price:225000, cost:175000, stock:4,  minStock:2,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP002', emoji:'🧩'  },
  { id: 'P005', sku:'SSD-990P-4TB', name:'Samsung 990 Pro 4TB NVMe SSD',   category:'CAT003', price:115000, cost:90000,  stock:6,  minStock:2,  unit:'pcs', serial:true,  warranty:60, supplierId:'SUP003', emoji:'💾'  },
  { id: 'P006', sku:'MON-DELL-27-4K',  name:'Dell 27" 4K Monitor',      category:'CAT005', price:95000,  cost:72000,  stock:12, minStock:4,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP001', emoji:'🖥️'  },
  { id: 'P007', sku:'GPU-RTX4060TI',  name:'NVIDIA RTX 4060 Ti 16GB',     category:'CAT004', price:175000, cost:138000, stock:5,  minStock:2,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP001', emoji:'🎮'  },
  { id: 'P008', sku:'SP-CPU-FAN-120',  name:'CPU Cooler Fan 120mm',            category:'CAT006', price:4500,   cost:2800,   stock:35, minStock:10, unit:'pcs', serial:false, warranty:6,  supplierId:'SUP004', emoji:'🔧'  },
  { id: 'P009', sku:'SP-LAP-KBD',  name:'Laptop Replacement Keyboard',    category:'CAT006', price:8500,   cost:5500,   stock:20, minStock:8,  unit:'pcs', serial:false, warranty:6,  supplierId:'SUP004', emoji:'🔧'  },
  { id: 'P010', sku:'PER-LOGI-MK270',name:'Logitech MK270 Keyboard & Mouse',category:'CAT005', price:12500,  cost:9000,   stock:22, minStock:8,  unit:'pcs', serial:false, warranty:12, supplierId:'SUP002', emoji:'⌨️'  },
  { id: 'P011', sku:'RAM-KF-16-D5', name:'Kingston Fury 16GB DDR5 RAM',      category:'CAT003', price:18500,  cost:14000,  stock:3,  minStock:5,  unit:'pcs', serial:false, warranty:60, supplierId:'SUP003', emoji:'💾'  },
  { id: 'P012', sku:'GPU-RTX4080S', name:'NVIDIA RTX 4080 Super 16GB',      category:'CAT004', price:310000, cost:245000, stock:2,  minStock:2,  unit:'pcs', serial:true,  warranty:36, supplierId:'SUP003', emoji:'🎮'  },
];

// ============================================================
// STOCK MOVEMENTS
// ============================================================
export let STOCK_MOVEMENTS = [
  { id: 'SM001', productId:'P001', type:'in',  qty:5,  ref:'PO-002', note:'Purchase received', date:d(10), userId:'U003' },
  { id: 'SM002', productId:'P006', type:'out', qty:2,  ref:'INV-001', note:'Sale',             date:d(8),  userId:'U003' },
  { id: 'SM003', productId:'P008', type:'out', qty:3,  ref:'JOB-001', note:'Service part used',date:d(5),  userId:'U003' },
  { id: 'SM004', productId:'P003', type:'in',  qty:3,  ref:'PO-001', note:'Purchase received', date:d(3),  userId:'U003' },
  { id: 'SM005', productId:'P011', type:'adj', qty:-1, ref:'ADJ-001', note:'Damaged item write-off', date:d(1), userId:'U003' },
];

// ============================================================
// SALES ORDERS & INVOICES
// ============================================================
export let SALES_ORDERS = [
  {
    id: 'SO-001', invoiceNo: 'INV-2026-001', customerId: 'C001', date: d(20),
    items: [
      { productId:'P006', name:'Dell 27" 4K Monitor', qty:1, unitPrice:95000, discount:5000, total:90000 },
    ],
    subtotal:95000, discountTotal:5000, taxRate:0, tax:0, grandTotal:90000,
    paymentMethod:'cash', paymentStatus:'paid', amountPaid:90000, balance:0,
    creditSale:false, warrantyItems:[], status:'completed', createdBy:'U002'
  },
  {
    id: 'SO-002', invoiceNo: 'INV-2026-002', customerId: 'C003', date: d(15),
    items: [
      { productId:'P001', name:'Intel Core i9-14900K Processor', qty:2, unitPrice:185000, discount:0, total:370000 },
      { productId:'P010', name:'Logitech MK270 Keyboard & Mouse',    qty:1, unitPrice:12500,  discount:500, total:12000 },
    ],
    subtotal:382500, discountTotal:500, taxRate:0, tax:0, grandTotal:382000,
    paymentMethod:'credit', paymentStatus:'partial', amountPaid:200000, balance:182000,
    creditSale:true, status:'completed', createdBy:'U002'
  },
  {
    id: 'SO-003', invoiceNo: 'INV-2026-003', customerId: 'C002', date: d(8),
    items: [
      { productId:'P005', name:'Samsung 990 Pro 4TB NVMe SSD', qty:1, unitPrice:115000, discount:0, total:115000 },
    ],
    subtotal:115000, discountTotal:0, taxRate:0, tax:0, grandTotal:115000,
    paymentMethod:'cash', paymentStatus:'paid', amountPaid:115000, balance:0,
    creditSale:false, status:'completed', createdBy:'U002'
  },
  {
    id: 'SO-004', invoiceNo: 'INV-2026-004', customerId: 'C005', date: d(3),
    items: [
      { productId:'P007', name:'NVIDIA RTX 4060 Ti 16GB', qty:1, unitPrice:175000, discount:8000, total:167000 },
    ],
    subtotal:175000, discountTotal:8000, taxRate:0, tax:0, grandTotal:167000,
    paymentMethod:'cash', paymentStatus:'paid', amountPaid:167000, balance:0,
    creditSale:false, status:'completed', createdBy:'U002'
  },
];

// ============================================================
// PURCHASE ORDERS
// ============================================================
export let PURCHASE_ORDERS = [
  {
    id: 'PO-001', supplierId:'SUP001', date:d(25), expectedDate:d(10), receivedDate:d(8),
    items:[
      { productId:'P003', name:'AMD Ryzen 9 7900X Processor', qty:3, unitCost:105000, total:315000 },
    ],
    subtotal:315000, grandTotal:315000,
    status:'received', payableStatus:'pending', createdBy:'U004', approvedBy:'U001'
  },
  {
    id: 'PO-002', supplierId:'SUP002', date:d(15), expectedDate:d(5), receivedDate:d(4),
    items:[
      { productId:'P001', name:'Intel Core i9-14900K Processor', qty:5, unitCost:140000, total:700000 },
    ],
    subtotal:700000, grandTotal:700000,
    status:'received', payableStatus:'paid', createdBy:'U004', approvedBy:'U001'
  },
  {
    id: 'PO-003', supplierId:'SUP003', date:d(7), expectedDate:fd(7),
    items:[
      { productId:'P007', name:'NVIDIA RTX 4060 Ti 16GB', qty:4, unitCost:138000, total:552000 },
      { productId:'P002', name:'NVIDIA RTX 4070 Super 12GB', qty:2, unitCost:190000, total:380000 },
    ],
    subtotal:932000, grandTotal:932000,
    status:'ordered', payableStatus:'none', createdBy:'U004', approvedBy:'U001'
  },
  {
    id: 'PO-004', supplierId:'SUP004', date:d(3), expectedDate:fd(4),
    items:[
      { productId:'P008', name:'CPU Cooler Fan 120mm', qty:20, unitCost:2800, total:56000 },
      { productId:'P009', name:'Laptop Replacement Keyboard', qty:10, unitCost:5500, total:55000 },
    ],
    subtotal:111000, grandTotal:111000,
    status:'approved', payableStatus:'none', createdBy:'U004', approvedBy:'U001'
  },
];

// ============================================================
// SERVICE JOBS
// ============================================================
export let SERVICE_JOBS = [
  {
    id: 'JOB-001', serviceFee:0, billingStatus:'warranty', customerId:'C001', productId:'P001', serialNo:'CPU-SN-20240112',
    salesOrderId:'SO-002', type:'repair', priority:'high',
    description:'Custom PC shutting down randomly – CPU overheating',
    status:'in-progress', assignedTo:'U006', createdBy:'U002',
    warrantyValid:true, warrantyExpiry:fd(180),
    visits:[
      { date:d(5), note:'Initial inspection – faulty CPU cooler fan confirmed', userId:'U006' },
      { date:d(3), note:'Ordered replacement cooler fan', userId:'U006' },
    ],
    partsUsed:[
      { productId:'P008', qty:1, note:'CPU cooler fan replacement' },
    ],
    createdAt:d(6), updatedAt:d(3), completedAt: null,
  },
  {
    id: 'JOB-002', serviceFee:7500, billingStatus:'paid', customerId:'C003', productId:'P005', serialNo:'SSD-SN-20240305',
    salesOrderId:'SO-003', type:'installation', priority:'normal',
    description:'Office PC upgrade and SSD installation at customer site',
    status:'completed', assignedTo:'U006', createdBy:'U002',
    warrantyValid:true, warrantyExpiry:fd(600),
    visits:[
      { date:d(7), note:'Installation completed, customer tested', userId:'U006' },
    ],
    partsUsed:[],
    createdAt:d(8), updatedAt:d(7), completedAt:d(7),
  },
  {
    id: 'JOB-003', serviceFee:4500, billingStatus:'unbilled', customerId:'C002', productId:'P006', serialNo:'MON-SN-20240418',
    salesOrderId:'SO-001', type:'maintenance', priority:'normal',
    description:'Annual maintenance – monitor flickering, check cable and panel',
    status:'pending', assignedTo:null, createdBy:'U002',
    warrantyValid:false, warrantyExpiry:d(30),
    visits:[], partsUsed:[],
    createdAt:d(2), updatedAt:d(2), completedAt: null,
  },
  {
    id: 'JOB-004', serviceFee:0, billingStatus:'warranty', customerId:'C005', productId:'P007', serialNo:'GPU-SN-20241005',
    salesOrderId:'SO-004', type:'repair', priority:'urgent',
    description:'Graphics card shows artifacts – customer requesting exchange',
    status:'pending', assignedTo:'U006', createdBy:'U002',
    warrantyValid:true, warrantyExpiry:fd(350),
    visits:[], partsUsed:[],
    createdAt:d(1), updatedAt:d(1), completedAt: null,
  },
];

// ============================================================
// RETURNS / EXCHANGES / COMPLAINTS
// ============================================================
export let RETURNS = [
  {
    id: 'RET-001', type:'refund', customerId:'C002', salesOrderId:'SO-001',
    productId:'P006', reason:'Product stopped working after 2 months',
    status:'approved', warrantyValid:true,
    requestedBy:'U002', approvedBy:'U001', refundAmount:90000,
    refundStatus:'processed', inspectionResult:'defective', canRestock:false,
    createdAt:d(12), resolvedAt:d(10),
  },
  {
    id: 'RET-002', type:'exchange', customerId:'C005', salesOrderId:'SO-004',
    productId:'P007', reason:'Graphics card shows artifacts under load',
    status:'pending', warrantyValid:true,
    requestedBy:'U002', approvedBy:null, refundAmount:0,
    refundStatus:'none', inspectionResult:null, canRestock:null,
    createdAt:d(1), resolvedAt:null,
  },
];

// ============================================================
// COMPLAINTS
// ============================================================
export let COMPLAINTS = [
  {
    id: 'CMP-001', customerId:'C001', subject:'Delayed service response',
    description:'Customer waited 2 weeks for technician visit',
    status:'resolved', priority:'high', assignedTo:'U001',
    resolution:'Apologised and offered priority service. Technician visit scheduled.',
    createdAt:d(14), resolvedAt:d(10), createdBy:'U002',
  },
  {
    id: 'CMP-002', customerId:'C004', subject:'Wrong item delivered',
    description:'Ordered RTX 4070 Super but received RTX 4060 Ti',
    status:'open', priority:'urgent', assignedTo:'U001',
    resolution:null, createdAt:d(2), resolvedAt:null, createdBy:'U002',
  },
];

// ============================================================
// PAYMENTS (Customer)
// ============================================================
export let PAYMENTS = [
  { id:'PAY-001', customerId:'C001', salesOrderId:'SO-001', amount:90000,  method:'cash',     date:d(20), recordedBy:'U005', note:'Full payment on sale' },
  { id:'PAY-002', customerId:'C003', salesOrderId:'SO-002', amount:200000, method:'transfer',  date:d(14), recordedBy:'U005', note:'Partial credit payment' },
  { id:'PAY-003', customerId:'C002', salesOrderId:'SO-003', amount:115000, method:'card',      date:d(8),  recordedBy:'U005', note:'Full payment' },
  { id:'PAY-004', customerId:'C005', salesOrderId:'SO-004', amount:167000, method:'cash',      date:d(3),  recordedBy:'U005', note:'Full payment on sale' },
];

// ============================================================
// SUPPLIER PAYMENTS (Payables)
// ============================================================
export let SUPPLIER_PAYMENTS = [
  { id:'SPAY-001', supplierId:'SUP002', purchaseOrderId:'PO-002', amount:700000, method:'transfer', date:d(3),  recordedBy:'U005', note:'PO-002 settled' },
  { id:'SPAY-002', supplierId:'SUP001', purchaseOrderId:'PO-001', amount:315000, method:'transfer', date:null,  recordedBy:null,   note:'Pending payment', status:'pending' },
];

// ============================================================
// AUDIT LOG
// ============================================================
export let AUDIT_LOG = [
  { id:'AL001', action:'LOGIN',          userId:'U001', detail:'Admin logged in',                 timestamp: new Date(Date.now()-3600000).toISOString() },
  { id:'AL002', action:'SALE_CREATED',   userId:'U002', detail:'Invoice INV-2026-004 created',   timestamp: new Date(Date.now()-7200000).toISOString() },
  { id:'AL003', action:'STOCK_ADJUSTED', userId:'U003', detail:'P011 qty adjusted -1 (damaged)', timestamp: new Date(Date.now()-86400000).toISOString() },
  { id:'AL004', action:'JOB_ASSIGNED',   userId:'U001', detail:'JOB-001 assigned to U006',      timestamp: new Date(Date.now()-172800000).toISOString() },
  { id:'AL005', action:'REFUND_APPROVED',userId:'U001', detail:'RET-001 refund approved',        timestamp: new Date(Date.now()-259200000).toISOString() },
  { id:'AL006', action:'PO_CREATED',     userId:'U004', detail:'PO-003 created for SUP003',     timestamp: new Date(Date.now()-432000000).toISOString() },
];

// ============================================================
// REPORT SCHEDULES
// ============================================================
export let REPORT_SCHEDULES = [
  { id:'RS001', type:'sales_summary',    frequency:'daily',   recipients:['admin@gmail.com'], active:true,  lastRun:d(1) },
  { id:'RS002', type:'stock_alert',      frequency:'daily',   recipients:['storekeeper@gmail.com'],  active:true,  lastRun:d(0) },
  { id:'RS003', type:'financial_summary',frequency:'monthly', recipients:['finance@gmail.com'],active:true,  lastRun:d(15) },
];

// ============================================================
// SUPPLIER QUOTATIONS (quotation table)
// ============================================================
export let QUOTATIONS = [
  { id:'QT-001', supplierId:'SUP001', requestDate:d(30), validUntil:d(10), quotedTotal:930000, status:'accepted', note:'RTX 4060 Ti / 4070 Super batch' },
  { id:'QT-002', supplierId:'SUP004', requestDate:d(6),  validUntil:fd(24), quotedTotal:110000, status:'received', note:'Cooler fans and keyboards' },
  { id:'QT-003', supplierId:'SUP003', requestDate:d(2),  validUntil:fd(28), quotedTotal:0,      status:'requested', note:'Kingston DDR5 RAM restock' },
];

// ============================================================
// RECONCILIATION records (who reconciled which order)
// ============================================================
export let RECONCILIATIONS = [];

// ============================================================
// Derived / helper functions (simulate DB queries)
// ============================================================
export const getCustomer  = (id) => CUSTOMERS.find(c => c.id === id);
export const getSupplier  = (id) => SUPPLIERS.find(s => s.id === id);
export const getProduct   = (id) => PRODUCTS.find(p => p.id === id);
export const getUser      = (id) => USERS.find(u => u.id === id);
export const getSalesOrder= (id) => SALES_ORDERS.find(o => o.id === id);
export const getServiceJob= (id) => SERVICE_JOBS.find(j => j.id === id);

export const getLowStockProducts = () => PRODUCTS.filter(p => p.stock <= p.minStock);
export const getOverduePOs = () => PURCHASE_ORDERS.filter(po =>
  po.status !== 'received' && po.expectedDate && po.expectedDate < format(new Date(),'yyyy-MM-dd')
);
export const getOutstandingInvoices = () => SALES_ORDERS.filter(o => o.paymentStatus !== 'paid');

// Sales summary for dashboard
export const getDailySalesData = () => {
  const days = Array.from({length:7},(_,i) => subDays(new Date(), 6-i));
  return days.map(day => {
    const label = format(day,'EEE');
    const dateStr = format(day,'yyyy-MM-dd');
    const dayOrders = SALES_ORDERS.filter(o => o.date === dateStr);
    const revenue = dayOrders.reduce((s,o) => s + o.grandTotal, 0);
    return { label, revenue, orders: dayOrders.length };
  });
};

// Format currency (LKR)
export const fmt = (n) => new Intl.NumberFormat('en-LK', { style:'currency', currency:'LKR', minimumFractionDigits:0 }).format(n);

// New ID generators
export const newSaleId  = () => `SO-${String(SALES_ORDERS.length + 1).padStart(3,'0')}`;
export const newInvNo   = () => `INV-2026-${String(SALES_ORDERS.length + 1).padStart(3,'0')}`;
export const newJobId   = () => `JOB-${String(SERVICE_JOBS.length + 1).padStart(3,'0')}`;
export const newPoId    = () => `PO-${String(PURCHASE_ORDERS.length + 1).padStart(3,'0')}`;
export const newCustId  = () => `C${String(CUSTOMERS.length + 1).padStart(3,'0')}`;
export const newRetId   = () => `RET-${String(RETURNS.length + 1).padStart(3,'0')}`;
export const newCmpId   = () => `CMP-${String(COMPLAINTS.length + 1).padStart(3,'0')}`;
export const newPayId   = () => `PAY-${String(PAYMENTS.length + 1).padStart(3,'0')}`;
export const newSmId    = () => `SM${String(STOCK_MOVEMENTS.length + 1).padStart(3,'0')}`;
export const newQuoteId = () => `QT-${String(QUOTATIONS.length + 1).padStart(3,'0')}`;

// Warranty check (warranty_record): product warranty months from the sale date
export const getWarrantyStatus = (productId, salesOrderId) => {
  const product = getProduct(productId);
  const order = getSalesOrder(salesOrderId);
  if (!product || !order) return { known:false, valid:false, message:'Select the sales order and product to check the warranty.' };
  const sold = order.items?.some(i => i.productId === productId);
  if (!sold) return { known:true, valid:false, message:`${product.name} is not on invoice ${order.invoiceNo}.` };
  const expiry = addDays(new Date(order.date), Math.round(product.warranty * 30.44));
  const expiryText = format(expiry, 'yyyy-MM-dd');
  const valid = expiry >= new Date();
  return { known:true, valid, product, order, months: product.warranty, saleDate: order.date, expiry: expiryText,
    message: valid ? `Warranty valid until ${expiryText}` : `Warranty expired on ${expiryText}` };
};

// All financial transactions (transaction table view): customer payments, supplier payments, refunds
export const getAllTransactions = () => {
  const rows = [];
  PAYMENTS.forEach(p => rows.push({
    id: p.id, date: p.date, kind: p.note?.startsWith('Refund') ? 'Refund' : 'Customer payment',
    party: getCustomer(p.customerId)?.name || p.customerId, ref: p.salesOrderId, method: p.method,
    amount: p.note?.startsWith('Refund') ? -p.amount : p.amount,
  }));
  SUPPLIER_PAYMENTS.filter(sp => sp.date).forEach(sp => rows.push({
    id: sp.id, date: sp.date, kind: 'Supplier payment', party: getSupplier(sp.supplierId)?.name || sp.supplierId,
    ref: sp.purchaseOrderId, method: sp.method, amount: -sp.amount,
  }));
  SERVICE_JOBS.filter(j => j.billingStatus === 'paid' && j.serviceFee > 0).forEach(j => rows.push({
    id: `SVC-${j.id}`, date: j.completedAt || j.updatedAt, kind: 'Service fee', party: getCustomer(j.customerId)?.name || j.customerId,
    ref: j.id, method: 'cash', amount: j.serviceFee,
  }));
  return rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
};
