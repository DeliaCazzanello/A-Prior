import { createClient } from '../supabase/client';

const supabase = createClient();

export interface EnrichedInvitation {
  id: number;
  sender_id: string;
  receiver_id: string;
  board_id: number;
  state: string;
  created_at: string;
  boardName: string;
  senderEmail: string;
  senderUsername: string | null;
}

export const InvitationService = {
  async getPendingInvitations(): Promise<EnrichedInvitation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: invitations, error } = await supabase
      .from('invitation')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('state', 'pending')
      .order('created_at', { ascending: true });

    if (error || !invitations || invitations.length === 0) return [];

    const boardIds = [...new Set(invitations.map((i: any) => i.board_id))];
    const senderIds = [...new Set(invitations.map((i: any) => i.sender_id))];

    const [{ data: boards }, { data: profiles }] = await Promise.all([
      supabase.from('board').select('id, name').in('id', boardIds),
      supabase.from('profiles').select('id, email, username').in('id', senderIds),
    ]);

    return invitations.map((inv: any) => ({
      ...inv,
      boardName: boards?.find((b: any) => b.id === inv.board_id)?.name ?? `Tablero #${inv.board_id}`,
      senderEmail: profiles?.find((p: any) => p.id === inv.sender_id)?.email ?? 'Usuario desconocido',
      senderUsername: profiles?.find((p: any) => p.id === inv.sender_id)?.username ?? null,
    }));
  },

  async getPendingCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('invitation')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('state', 'pending');

    if (error) return 0;
    return count ?? 0;
  },

  async acceptInvitation(id: number, boardId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    const { data: board, error: boardError } = await supabase
      .from('board')
      .select('team')
      .eq('id', boardId)
      .single();

    if (boardError) throw boardError;

    const currentTeam: string[] = board.team ?? [];
    if (!currentTeam.includes(user.id)) {
      currentTeam.push(user.id);
    }

    const [{ error: invError }, { error: teamError }] = await Promise.all([
      supabase.from('invitation').update({ state: 'accepted' }).eq('id', id),
      supabase.from('board').update({ team: currentTeam }).eq('id', boardId),
    ]);

    if (invError) throw invError;
    if (teamError) throw teamError;
  },

  async rejectInvitation(id: number): Promise<void> {
    const { error } = await supabase
      .from('invitation')
      .update({ state: 'rejected' })
      .eq('id', id);

    if (error) throw error;
  },

  async sendInvitation(receiverEmail: string, boardId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay usuario autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', receiverEmail.trim().toLowerCase())
      .maybeSingle();

    if (!profile) throw new Error(`No se encontró usuario con el correo: ${receiverEmail}`);

    const { error } = await supabase.from('invitation').insert([{
      sender_id: user.id,
      receiver_id: profile.id,
      board_id: boardId,
      state: 'pending',
      created_at: new Date().toISOString(),
    }]);

    if (error) throw error;
  },
};
