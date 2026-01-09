export type Priority = 'alta' | 'media' | 'baja';
export type Status = 'por-hacer' | 'en-progreso' | 'completado';

export interface Task {
  id?: number;          // int8 (generado automáticamente)
  date: string;        // date
  name: string;        // varchar (título)
  description: string; // varchar
  state: Status;       // varchar (mapeado a tu Status)
  priority: number;    // int2 (aquí puedes guardar 1, 2, 3 según la urgencia)
  user_id?: string;    // Importante: para que cada usuario vea sus propias tareas
}