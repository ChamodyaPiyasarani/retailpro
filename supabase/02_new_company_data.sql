-- ============================================================
-- Rajida Holdings company data for the NEW smaller database.
-- Run AFTER 01_new_schema.sql. Dates are counted back from today
-- (current_date), so the dashboard always shows recent data.
-- The 6 staff accounts must exist in Authentication -> Users
-- (admin, cashier, storekeeper, purchase, finance, tech @gmail.com).
-- ============================================================

insert into role (role_id, role_name, description, is_active) values
  (1, 'Admin / Manager', 'Manages users, roles, products and approvals', true),
  (2, 'Sales Staff / Cashier', 'Sells to customers and takes payments', true),
  (3, 'Storekeeper', 'Looks after the stock', true),
  (4, 'Purchasing Manager', 'Buys goods from suppliers', true),
  (5, 'Finance Manager', 'Looks after invoices, payments and refunds', true),
  (6, 'Technician', 'Repairs and services products', true);

insert into permission (permission_id, permission_name, module, description) values
  (1, 'Manage user accounts', 'Administration', 'Allows the user to manage user accounts'),
  (2, 'Manage roles and permissions', 'Administration', 'Allows the user to manage roles and permissions'),
  (3, 'Manage products', 'Stock', 'Allows the user to manage products'),
  (4, 'Manage categories', 'Stock', 'Allows the user to manage categories'),
  (5, 'Manage discounts', 'Administration', 'Allows the user to manage discounts'),
  (6, 'Approve purchase orders', 'Purchasing', 'Allows the user to approve purchase orders'),
  (7, 'Approve refund requests', 'Sales', 'Allows the user to approve refund requests'),
  (8, 'Assign technician to service job', 'Service', 'Allows the user to assign technician to service job'),
  (9, 'View dashboard', 'Reports', 'Allows the user to view dashboard'),
  (10, 'Generate business report', 'Reports', 'Allows the user to generate business report'),
  (11, 'Create sales order', 'Sales', 'Allows the user to create sales order'),
  (12, 'Process customer payment', 'Sales', 'Allows the user to process customer payment'),
  (13, 'Manage customers', 'Sales', 'Allows the user to manage customers'),
  (14, 'View customer purchase history', 'Sales', 'Allows the user to view customer purchase history'),
  (15, 'Check warranty status', 'Sales', 'Allows the user to check warranty status'),
  (16, 'Register service request', 'Service', 'Allows the user to register service request'),
  (17, 'Create return request', 'Sales', 'Allows the user to create return request'),
  (18, 'View stock levels', 'Stock', 'Allows the user to view stock levels'),
  (19, 'Receive stock', 'Stock', 'Allows the user to receive stock'),
  (20, 'Adjust stock', 'Stock', 'Allows the user to adjust stock'),
  (21, 'Issue spare parts', 'Stock', 'Allows the user to issue spare parts'),
  (22, 'Generate stock report', 'Reports', 'Allows the user to generate stock report'),
  (23, 'Manage suppliers', 'Purchasing', 'Allows the user to manage suppliers'),
  (24, 'Request supplier quotation', 'Purchasing', 'Allows the user to request supplier quotation'),
  (25, 'Create purchase order', 'Purchasing', 'Allows the user to create purchase order'),
  (26, 'Track purchase order status', 'Purchasing', 'Allows the user to track purchase order status'),
  (27, 'Reorder low-stock items', 'Purchasing', 'Allows the user to reorder low-stock items'),
  (28, 'View outstanding invoices', 'Finance', 'Allows the user to view outstanding invoices'),
  (29, 'Record supplier payment', 'Finance', 'Allows the user to record supplier payment'),
  (30, 'Process approved refund', 'Finance', 'Allows the user to process approved refund'),
  (31, 'View all payments', 'Finance', 'Allows the user to view all payments'),
  (32, 'Generate financial report', 'Reports', 'Allows the user to generate financial report'),
  (33, 'View assigned jobs', 'Service', 'Allows the user to view assigned jobs'),
  (34, 'Update job status', 'Service', 'Allows the user to update job status'),
  (35, 'View service history', 'Service', 'Allows the user to view service history');

insert into role_permission (role_id, permission_id, granted_date) values
  (1, 1, current_date - 170),
  (1, 2, current_date - 170),
  (1, 3, current_date - 170),
  (1, 4, current_date - 170),
  (1, 5, current_date - 170),
  (1, 6, current_date - 170),
  (1, 7, current_date - 170),
  (1, 8, current_date - 170),
  (1, 9, current_date - 170),
  (1, 10, current_date - 170),
  (2, 11, current_date - 170),
  (2, 12, current_date - 170),
  (2, 13, current_date - 170),
  (2, 14, current_date - 170),
  (2, 15, current_date - 170),
  (2, 16, current_date - 170),
  (2, 17, current_date - 170),
  (3, 18, current_date - 170),
  (3, 19, current_date - 170),
  (3, 20, current_date - 170),
  (3, 21, current_date - 170),
  (3, 22, current_date - 170),
  (4, 23, current_date - 170),
  (4, 24, current_date - 170),
  (4, 25, current_date - 170),
  (4, 26, current_date - 170),
  (4, 27, current_date - 170),
  (5, 28, current_date - 170),
  (5, 29, current_date - 170),
  (5, 30, current_date - 170),
  (5, 31, current_date - 170),
  (5, 32, current_date - 170),
  (6, 33, current_date - 170),
  (6, 34, current_date - 170),
  (6, 35, current_date - 170);

