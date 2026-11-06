// Unit tests for the calculations and checks inside the classes (no database needed).
import { describe, it, expect, vi } from 'vitest';

// a tiny fake "Database" for the methods that read one product (stock check)
const PRODUCTS = {
  1: { product_id: 1, product_name: 'Laptop', unit_price: 200000, warranty_months: 12, stock_qty: 3, is_active: true },
  2: { product_id: 2, product_name: 'Mouse', unit_price: 2500, warranty_months: 6, stock_qty: 10, is_active: true },
  3: { product_id: 3, product_name: 'Old Printer', unit_price: 9000, warranty_months: 0, stock_qty: 5, is_active: false },
};
vi.mock('../src/classes/db', async (orig) => ({
  ...(await orig()),
  readOne: async (name, pk, id) => (name === 'product' ? PRODUCTS[id] || null : null),
}));
import SalesOrder from '../src/classes/SalesOrder';
import SalesOrderItem from '../src/classes/SalesOrderItem';
import PurchaseOrder from '../src/classes/PurchaseOrder';
import PurchaseOrderItem from '../src/classes/PurchaseOrderItem';
import Payment from '../src/classes/Payment';
import CustomerPayment from '../src/classes/CustomerPayment';
import SupplierPayment from '../src/classes/SupplierPayment';
import Product from '../src/classes/Product';
import Warranty from '../src/classes/Warranty';
import Invoice from '../src/classes/Invoice';
import Discount from '../src/classes/Discount';
import { JOB_STEPS } from '../src/classes/ServiceJob';
import { today, addDays, addMonths, money } from '../src/classes/db';

const mouse = PRODUCTS[2];

describe('SalesOrder – Create sales order', () => {
  it('adds items and calculates the total', async () => {
    let o = { items: [], discount: null };
    o = await SalesOrder.addItem(o, 1, 1);
    o = await SalesOrder.addItem(o, 2, 2);
    expect(o.items).toHaveLength(2);
    expect(o.subtotal).toBe(205000);
    expect(o.discount_amount).toBe(0);
    expect(o.total_amount).toBe(205000);
  });
  it('adding the same product again increases its quantity', async () => {
    let o = await SalesOrder.addItem({ items: [] }, 2, 1);
    o = await SalesOrder.addItem(o, 2, 3);
    expect(o.items).toHaveLength(1);
    expect(o.items[0].quantity).toBe(4);
    expect(o.items[0].subtotal).toBe(10000);
  });
  it('stops when there is not enough stock (include "Check stock")', async () => {
    await expect(SalesOrder.addItem({ items: [] }, 1, 4)).rejects.toThrow(/Not enough stock/);
    const o = await SalesOrder.addItem({ items: [] }, 1, 3);
    await expect(SalesOrder.addItem(o, 1, 1)).rejects.toThrow(/Not enough stock/);
  });
  it('an inactive product or a bad quantity cannot be sold', async () => {
    await expect(SalesOrder.addItem({ items: [] }, 3, 1)).rejects.toThrow(/cannot be sold/);
    await expect(SalesOrder.addItem({ items: [] }, 2, 0)).rejects.toThrow(/quantity/);
  });
  it('removes an item', async () => {
    let o = await SalesOrder.addItem(await SalesOrder.addItem({ items: [] }, 1, 1), 2, 1);
    o = SalesOrder.removeItem(o, 1);
    expect(o.items.map(i => i.product_id)).toEqual([2]);
    expect(o.total_amount).toBe(2500);
  });
  it('applies a discount rate (extend "Apply discount")', () => {
    const o = SalesOrder.calculateTotal({ items: [{ ...mouse, quantity: 4 }], discount: { rate: 10 } });
    expect(o.discount_amount).toBe(1000);
    expect(o.total_amount).toBe(9000);
  });
  it('item subtotal = quantity × price', () => {
    expect(SalesOrderItem.calculateSubtotal({ quantity: 3, unit_price: 150.5 })).toBeCloseTo(451.5);
  });
});

describe('Discount', () => {
  it('getRate gives 0 when there is no discount', () => {
    expect(Discount.getRate(null)).toBe(0);
    expect(Discount.getRate({ rate: '15' })).toBe(15);
  });
});

describe('PurchaseOrder – Create purchase order', () => {
  it('total is the sum of item subtotals', () => {
    const items = [{ quantity: 5, unit_cost: 1000 }, { quantity: 2, unit_cost: 250 }];
    expect(PurchaseOrderItem.calculateSubtotal(items[0])).toBe(5000);
    expect(PurchaseOrder.calculateTotal(items)).toBe(5500);
  });
});

describe('Payment (CustomerPayment and SupplierPayment inherit from it)', () => {
  it('checkAmount accepts 0 < amount <= amount due', () => {
    expect(Payment.checkAmount(100, 100)).toBe(true);
    expect(Payment.checkAmount(50, 100)).toBe(true);
    expect(Payment.checkAmount(0, 100)).toBe(false);
    expect(Payment.checkAmount(-5, 100)).toBe(false);
    expect(Payment.checkAmount(101, 100)).toBe(false);
  });
  it('generalization: both payment types extend Payment', () => {
    expect(Object.getPrototypeOf(CustomerPayment)).toBe(Payment);
    expect(Object.getPrototypeOf(SupplierPayment)).toBe(Payment);
    expect(CustomerPayment.checkAmount(10, 20)).toBe(true);
  });
});

describe('Product – low stock', () => {
  it('is low when stock is at or below the reorder level', () => {
    expect(Product.isLowStock({ stock_qty: 5, reorder_level: 5 })).toBe(true);
    expect(Product.isLowStock({ stock_qty: 2, reorder_level: 5 })).toBe(true);
    expect(Product.isLowStock({ stock_qty: 6, reorder_level: 5 })).toBe(false);
    expect(Product.isLowStock(null)).toBe(false);
  });
});

describe('Warranty – Check warranty status', () => {
  it('valid until the end date (inclusive)', () => {
    expect(Warranty.isValid({ end_date: today() })).toBe(true);
    expect(Warranty.isValid({ end_date: addDays(today(), 30) })).toBe(true);
    expect(Warranty.isValid({ end_date: addDays(today(), -1) })).toBe(false);
    expect(Warranty.isValid(null)).toBe(false);
  });
});

describe('Invoice – View outstanding invoices', () => {
  it('an unpaid invoice past its due date is overdue', () => {
    expect(Invoice.isOverdue({ status: 'Unpaid', due_date: addDays(today(), -1) })).toBe(true);
    expect(Invoice.isOverdue({ status: 'Unpaid', due_date: addDays(today(), 3) })).toBe(false);
    expect(Invoice.isOverdue({ status: 'Paid', due_date: addDays(today(), -10) })).toBe(false);
  });
  it('a reminder needs the customer e-mail', () => {
    expect(() => Invoice.sendReminder({ amount: 10, paid_amount: 0 }, { name: 'A' })).toThrow(/e-mail/);
  });
});

describe('ServiceJob – status steps', () => {
  it('has the four steps in order', () => {
    expect(JOB_STEPS).toEqual(['Pending', 'Assigned', 'In Progress', 'Completed']);
  });
});

describe('date and money helpers', () => {
  it('adds days and months', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addMonths('2026-01-15', 12)).toBe('2027-01-15');
  });
  it('formats rupees', () => {
    expect(money(1234.5)).toMatch(/^Rs\. 1,234\.50$/);
  });
});
