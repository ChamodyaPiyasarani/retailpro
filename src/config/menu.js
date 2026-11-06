// The menu of the system. A page is shown to a user when his role has
// at least one of the permissions (functions) listed for that page.
// The permission names are the use case names of the use case diagram.
export const MENU = [
  { section: 'Main', items: [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', perms: ['View dashboard'] },
  ] },
  { section: 'Sales', items: [
    { path: '/sales-order', label: 'Sales Orders', icon: 'ShoppingCart', perms: ['Create sales order'] },
    { path: '/payments', label: 'Payments', icon: 'CreditCard', perms: ['Process customer payment', 'Record supplier payment', 'View all payments'] },
    { path: '/customers', label: 'Customers', icon: 'Users', perms: ['Manage customers', 'View customer purchase history'] },
    { path: '/warranty', label: 'Warranty Check', icon: 'ShieldCheck', perms: ['Check warranty status'] },
    { path: '/returns', label: 'Returns', icon: 'Undo2', perms: ['Create return request', 'Approve refund requests'] },
    { path: '/invoices', label: 'Invoices', icon: 'Receipt', perms: ['View outstanding invoices', 'Process customer payment', 'View all payments'] },
    { path: '/refunds', label: 'Refunds', icon: 'HandCoins', perms: ['Process approved refund'] },
  ] },
  { section: 'Stock', items: [
    { path: '/stock', label: 'Stock', icon: 'Warehouse', perms: ['View stock levels', 'Receive stock', 'Adjust stock', 'Issue spare parts'] },
    { path: '/products', label: 'Products', icon: 'Package', perms: ['Manage products'] },
    { path: '/categories', label: 'Categories', icon: 'Tags', perms: ['Manage categories'] },
  ] },
  { section: 'Purchasing', items: [
    { path: '/suppliers', label: 'Suppliers', icon: 'Truck', perms: ['Manage suppliers'] },
    { path: '/quotations', label: 'Quotations', icon: 'FileText', perms: ['Request supplier quotation'] },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: 'ShoppingBag', perms: ['Create purchase order', 'Approve purchase orders', 'Track purchase order status', 'Reorder low-stock items'] },
  ] },
  { section: 'Service', items: [
    { path: '/service-jobs', label: 'Service Jobs', icon: 'Wrench', perms: ['Register service request', 'Assign technician to service job'] },
    { path: '/my-jobs', label: 'My Jobs', icon: 'ClipboardList', perms: ['View assigned jobs', 'Update job status'] },
    { path: '/service-history', label: 'Service History', icon: 'History', perms: ['View service history'] },
  ] },
  { section: 'Reports', items: [
    { path: '/reports', label: 'Reports', icon: 'BarChart3', perms: ['Generate business report', 'Generate stock report', 'Generate financial report'] },
  ] },
  { section: 'Administration', items: [
    { path: '/users', label: 'User Accounts', icon: 'UserCog', perms: ['Manage user accounts'] },
    { path: '/roles', label: 'Roles & Permissions', icon: 'KeyRound', perms: ['Manage roles and permissions'] },
    { path: '/discounts', label: 'Discounts', icon: 'Percent', perms: ['Manage discounts'] },
  ] },
];

export const ALL_PAGES = MENU.flatMap(s => s.items);
// the first page a user may open (shown after log in)
export const homeOf = (permissions = []) => ALL_PAGES.find(p => p.perms.some(x => permissions.includes(x)))?.path || '/no-access';