insert into "user" (user_id, name, email, password, phone, is_active, created_date, last_login, role_id) values
  (1, 'Amara Silva', 'admin@gmail.com', '(kept encrypted by Supabase Auth)', '0771234501', true, current_date - 180, null, 1),
  (2, 'Kamal Perera', 'cashier@gmail.com', '(kept encrypted by Supabase Auth)', '0771234502', true, current_date - 180, null, 2),
  (3, 'Nimal Fernando', 'storekeeper@gmail.com', '(kept encrypted by Supabase Auth)', '0771234503', true, current_date - 180, null, 3),
  (4, 'Dilshan Ranjith', 'purchase@gmail.com', '(kept encrypted by Supabase Auth)', '0771234504', true, current_date - 180, null, 4),
  (5, 'Sanduni Perera', 'finance@gmail.com', '(kept encrypted by Supabase Auth)', '0771234505', true, current_date - 180, null, 5),
  (6, 'Ruwan Jayasena', 'tech@gmail.com', '(kept encrypted by Supabase Auth)', '0771234506', true, current_date - 180, null, 6);

insert into technician (technician_id, is_available, experience_years, user_id) values
  (1, true, 6, 6);

insert into technician_specialisation (technician_id, specialisation) values
  (1, 'Repair'),
  (1, 'Installation'),
  (1, 'Maintenance');

insert into category (category_id, category_name, description, is_active) values
  (1, 'Processors', 'Desktop processors (Intel and AMD)', true),
  (2, 'Motherboards', 'Motherboards for Intel and AMD sockets', true),
  (3, 'Memory & Storage', 'RAM and SSD storage', true),
  (4, 'Graphics Cards', 'NVIDIA graphics cards', true),
  (5, 'Monitors & Peripherals', 'Monitors, keyboards and mice', true),
  (6, 'Spare Parts', 'Spare parts used in repairs', true);

insert into product (product_id, product_name, brand, model, unit_price, cost_price, stock_qty, reorder_level, warranty_months, is_active, category_id) values
  (1, 'Intel Core i9-14900K Processor', 'Intel', 'i9-14900K', 185000, 140000, 14, 5, 36, true, 1),
  (2, 'NVIDIA RTX 4070 Super 12GB', 'NVIDIA', 'RTX 4070 Super', 245000, 190000, 7, 3, 36, true, 4),
  (3, 'AMD Ryzen 9 7900X Processor', 'AMD', 'Ryzen 9 7900X', 135000, 105000, 9, 3, 36, true, 1),
  (4, 'ASUS ROG Strix Z790-E Motherboard', 'ASUS', 'ROG Strix Z790-E', 225000, 175000, 4, 2, 36, true, 2),
  (5, 'Samsung 990 Pro 4TB NVMe SSD', 'Samsung', '990 Pro 4TB', 115000, 90000, 6, 2, 60, true, 3),
  (6, 'Dell 27" 4K Monitor', 'Dell', 'S2721QS', 95000, 72000, 12, 4, 36, true, 5),
  (7, 'NVIDIA RTX 4060 Ti 16GB', 'NVIDIA', 'RTX 4060 Ti', 175000, 138000, 5, 2, 36, true, 4),
  (8, 'CPU Cooler Fan 120mm', 'Cooler Master', 'Hyper 120', 4500, 2800, 35, 10, 6, true, 6),
  (9, 'Laptop Replacement Keyboard', 'Generic', 'LK-15', 8500, 5500, 20, 8, 6, true, 6),
  (10, 'Logitech MK270 Keyboard & Mouse', 'Logitech', 'MK270', 12500, 9000, 22, 8, 12, true, 5),
  (11, 'Kingston Fury 16GB DDR5 RAM', 'Kingston', 'Fury Beast 16GB', 18500, 14000, 3, 5, 60, true, 3),
  (12, 'NVIDIA RTX 4080 Super 16GB', 'NVIDIA', 'RTX 4080 Super', 310000, 245000, 2, 2, 36, true, 4);

insert into supplier (supplier_id, supplier_name, contact_person, phone, email, address, is_active) values
  (1, 'TechDistrib Lanka Pvt Ltd', 'Mahesh Dias', '0112345678', 'mahesh@techdist.lk', 'No. 45, Galle Road, Colombo 03', true),
  (2, 'ElectroParts (Pvt) Ltd', 'Anura Rajapaksa', '0113456789', 'anura@electroparts.lk', 'No. 12, Kandy Road, Kiribathgoda', true),
  (3, 'Global Computer Distributors (Pvt)', 'Samanthi Kumara', '0114567890', 'samanthi@globalcomp.lk', 'No. 8, Unity Plaza, Colombo 04', true),
  (4, 'Premier Spares Ltd', 'Ruchira Fernando', '0115678901', 'ruchira@premierspares.lk', 'No. 230, Main Street, Negombo', true);

