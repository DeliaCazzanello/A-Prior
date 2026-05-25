import { Task } from '../../TaskBoard'; // Asegúrate de que Task esté exportado en TaskBoard.tsx
import React from 'react';

interface RenderPriorityViewProps {
  tasksToShow: Task[];
  getTaskScore: (task: Task) => number;
  renderTaskCard: (task: Task) => React.ReactElement;
}

export default function RenderPriorityView({ 
  tasksToShow, 
  getTaskScore, 
  renderTaskCard 
}: RenderPriorityViewProps) {
    const priorityGroups = [
      {
        label: 'Alta',
        min: 13,
        max: Infinity,
        color: 'bg-red-500'
      },
      {
        label: 'Media',
        min: 5,
        max: 12,
        color: 'bg-yellow-500'
      },
      {
        label: 'Baja',
        min: -Infinity,
        max: 4,
        color: 'bg-green-500'
      }
    ];

    return (
      <div className="space-y-6">
        {priorityGroups.map((group) => {
          // 1. Aquí filtramos las tareas que pertenecen SOLO a este grupo
          const tasksInThisGroup = tasksToShow.filter((task) => {
            const score = getTaskScore(task);
            return score >= group.min && score <= group.max && task.status !== 'completado';
          });

          // 2. Si no hay tareas en este nivel de prioridad, no renderizamos el encabezado
          if (tasksInThisGroup.length === 0) return null;

          return (
            <div key={group.label}>
              <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2 text-white">
                <div className={`w-3 h-3 rounded-full ${group.color}`} />
                Prioridad {group.label}
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-2">
                  {tasksInThisGroup.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 3. IMPORTANTE: Usamos tasksInThisGroup aquí */}
                {tasksInThisGroup
                  .sort((a, b) => getTaskScore(b) - getTaskScore(a))
                  .map(renderTaskCard)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };