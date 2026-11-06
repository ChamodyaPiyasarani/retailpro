// Class: Permission  (table: permission)
// A permission is one function of the system, e.g. "Create sales order".
import { readAll, run, table } from './db';

export default class Permission {
  // + getAll()
  static getAll() {
    return readAll('permission', {}, 'permission_id');
  }

  // + getByModule()
  static getByModule(module) {
    return run(table('permission').select('*').eq('module', module).order('permission_id'));
  }
}