insert into product_supplier (product_id, supplier_id) values
  (1, 1),
  (1, 2),
  (2, 1),
  (2, 3),
  (3, 2),
  (4, 2),
  (5, 3),
  (6, 1),
  (7, 1),
  (7, 3),
  (8, 4),
  (9, 4),
  (10, 2),
  (11, 3),
  (12, 3);

insert into customer (customer_id, name, phone, email, address, registered_date) values
  (1, 'Lahiru Bandara', '0771234567', 'lahiru@email.com', 'No.12, Colombo 07', current_date - 150),
  (2, 'Priya Gunawardene', '0769876543', 'priya@email.com', 'No.45, Kandy Road', current_date - 140),
  (3, 'Chamara Wickrama', '0751122334', 'chamara@email.com', 'No.8, Galle Road', current_date - 120),
  (4, 'Nisala Jayaweera', '0712223344', 'nisala@email.com', 'No.22, Negombo', current_date - 90),
  (5, 'Tharushi Madushani', '0783334455', 'tharushi@email.com', 'No.77, Matara', current_date - 60),
  (6, 'Isuru Senanayake', '0724455667', 'isuru@email.com', 'No.5, Kurunegala', current_date - 30);

insert into discount (discount_id, discount_code, rate, description, start_date, end_date, is_active) values
  (1, 'NEWYEAR10', 10, 'New year 10% off', current_date - 60, current_date + 30, true),
  (2, 'GPU5', 5, '5% off graphics card orders', current_date - 20, current_date + 10, true),
  (3, 'AVURUDU15', 15, 'Avurudu sale (ended)', current_date - 200, current_date - 160, false);

insert into sales_order (order_id, order_date, subtotal, discount_amount, total_amount, status, customer_id, user_id, discount_id) values
  (1, current_date - 136, 18500, 0, 18500, 'Completed', 2, 2, null),
  (2, current_date - 132, 12500, 0, 12500, 'Completed', 1, 2, null),
  (3, current_date - 131, 175000, 0, 175000, 'Completed', 1, 2, null),
  (4, current_date - 128, 360000, 0, 360000, 'Completed', 1, 2, null),
  (5, current_date - 125, 222500, 0, 222500, 'Completed', 6, 2, null),
  (6, current_date - 122, 8500, 0, 8500, 'Completed', 2, 2, null),
  (7, current_date - 118, 270000, 0, 270000, 'Completed', 2, 2, null),
  (8, current_date - 116, 262000, 0, 262000, 'Completed', 5, 2, null),
  (9, current_date - 111, 12500, 0, 12500, 'Completed', 6, 2, null),
  (10, current_date - 109, 270000, 0, 270000, 'Completed', 6, 2, null),
  (11, current_date - 105, 115000, 0, 115000, 'Completed', 4, 2, null),
  (12, current_date - 104, 245000, 0, 245000, 'Completed', 6, 2, null),
  (13, current_date - 99, 310000, 0, 310000, 'Completed', 4, 2, null),
  (14, current_date - 97, 245000, 0, 245000, 'Completed', 5, 2, null),
  (15, current_date - 95, 9000, 0, 9000, 'Completed', 3, 2, null),
  (16, current_date - 90, 120000, 0, 120000, 'Completed', 1, 2, null),
  (17, current_date - 87, 249500, 0, 249500, 'Completed', 4, 2, null),
  (18, current_date - 85, 430000, 0, 430000, 'Completed', 6, 2, null),
  (19, current_date - 81, 128500, 0, 128500, 'Completed', 5, 2, null),
  (20, current_date - 78, 9000, 0, 9000, 'Completed', 3, 2, null),
  (21, current_date - 75, 185000, 0, 185000, 'Completed', 1, 2, null),
  (22, current_date - 73, 400000, 0, 400000, 'Completed', 2, 2, null),
  (23, current_date - 70, 9000, 0, 9000, 'Completed', 1, 2, null),
  (24, current_date - 68, 290000, 0, 290000, 'Completed', 4, 2, null),
  (25, current_date - 63, 135000, 0, 135000, 'Completed', 4, 2, null),
  (26, current_date - 62, 18500, 0, 18500, 'Completed', 2, 2, null),
  (27, current_date - 58, 115000, 0, 115000, 'Completed', 5, 2, null),
  (28, current_date - 56, 17000, 0, 17000, 'Completed', 2, 2, null),
  (29, current_date - 53, 93000, 0, 93000, 'Completed', 6, 2, null),
  (30, current_date - 49, 485000, 48500.0, 436500.0, 'Completed', 6, 2, 1),
  (31, current_date - 46, 37000, 0, 37000, 'Completed', 1, 2, null),
  (32, current_date - 44, 4500, 0, 4500, 'Completed', 1, 2, null),
  (33, current_date - 40, 245000, 0, 245000, 'Completed', 5, 2, null),
  (34, current_date - 36, 340000, 34000.0, 306000.0, 'Completed', 2, 2, 1),
  (35, current_date - 35, 310000, 0, 310000, 'Completed', 2, 2, null),
  (36, current_date - 30, 25000, 0, 25000, 'Completed', 3, 2, null),
  (37, current_date - 3, 9000, 0, 9000, 'Completed', 1, 2, null),
  (38, current_date - 2, 135000, 13500.0, 121500.0, 'Completed', 3, 2, 1),
  (39, current_date - 1, 310000, 0, 310000, 'Completed', 6, 2, null),
  (40, current_date - 0, 8500, 0, 8500, 'Completed', 6, 2, null);

