# Unit tests

Run all tests:

```
npm test
```

(the first time, run `npm install` so Vitest is installed)

| File | What it checks |
|---|---|
| `logic.test.js` | The calculations and checks inside the classes: sales order total, adding the same product again, stock check (not enough stock / inactive product / bad quantity), remove item, discount rate, purchase order total, payment amount check, `CustomerPayment` and `SupplierPayment` inherit from `Payment`, low stock, warranty valid / expired, overdue invoice, payment reminder needs an e-mail, job status steps, date and money helpers |
| `roles-and-classes.test.js` | The system matches the diagrams: 35 permissions (one per use case), every menu permission exists in the database and every permission opens a page, the first page after log in follows the role's permissions, and every class has the methods drawn in the class diagram |

The tests do not need the database: the one method that reads a product (stock check) uses a small fake product list.
