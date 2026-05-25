// lib/services/taskService.ts
import { createClient } from '../supabase/client';

const supabase = createClient();

export const TaskService = {
    // Crear: El user_id se asigna solo en la DB
    async createTask(task: {
        name: string;
        description: string;
        state: string;
        importance: number;
        date: string;
        priority: number;
        board_id: number | null;
        assignated_to?: string[]; // Campo opcional por si lo agregas directo
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        // Construimos el payload con los nombres EXACTOS de tus columnas en Postgres
        const taskPayload = {
            name: task.name,
            description: task.description || null,
            state: task.state,
            importance: task.importance,
            date: task.date || null,
            priority: task.priority,
            board_id: task.board_id,
            user_id: user.id,
            // Nos aseguramos de enviar el array de asignados solo si existe en tu tabla
            assignated_to: task.assignated_to || []
        };

        const { data, error } = await supabase
            .from('task')
            .insert([taskPayload])
            .select()
            .single();

        if (error) {
            console.error("Error en PostgREST al insertar tarea:", error.message);
            throw error;
        }
        return data;
    },

    // Leer: RLS filtra automáticamente por el usuario logueado
    // lib/services/taskService.ts

    // lib/services/taskService.ts

    async getTasks() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // 1. Traer tareas que te pertenecen directamente (sin importar el tablero)
        const { data: ownTasks, error: err1 } = await supabase
            .from('task')
            .select('*')
            .eq('user_id', user.id);

        if (err1) throw err1;

        // 2. Traer tareas de los tableros de los que eres dueño o miembro del equipo
        const { data: boardTasks, error: err2 } = await supabase
            .from('task')
            .select(`
        *,
        board!inner (
          id,
          user_id,
          team
        )
      `)
            // Filtramos en la tabla 'board' usando sintaxis limpia
            .or(`user_id.eq.${user.id},team.cs.{"${user.id}"}`, { foreignTable: 'board' });

        if (err2) throw err2;

        // 3. Unir ambos resultados en un solo array eliminando duplicados por ID
        const allTasks = [...(ownTasks || []), ...(boardTasks || [])];
        const uniqueTasks = allTasks.filter(
            (task, index, self) => self.findIndex(t => t.id === task.id) === index
        );

        // Ordenar por fecha de forma ascendente
        return uniqueTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    async getTasksByBoard(boardId: number) {
        // Obtenemos el usuario actual
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return []; // Si no hay usuario, no devolvemos nada

        const { data, error } = await supabase
            .from('task')
            .select('*')
            // Aunque RLS lo hace por nosotros, añadir el .eq es una buena práctica de claridad
            .eq('board_id', boardId)
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Actualizar: El filtro .eq('id', id) sigue funcionando igual
    async updateTask(id: number, updates: any) {
        const { data, error } = await supabase
            .from('task')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTask(id: number) {
        const { error } = await supabase
            .from('task')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};