insert into sales_order_item (item_id, quantity, unit_price, subtotal, order_id, product_id) values
  (1, 1, 18500, 18500, 1, 11),
  (2, 1, 12500, 12500, 2, 10),
  (3, 1, 175000, 175000, 3, 7),
  (4, 1, 175000, 175000, 4, 7),
  (5, 1, 185000, 185000, 4, 1),
  (6, 3, 12500, 37500, 5, 10),
  (7, 1, 185000, 185000, 5, 1),
  (8, 1, 8500, 8500, 6, 9),
  (9, 1, 245000, 245000, 7, 2),
  (10, 2, 12500, 25000, 7, 10),
  (11, 2, 18500, 37000, 8, 11),
  (12, 1, 225000, 225000, 8, 4),
  (13, 1, 12500, 12500, 9, 10),
  (14, 1, 175000, 175000, 10, 7),
  (15, 1, 95000, 95000, 10, 6),
  (16, 1, 115000, 115000, 11, 5),
  (17, 1, 245000, 245000, 12, 2),
  (18, 1, 310000, 310000, 13, 12),
  (19, 1, 245000, 245000, 14, 2),
  (20, 2, 4500, 9000, 15, 8),
  (21, 2, 12500, 25000, 16, 10),
  (22, 1, 95000, 95000, 16, 6),
  (23, 1, 4500, 4500, 17, 8),
  (24, 1, 245000, 245000, 17, 2),
  (25, 1, 245000, 245000, 18, 2),
  (26, 1, 185000, 185000, 18, 1),
  (27, 3, 4500, 13500, 19, 8),
  (28, 1, 115000, 115000, 19, 5),
  (29, 2, 4500, 9000, 20, 8),
  (30, 1, 185000, 185000, 21, 1),
  (31, 1, 225000, 225000, 22, 4),
  (32, 1, 175000, 175000, 22, 7),
  (33, 2, 4500, 9000, 23, 8),
  (34, 1, 115000, 115000, 24, 5),
  (35, 1, 175000, 175000, 24, 7),
  (36, 1, 135000, 135000, 25, 3),
  (37, 1, 18500, 18500, 26, 11),
  (38, 1, 115000, 115000, 27, 5),
  (39, 2, 8500, 17000, 28, 9),
  (40, 3, 12500, 37500, 29, 10),
  (41, 3, 18500, 55500, 29, 11),
  (42, 1, 175000, 175000, 30, 7),
  (43, 1, 310000, 310000, 30, 12),
  (44, 2, 18500, 37000, 31, 11),
  (45, 1, 4500, 4500, 32, 8),
  (46, 1, 245000, 245000, 33, 2),
  (47, 1, 245000, 245000, 34, 2),
  (48, 1, 95000, 95000, 34, 6),
  (49, 1, 175000, 175000, 35, 7),
  (50, 1, 135000, 135000, 35, 3),
  (51, 2, 12500, 25000, 36, 10),
  (52, 2, 4500, 9000, 37, 8),
  (53, 1, 135000, 135000, 38, 3),
  (54, 1, 310000, 310000, 39, 12),
  (55, 1, 8500, 8500, 40, 9);

insert into quotation (quotation_id, request_date, quantity, valid_until, quoted_price, status, supplier_id, product_id) values
  (1, current_date - 70, 10, current_date - 40, 138000, 'Accepted', 1, 7),
  (2, current_date - 50, 5, current_date - 20, 240000, 'Accepted', 3, 12),
  (3, current_date - 30, 10, current_date - 0, 13500, 'Accepted', 3, 11),
  (4, current_date - 12, 20, current_date + 18, 2700, 'Requested', 4, 8),
  (5, current_date - 8, 4, current_date + 22, 182000, 'Rejected', 2, 4);

insert into purchase_order (po_id, order_date, expected_date, total_amount, status, supplier_id, user_id, quotation_id) values
  (1, current_date - 65, current_date - 58, 1380000, 'Paid', 1, 4, 1),
  (2, current_date - 45, current_date - 38, 1200000, 'Received', 3, 4, 2),
  (3, current_date - 25, current_date - 18, 135000, 'Approved', 3, 4, 3),
  (4, current_date - 10, current_date - 3, 54000, 'Pending', 4, 4, null),
  (5, current_date - 15, current_date - 8, 950000, 'Rejected', 1, 4, null),
  (6, current_date - 90, current_date - 82, 210000, 'Paid', 2, 4, null);

insert into purchase_order_item (item_id, quantity, received_qty, unit_cost, po_id, product_id) values
  (1, 10, 10, 138000, 1, 7),
  (2, 5, 5, 240000, 2, 12),
  (3, 10, 0, 13500, 3, 11),
  (4, 20, 0, 2700, 4, 8),
  (5, 10, 0, 95000, 5, 6),
  (6, 20, 20, 10500, 6, 10);

