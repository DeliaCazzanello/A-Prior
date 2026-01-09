import { createClient } from '../supabase/client';

export const AccountService = {

    /**
     * Create a new account
     * @param email - The email of the account
     * @param password - The password of the account
     * @returns The data of the account
     */
  async createAccount(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Login to the account
   * @param email - The email of the account
   * @param password - The password of the account
   * @returns The data of the account
   */
  async login(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Logout from the account
   */
  async logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },
};