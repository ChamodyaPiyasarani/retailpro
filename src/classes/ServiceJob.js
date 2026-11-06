// Class: ServiceJob  (table: service_job)
// status: Pending -> Assigned -> In Progress -> Completed
import { readAll, readOne, insertRow, updateRow, run, table, today } from './db';
import Technician from './Technician';
import RepairNote from './RepairNote';
import SparePartRequest from './SparePartRequest';
import Invoice from './Invoice';

export const JOB_STEPS = ['Pending', 'Assigned', 'In Progress', 'Completed'];

export default class ServiceJob {
  // + register()  – SD "Register service request"
  static register({ customer_id, product_id, job_type, fault }) {
    if (!customer_id || !product_id || !job_type) throw new Error('Please choose the customer, product and job type.');
    if (!String(fault || '').trim()) throw new Error('Please enter the fault');
    return insertRow('service_job', { job_type, fault: fault.trim(), status: 'Pending', request_date: today(), service_charge: 0,
      customer_id: Number(customer_id), product_id: Number(product_id), technician_id: null });
  }
  // + assignTechnician()  – SD "Assign technician to service job"
  static async assignTechnician(jobId, technicianId) {
    const t = await readOne('technician', 'technician_id', Number(technicianId));
    if (!t || !t.is_available) throw new Error('Technician is not available');
    const job = await updateRow('service_job', 'job_id', jobId, { technician_id: t.technician_id, status: 'Assigned' });
    await Technician.setAvailability(t.technician_id, false);
    return job;
  }
  // + updateStatus()  – SD "Update job status": new status + repair note (+ spare part request)
  static async updateStatus(jobId, { status, details, service_charge = 0, spare = null }) {
    const job = await readOne('service_job', 'job_id', jobId);
    if (job.status === 'Completed') throw new Error('Job is already completed');
    if (JOB_STEPS.indexOf(status) < JOB_STEPS.indexOf(job.status)) throw new Error('The status cannot go back.');
    let saved = await updateRow('service_job', 'job_id', jobId, { status });
    await RepairNote.add(jobId, details);
    if (spare?.product_id) await SparePartRequest.request(jobId, spare.product_id, spare.quantity);
    let invoice = null;
    if (status === 'Completed') ({ job: saved, invoice } = await ServiceJob.complete(jobId, service_charge));
    return { job: saved, invoice };
  }
  // + complete()  – completed date, technician free again, service invoice when there is a charge
  static async complete(jobId, serviceCharge = 0) {
    const charge = Number(serviceCharge) || 0;
    if (charge < 0) throw new Error('The service charge cannot be negative.');
    const job = await updateRow('service_job', 'job_id', jobId, { status: 'Completed', completed_date: today(), service_charge: charge });
    if (job.technician_id) await Technician.setAvailability(job.technician_id, true);
    const invoice = charge > 0 ? await Invoice.generate({ job_id: jobId, amount: charge }) : null;
    return { job, invoice };
  }
  // + viewHistory()  – SD "View service history": past jobs of a product or a customer, with their notes
  static async viewHistory({ product_id = '', customer_id = '' }) {
    let q = table('service_job').select('*').order('request_date', { ascending: false });
    if (product_id) q = q.eq('product_id', Number(product_id));
    if (customer_id) q = q.eq('customer_id', Number(customer_id));
    const jobs = await run(q);
    if (!jobs.length) return [];
    const notes = await run(table('repair_note').select('*').in('job_id', jobs.map(j => j.job_id)));
    return jobs.map(j => ({ ...j, notes: notes.filter(n => n.job_id === j.job_id) }));
  }
  static getAll() { return readAll('service_job', {}, 'job_id'); }
}