insert into service_job (job_id, job_type, fault, status, request_date, completed_date, service_charge, customer_id, product_id, technician_id) values
  (1, 'Repair', 'PC does not power on', 'Completed', current_date - 100, current_date - 97, 0, 2, 2, 1),
  (2, 'Installation', 'Install new graphics card and drivers', 'Completed', current_date - 80, current_date - 79, 3500, 3, 7, 1),
  (3, 'Repair', 'Laptop keyboard keys not working', 'Completed', current_date - 60, current_date - 57, 2500, 4, 9, 1),
  (4, 'Maintenance', 'Full PC cleaning and thermal paste', 'Completed', current_date - 35, current_date - 34, 4000, 1, 1, 1),
  (5, 'Repair', 'Monitor flickering', 'In Progress', current_date - 12, null, 0, 5, 6, 1),
  (6, 'Repair', 'CPU overheating, fan noise', 'Assigned', current_date - 6, null, 0, 6, 8, 1),
  (7, 'Installation', 'Install extra RAM', 'Pending', current_date - 2, null, 0, 3, 11, null),
  (8, 'Repair', 'SSD not detected', 'Pending', current_date - 1, null, 0, 2, 5, null);

insert into invoice (invoice_id, invoice_date, amount, paid_amount, due_date, status, order_id, job_id) values
  (1, current_date - 136, 18500, 18500, current_date - 122, 'Paid', 1, null),
  (2, current_date - 132, 12500, 12500, current_date - 118, 'Paid', 2, null),
  (3, current_date - 131, 175000, 175000, current_date - 117, 'Paid', 3, null),
  (4, current_date - 128, 360000, 360000, current_date - 114, 'Paid', 4, null),
  (5, current_date - 125, 222500, 222500, current_date - 111, 'Paid', 5, null),
  (6, current_date - 122, 8500, 8500, current_date - 108, 'Paid', 6, null),
  (7, current_date - 118, 270000, 270000, current_date - 104, 'Paid', 7, null),
  (8, current_date - 116, 262000, 262000, current_date - 102, 'Paid', 8, null),
  (9, current_date - 111, 12500, 12500, current_date - 97, 'Paid', 9, null),
  (10, current_date - 109, 270000, 270000, current_date - 95, 'Paid', 10, null),
  (11, current_date - 105, 115000, 115000, current_date - 91, 'Paid', 11, null),
  (12, current_date - 104, 245000, 245000, current_date - 90, 'Paid', 12, null),
  (13, current_date - 99, 310000, 310000, current_date - 85, 'Paid', 13, null),
  (14, current_date - 97, 245000, 245000, current_date - 83, 'Paid', 14, null),
  (15, current_date - 95, 9000, 9000, current_date - 81, 'Paid', 15, null),
  (16, current_date - 90, 120000, 120000, current_date - 76, 'Paid', 16, null),
  (17, current_date - 87, 249500, 249500, current_date - 73, 'Paid', 17, null),
  (18, current_date - 85, 430000, 430000, current_date - 71, 'Paid', 18, null),
  (19, current_date - 81, 128500, 128500, current_date - 67, 'Paid', 19, null),
  (20, current_date - 78, 9000, 9000, current_date - 64, 'Paid', 20, null),
  (21, current_date - 75, 185000, 185000, current_date - 61, 'Paid', 21, null),
  (22, current_date - 73, 400000, 400000, current_date - 59, 'Paid', 22, null),
  (23, current_date - 70, 9000, 9000, current_date - 56, 'Paid', 23, null),
  (24, current_date - 68, 290000, 290000, current_date - 54, 'Paid', 24, null),
  (25, current_date - 63, 135000, 135000, current_date - 49, 'Paid', 25, null),
  (26, current_date - 62, 18500, 18500, current_date - 48, 'Paid', 26, null),
  (27, current_date - 58, 115000, 115000, current_date - 44, 'Paid', 27, null),
  (28, current_date - 56, 17000, 17000, current_date - 42, 'Paid', 28, null),
  (29, current_date - 53, 93000, 93000, current_date - 39, 'Paid', 29, null),
  (30, current_date - 49, 436500.0, 436500.0, current_date - 35, 'Paid', 30, null),
  (31, current_date - 46, 37000, 37000, current_date - 32, 'Paid', 31, null),
  (32, current_date - 44, 4500, 4500, current_date - 30, 'Paid', 32, null),
  (33, current_date - 40, 245000, 245000, current_date - 26, 'Paid', 33, null),
  (34, current_date - 36, 306000.0, 306000.0, current_date - 22, 'Paid', 34, null),
  (35, current_date - 35, 310000, 0, current_date - 21, 'Unpaid', 35, null),
  (36, current_date - 30, 25000, 0, current_date - 16, 'Unpaid', 36, null),
  (37, current_date - 3, 9000, 9000, current_date + 11, 'Paid', 37, null),
  (38, current_date - 2, 121500.0, 0, current_date + 12, 'Unpaid', 38, null),
  (39, current_date - 1, 310000, 310000, current_date + 13, 'Paid', 39, null),
  (40, current_date - 0, 8500, 0, current_date + 14, 'Unpaid', 40, null),
  (41, current_date - 79, 3500, 3500, current_date - 65, 'Paid', null, 2),
  (42, current_date - 57, 2500, 2500, current_date - 43, 'Paid', null, 3),
  (43, current_date - 34, 4000, 0, current_date - 20, 'Unpaid', null, 4);

