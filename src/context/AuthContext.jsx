import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import User from '../classes/User';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);           // the signed-in staff member, with role and permissions
  const [restoring, setRestoring] = useState(isSupabaseConfigured);
  const [recovery, setRecovery] = useState(false);  // true after opening the password reset link

  // keep the user signed in after a page refresh
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let done = false;
    supabase.auth.getSession().then(async ({ data }) => {
      const email = data?.session?.user?.email;
      if (email && !done) { try { setUser(await User.loadSession(email)); } catch { /* not allowed any more */ } }
      if (!done) setRestoring(false);
    }).catch(() => setRestoring(false));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => { done = true; sub?.subscription?.unsubscribe(); };
  }, []);

  const login = useCallback(async (email, password) => { const u = await User.login(email, password); setUser(u); return u; }, []);
  const logout = useCallback(async () => { await User.logout(); setUser(null); }, []);
  const refresh = useCallback(async () => { if (user) setUser(await User.loadSession(user.email)); }, [user]);
  // can('Create sales order') -> true when the role of the user has this permission
  const can = useCallback((perm) => !!user && user.permissions.includes(perm), [user]);
  const canAny = useCallback((perms) => perms.some(p => can(p)), [can]);

  return (
    <AuthContext.Provider value={{ user, login, logout, refresh, can, canAny, restoring, recovery, setRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
