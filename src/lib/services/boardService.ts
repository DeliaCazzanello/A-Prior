// lib/services/taskService.ts
import { createClient } from '../supabase/client';
// En boardService.ts
import { ProfileService } from './profilesService'; // Asegúrate de tener importado tu profileService

const supabase = createClient();

export const BoardService = {
    async createBoard(
        board: { name: string, description: string, date: string },
        emailsString: string // <-- Recibe la cadena de correos desde el componente
    ) {
        // 1. Obtener el usuario autenticado (el creador del tablero)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No hay usuario autenticado");

        const teamIds: string[] = [];

        // 2. Procesar la cadena de correos si no está vacía
        if (emailsString && emailsString.trim().length > 0) {
            // Separamos por comas, quitamos espacios vacíos y filtramos textos nulos
            const emailsArray = emailsString
                .split(',')
                .map(email => email.trim().toLowerCase())
                .filter(email => email.length > 0);

            // Buscamos de forma directa el UUID de cada correo en la tabla profiles
            for (const email of emailsArray) {
                const uuid = await ProfileService.getUserByEmail(email);
                if (uuid) {
                    teamIds.push(uuid);
                } else {
                    console.warn(`El usuario con correo ${email} no está registrado.`);
                }
            }
        }

        // 3. Incluir el user_id y el array de UUIDs (team) listo para PostgreSQL
        const boardWithUser = {
            name: board.name,
            description: board.description,
            date: board.date || null,
            user_id: user.id,
            team: teamIds // Guardamos directamente el array de UUIDs mapeados
        };

        // 4. Insertar en Supabase
        const { data, error } = await supabase
            .from('board')
            .insert([boardWithUser])
            .select()
            .single();

        if (error) throw error;
        return data;
    },
    // Leer: RLS filtra automáticamente por el usuario logueado
    // lib/services/boardService.ts

    async getBoards() {
        // 1. Obtenemos el usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return [];

        // 2. Consulta limpia: Filtra tableros propios o donde contenga el ID en el equipo
        const { data, error } = await supabase
            .from('board')
            .select('*')
            .or(`user_id.eq.${user.id}, team.cs.{"${user.id}"}`) // <-- Envolvemos el UUID en comillas dobles internas
            .order('date', { ascending: true });

        if (error) {
            console.error("Error cargando tableros:", error.message);
            throw error;
        }

        return data;
    },
    // Actualizar: El filtro .eq('id', id) sigue funcionando igual
    async updateBoard(id: number, updates: any) {
        const { data, error } = await supabase
            .from('board')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBoard(id: number) {
        await supabase.from('task').delete().eq('board_id', id);
        await supabase.from('invitation').delete().eq('board_id', id);

        const { error } = await supabase
            .from('board')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};