insert into warranty (warranty_id, start_date, end_date, status, item_id) values
  (1, current_date - 136, current_date + 1688, 'Active', 1),
  (2, current_date - 132, current_date + 232, 'Active', 2),
  (3, current_date - 131, current_date + 963, 'Active', 3),
  (4, current_date - 128, current_date + 966, 'Active', 4),
  (5, current_date - 128, current_date + 966, 'Active', 5),
  (6, current_date - 125, current_date + 239, 'Active', 6),
  (7, current_date - 125, current_date + 969, 'Active', 7),
  (8, current_date - 122, current_date + 60, 'Active', 8),
  (9, current_date - 118, current_date + 976, 'Active', 9),
  (10, current_date - 118, current_date + 246, 'Active', 10),
  (11, current_date - 116, current_date + 1708, 'Active', 11),
  (12, current_date - 116, current_date + 978, 'Active', 12),
  (13, current_date - 111, current_date + 253, 'Active', 13),
  (14, current_date - 109, current_date + 985, 'Active', 14),
  (15, current_date - 109, current_date + 985, 'Active', 15),
  (16, current_date - 105, current_date + 1719, 'Active', 16),
  (17, current_date - 104, current_date + 990, 'Active', 17),
  (18, current_date - 99, current_date + 995, 'Active', 18),
  (19, current_date - 97, current_date + 997, 'Active', 19),
  (20, current_date - 95, current_date + 87, 'Active', 20),
  (21, current_date - 90, current_date + 274, 'Active', 21),
  (22, current_date - 90, current_date + 1004, 'Active', 22),
  (23, current_date - 87, current_date + 95, 'Active', 23),
  (24, current_date - 87, current_date + 1007, 'Active', 24),
  (25, current_date - 85, current_date + 1009, 'Active', 25),
  (26, current_date - 85, current_date + 1009, 'Active', 26),
  (27, current_date - 81, current_date + 101, 'Active', 27),
  (28, current_date - 81, current_date + 1743, 'Active', 28),
  (29, current_date - 78, current_date + 104, 'Active', 29),
  (30, current_date - 75, current_date + 1019, 'Active', 30),
  (31, current_date - 73, current_date + 1021, 'Active', 31),
  (32, current_date - 73, current_date + 1021, 'Active', 32),
  (33, current_date - 70, current_date + 112, 'Active', 33),
  (34, current_date - 68, current_date + 1756, 'Active', 34),
  (35, current_date - 68, current_date + 1026, 'Active', 35),
  (36, current_date - 63, current_date + 1031, 'Active', 36),
  (37, current_date - 62, current_date + 1762, 'Active', 37),
  (38, current_date - 58, current_date + 1766, 'Active', 38),
  (39, current_date - 56, current_date + 126, 'Active', 39),
  (40, current_date - 53, current_date + 311, 'Active', 40),
  (41, current_date - 53, current_date + 1771, 'Active', 41),
  (42, current_date - 49, current_date + 1045, 'Active', 42),
  (43, current_date - 49, current_date + 1045, 'Active', 43),
  (44, current_date - 46, current_date + 1778, 'Active', 44),
  (45, current_date - 44, current_date + 138, 'Active', 45),
  (46, current_date - 40, current_date + 1054, 'Active', 46),
  (47, current_date - 36, current_date + 1058, 'Active', 47),
  (48, current_date - 36, current_date + 1058, 'Active', 48),
  (49, current_date - 35, current_date + 1059, 'Active', 49),
  (50, current_date - 35, current_date + 1059, 'Active', 50),
  (51, current_date - 30, current_date + 334, 'Active', 51),
  (52, current_date - 3, current_date + 179, 'Active', 52),
  (53, current_date - 2, current_date + 1092, 'Active', 53),
  (54, current_date - 1, current_date + 1093, 'Active', 54),
  (55, current_date - 0, current_date + 182, 'Active', 55);

