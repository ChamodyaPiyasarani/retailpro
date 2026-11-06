// Class: RepairNote  (table: repair_note)   part of ServiceJob (composition)
import { insertRow, readAll, today } from './db';

export default class RepairNote {
  // + add()
  static add(jobId, details) {
    if (!String(details || '').trim()) throw new Error('Please enter the repair details.');
    return insertRow('repair_note', { note_date: today(), details: details.trim(), job_id: jobId });
  }
  // + getByJob()
  static getByJob(jobId) { return readAll('repair_note', { job_id: jobId }, 'note_id'); }
}
