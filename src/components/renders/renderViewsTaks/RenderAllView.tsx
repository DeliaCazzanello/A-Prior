import { Task } from '../../TaskBoard'; // Asegúrate de que Task esté exportado en TaskBoard.tsx
import React from 'react';

interface RenderAllViewProps {
  tasksToShow: Task[];
  getTaskScore: (task: Task) => number;
  renderTaskCard: (task: Task) => React.ReactElement;
}

export default function RenderAllView({ 
  tasksToShow, 
  getTaskScore, 
  renderTaskCard 
}: RenderAllViewProps) {
  
  // Ordenamos las tareas por puntaje antes de mapearlas
  const sortedTasks = [...tasksToShow].sort((a, b) => getTaskScore(b) - getTaskScore(a));

  return (
    <div className="space-y-3">
      {sortedTasks.length > 0 ? (
        sortedTasks.map((task) => (
          <div key={task.id}>
            {renderTaskCard(task)}
          </div>
        ))
      ) : (
        <div className="text-center py-10 text-gray-400 bg-gray-800/20 rounded-xl border border-dashed border-white/10">
          No hay tareas para mostrar en esta vista.
        </div>
      )}
    </div>
  );
}