insert into payment (payment_id, payment_date, amount, method, payment_type, receipt_no, cheque_no, user_id, invoice_id, po_id) values
  (1, current_date - 136, 18500, 'Cash', 'Customer', 'RCP-0001', null, 2, 1, null),
  (2, current_date - 132, 12500, 'Card', 'Customer', 'RCP-0002', null, 2, 2, null),
  (3, current_date - 131, 175000, 'Cash', 'Customer', 'RCP-0003', null, 2, 3, null),
  (4, current_date - 128, 360000, 'Cash', 'Customer', 'RCP-0004', null, 2, 4, null),
  (5, current_date - 125, 222500, 'Bank transfer', 'Customer', 'RCP-0005', null, 2, 5, null),
  (6, current_date - 122, 8500, 'Card', 'Customer', 'RCP-0006', null, 2, 6, null),
  (7, current_date - 118, 270000, 'Card', 'Customer', 'RCP-0007', null, 2, 7, null),
  (8, current_date - 116, 262000, 'Cash', 'Customer', 'RCP-0008', null, 2, 8, null),
  (9, current_date - 111, 12500, 'Card', 'Customer', 'RCP-0009', null, 2, 9, null),
  (10, current_date - 109, 270000, 'Bank transfer', 'Customer', 'RCP-0010', null, 2, 10, null),
  (11, current_date - 105, 115000, 'Card', 'Customer', 'RCP-0011', null, 2, 11, null),
  (12, current_date - 104, 245000, 'Card', 'Customer', 'RCP-0012', null, 2, 12, null),
  (13, current_date - 99, 310000, 'Bank transfer', 'Customer', 'RCP-0013', null, 2, 13, null),
  (14, current_date - 97, 245000, 'Bank transfer', 'Customer', 'RCP-0014', null, 2, 14, null),
  (15, current_date - 95, 9000, 'Cash', 'Customer', 'RCP-0015', null, 2, 15, null),
  (16, current_date - 90, 120000, 'Card', 'Customer', 'RCP-0016', null, 2, 16, null),
  (17, current_date - 87, 249500, 'Card', 'Customer', 'RCP-0017', null, 2, 17, null),
  (18, current_date - 85, 430000, 'Card', 'Customer', 'RCP-0018', null, 2, 18, null),
  (19, current_date - 81, 128500, 'Bank transfer', 'Customer', 'RCP-0019', null, 2, 19, null),
  (20, current_date - 78, 9000, 'Card', 'Customer', 'RCP-0020', null, 2, 20, null),
  (21, current_date - 75, 185000, 'Card', 'Customer', 'RCP-0021', null, 2, 21, null),
  (22, current_date - 73, 400000, 'Bank transfer', 'Customer', 'RCP-0022', null, 2, 22, null),
  (23, current_date - 70, 9000, 'Card', 'Customer', 'RCP-0023', null, 2, 23, null),
  (24, current_date - 68, 290000, 'Card', 'Customer', 'RCP-0024', null, 2, 24, null),
  (25, current_date - 63, 135000, 'Cash', 'Customer', 'RCP-0025', null, 2, 25, null),
  (26, current_date - 62, 18500, 'Cash', 'Customer', 'RCP-0026', null, 2, 26, null),
  (27, current_date - 58, 115000, 'Card', 'Customer', 'RCP-0027', null, 2, 27, null),
  (28, current_date - 56, 17000, 'Card', 'Customer', 'RCP-0028', null, 2, 28, null),
  (29, current_date - 53, 93000, 'Cash', 'Customer', 'RCP-0029', null, 2, 29, null),
  (30, current_date - 49, 436500.0, 'Bank transfer', 'Customer', 'RCP-0030', null, 2, 30, null),
  (31, current_date - 46, 37000, 'Cash', 'Customer', 'RCP-0031', null, 2, 31, null),
  (32, current_date - 44, 4500, 'Cash', 'Customer', 'RCP-0032', null, 2, 32, null),
  (33, current_date - 40, 245000, 'Cash', 'Customer', 'RCP-0033', null, 2, 33, null),
  (34, current_date - 36, 306000.0, 'Cash', 'Customer', 'RCP-0034', null, 2, 34, null),
  (35, current_date - 3, 9000, 'Bank transfer', 'Customer', 'RCP-0035', null, 2, 37, null),
  (36, current_date - 1, 310000, 'Card', 'Customer', 'RCP-0036', null, 2, 39, null),
  (37, current_date - 79, 3500, 'Cash', 'Customer', 'RCP-0037', null, 2, 41, null),
  (38, current_date - 57, 2500, 'Cash', 'Customer', 'RCP-0038', null, 2, 42, null),
  (39, current_date - 55, 1380000, 'Cheque', 'Supplier', null, 'CHQ-100231', 5, null, 1),
  (40, current_date - 80, 210000, 'Cheque', 'Supplier', null, 'CHQ-100198', 5, null, 6);

insert into repair_note (note_id, note_date, details, job_id) values
  (1, current_date - 98, 'Power supply checked – faulty PSU replaced under warranty', 1),
  (2, current_date - 79, 'Card installed, drivers updated, stress tested', 2),
  (3, current_date - 58, 'Keyboard replaced with new part', 3),
  (4, current_date - 34, 'Cleaned, thermal paste replaced, temperatures normal', 4),
  (5, current_date - 10, 'Checked cable and panel – waiting for test', 5);

insert into spare_part_request (request_id, quantity, status, request_date, job_id, product_id) values
  (1, 1, 'Issued', current_date - 59, 3, 9),
  (2, 1, 'Issued', current_date - 5, 6, 8),
  (3, 1, 'Requested', current_date - 1, 5, 8);

insert into stock_movement (movement_id, movement_type, quantity, reason, movement_date, product_id, user_id, po_id, job_id) values
  (1, 'In', 20, 'Goods received from supplier', current_date - 84, 10, 3, 6, null),
  (2, 'In', 10, 'Goods received from supplier', current_date - 58, 7, 3, 1, null),
  (3, 'Out', 1, 'Spare part issued for repair', current_date - 59, 9, 3, null, 3),
  (4, 'In', 5, 'Goods received from supplier', current_date - 38, 12, 3, 2, null),
  (5, 'Adjustment', -1, 'Damaged in store', current_date - 20, 10, 3, null, null),
  (6, 'Out', 1, 'Spare part issued for repair', current_date - 5, 8, 3, null, 6);

insert into stock_alert (alert_id, alert_date, status, resolved_date, product_id) values
  (1, current_date - 48, 'Resolved', current_date - 38, 12),
  (2, current_date - 4, 'Open', null, 11),
  (3, current_date - 2, 'Open', null, 12);

