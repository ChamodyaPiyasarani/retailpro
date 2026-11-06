// Class: Technician  (tables: technician, technician_specialisation)
// Technician is a kind of User (generalization). "specialisations" is a
// multivalued attribute, so it is kept in its own table.
import { run, table, insertRow, updateRow, readAll } from './db';

export default class Technician {
  // + create()  – called when a user gets the Technician role
  static async create({ user_id, experience_years = 0, specialisations = [] }) {
    const tech = await insertRow('technician', { user_id, is_available: true, experience_years: Number(experience_years) || 0 });
    for (const s of specialisations) await Technician.addSpecialisation(tech.technician_id, s);
    return tech;
  }

  // + viewAssignedJobs()  – SD "View assigned jobs"
  static viewAssignedJobs(technicianId) {
    return run(table('service_job').select('*').eq('technician_id', technicianId).neq('status', 'Completed').order('request_date'));
  }

  // + setAvailability()
  static setAvailability(technicianId, isAvailable) {
    return updateRow('technician', 'technician_id', technicianId, { is_available: isAvailable });
  }

  // + addSpecialisation()
  static async addSpecialisation(technicianId, specialisation) {
    const s = String(specialisation || '').trim();
    if (!s) return null;
    const have = await readAll('technician_specialisation', { technician_id: technicianId });
    if (have.some(h => h.specialisation.toLowerCase() === s.toLowerCase())) return null;
    return insertRow('technician_specialisation', { technician_id: technicianId, specialisation: s });
  }

  // available technicians with their names and specialisations (for "Assign technician")
  static async getAvailable() {
    const techs = await run(table('technician').select('*').eq('is_available', true));
    return Technician.withNames(techs);
  }
  static async getAll() { return Technician.withNames(await readAll('technician', {}, 'technician_id')); }
  static async withNames(techs) {
    const users = await readAll('user');
    const specs = await readAll('technician_specialisation');
    return techs.map(t => ({ ...t, name: users.find(u => u.user_id === t.user_id)?.name || `Technician ${t.technician_id}`,
      specialisations: specs.filter(s => s.technician_id === t.technician_id).map(s => s.specialisation) }));
  }
}
