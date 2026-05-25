import { createClient } from '../supabase/client';

const supabase = createClient();

export const ProfileService = {
  /**
   * Busca el UUID de un usuario en la tabla pública 'profiles' a través de su correo.
   * Útil para cuando invitas a alguien a un tablero usando su email.
   */
  async getUserByEmail(email: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle(); // Usamos maybeSingle para que no lance excepción si no lo encuentra

    if (error) {
      console.error("Error al buscar el perfil por correo:", error.message);
      return null;
    }

    return data ? data.id : null;
  },

  /**
   * Obtiene el perfil completo del usuario actual (nombre, avatar, etc.)
   */
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async getProfilesByIds(ids: string[]): Promise<{ id: string; username: string | null; email: string }[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email')
      .in('id', ids);
    if (error) return [];
    return data || [];
  },
};