insert into return_request (request_id, request_date, reason, status, approved_date, order_id, product_id) values
  (1, current_date - 70, 'Graphics card has dead pixels on output', 'Refunded', current_date - 69, 8, 11),
  (2, current_date - 25, 'Wrong model bought', 'Approved', current_date - 24, 26, 11),
  (3, current_date - 15, 'Changed mind', 'Rejected', current_date - 14, 29, 10),
  (4, current_date - 2, 'Keyboard keys stuck', 'Pending', null, 36, 10);

insert into refund (refund_id, refund_date, amount, method, request_id) values
  (1, current_date - 68, 18500, 'Cash', 1);

insert into report (report_id, report_type, from_date, to_date, created_date, user_id) values
  (1, 'Sales report', current_date - 60, current_date - 30, current_date - 29, 1),
  (2, 'Stock level report', current_date - 30, current_date - 0, current_date - 5, 3),
  (3, 'Income & payments report', current_date - 90, current_date - 0, current_date - 3, 5),
  (4, 'Product sales report', current_date - 30, current_date - 0, current_date - 2, 1),
  (5, 'Outstanding invoices report', current_date - 30, current_date - 0, current_date - 1, 5),
  (6, 'Low stock report', current_date - 7, current_date - 0, current_date - 1, 3);

-- keep the id counters after the numbers used above, so new records continue from the next number
select setval(pg_get_serial_sequence('"user"', 'user_id'), greatest((select coalesce(max(user_id), 0) from "user"), 1));
select setval(pg_get_serial_sequence('role', 'role_id'), greatest((select coalesce(max(role_id), 0) from role), 1));
select setval(pg_get_serial_sequence('permission', 'permission_id'), greatest((select coalesce(max(permission_id), 0) from permission), 1));
select setval(pg_get_serial_sequence('technician', 'technician_id'), greatest((select coalesce(max(technician_id), 0) from technician), 1));
select setval(pg_get_serial_sequence('category', 'category_id'), greatest((select coalesce(max(category_id), 0) from category), 1));
select setval(pg_get_serial_sequence('product', 'product_id'), greatest((select coalesce(max(product_id), 0) from product), 1));
select setval(pg_get_serial_sequence('supplier', 'supplier_id'), greatest((select coalesce(max(supplier_id), 0) from supplier), 1));
select setval(pg_get_serial_sequence('customer', 'customer_id'), greatest((select coalesce(max(customer_id), 0) from customer), 1));
select setval(pg_get_serial_sequence('discount', 'discount_id'), greatest((select coalesce(max(discount_id), 0) from discount), 1));
select setval(pg_get_serial_sequence('sales_order', 'order_id'), greatest((select coalesce(max(order_id), 0) from sales_order), 1));
select setval(pg_get_serial_sequence('sales_order_item', 'item_id'), greatest((select coalesce(max(item_id), 0) from sales_order_item), 1));
select setval(pg_get_serial_sequence('invoice', 'invoice_id'), greatest((select coalesce(max(invoice_id), 0) from invoice), 1));
select setval(pg_get_serial_sequence('warranty', 'warranty_id'), greatest((select coalesce(max(warranty_id), 0) from warranty), 1));
select setval(pg_get_serial_sequence('return_request', 'request_id'), greatest((select coalesce(max(request_id), 0) from return_request), 1));
select setval(pg_get_serial_sequence('refund', 'refund_id'), greatest((select coalesce(max(refund_id), 0) from refund), 1));
select setval(pg_get_serial_sequence('quotation', 'quotation_id'), greatest((select coalesce(max(quotation_id), 0) from quotation), 1));
select setval(pg_get_serial_sequence('purchase_order', 'po_id'), greatest((select coalesce(max(po_id), 0) from purchase_order), 1));
select setval(pg_get_serial_sequence('purchase_order_item', 'item_id'), greatest((select coalesce(max(item_id), 0) from purchase_order_item), 1));
select setval(pg_get_serial_sequence('payment', 'payment_id'), greatest((select coalesce(max(payment_id), 0) from payment), 1));
select setval(pg_get_serial_sequence('service_job', 'job_id'), greatest((select coalesce(max(job_id), 0) from service_job), 1));
select setval(pg_get_serial_sequence('repair_note', 'note_id'), greatest((select coalesce(max(note_id), 0) from repair_note), 1));
select setval(pg_get_serial_sequence('spare_part_request', 'request_id'), greatest((select coalesce(max(request_id), 0) from spare_part_request), 1));
select setval(pg_get_serial_sequence('stock_movement', 'movement_id'), greatest((select coalesce(max(movement_id), 0) from stock_movement), 1));
select setval(pg_get_serial_sequence('stock_alert', 'alert_id'), greatest((select coalesce(max(alert_id), 0) from stock_alert), 1));
select setval(pg_get_serial_sequence('report', 'report_id'), greatest((select coalesce(max(report_id), 0) from report), 1));

-- check: every staff e-mail must also exist in Authentication -> Users (this should return NO rows)
select u.email as missing_login from "user" u where not exists (select 1 from auth.users a where lower(a.email) = lower(u.email));
