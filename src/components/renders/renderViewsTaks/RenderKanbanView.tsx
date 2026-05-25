import { Task } from '../../TaskBoard'; // Asegúrate de que Task esté exportado en TaskBoard.tsx
import { Status } from '../../TaskBoard'; // Asegúrate de que Status esté exportado en TaskBoard.tsx
import React from 'react';

interface RenderKanbanViewProps {
  tasksToShow: Task[];
  getTaskScore: (task: Task) => number;
  renderTaskCard: (task: Task) => React.ReactElement;
}

export default function RenderKanbanView({ 
  tasksToShow, 
  getTaskScore, 
  renderTaskCard 
}: RenderKanbanViewProps) {
  
    const statuses: Status[] = ['por-hacer', 'en-progreso', 'completado'];
    const statusLabels = {
      'por-hacer': 'Por Hacer',
      'en-progreso': 'En Progreso',
      'completado': 'Completado',
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statuses.map((status) => (
          <div key={status} className="bg-gray-800/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
            <h3 className="font-semibold mb-4 text-white flex justify-between items-center">
              {statusLabels[status]}
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                {tasksToShow.filter(t => t.status === status).length}
              </span>
            </h3>
            <div className="space-y-3">
              {/* Aquí filtramos del array que recibimos por parámetro */}
              {tasksToShow
                .filter((task) => task.status === status)
                .sort((a, b) => getTaskScore(b) - getTaskScore(a)) // Opcional: ordenar por prioridad dentro de la columna
                .map(renderTaskCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };