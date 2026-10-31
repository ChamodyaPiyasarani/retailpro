// Demo staff accounts shown on the login page (one per role) so the examiner can
// try every role quickly. These are only shortcuts that fill in the login form –
// the accounts themselves live in Supabase Auth, which checks the password.
export const DEMO_ACCOUNTS = [
  { email: 'admin@gmail.com',       password: '123456', label: 'Admin / Manager',              avatar: '👩‍💼' },
  { email: 'cashier@gmail.com',     password: '123456', label: 'Sales Staff / Cashier',        avatar: '🧑‍💼' },
  { email: 'storekeeper@gmail.com', password: '123456', label: 'Storekeeper',                  avatar: '🧑‍🏭' },
  { email: 'purchase@gmail.com',    password: '123456', label: 'Purchasing Manager',           avatar: '🧑‍💻' },
  { email: 'finance@gmail.com',     password: '123456', label: 'Finance Manager',              avatar: '👩‍💻' },
  { email: 'tech@gmail.com',        password: '123456', label: 'Technician / Service Engineer', avatar: '🧑‍🔧' },
];
