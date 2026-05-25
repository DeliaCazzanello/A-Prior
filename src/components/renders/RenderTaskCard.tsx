import { Task } from '../TaskBoard';
import React from 'react';
import { Card } from '../ui/card';
import { MoreVertical, Edit, Trash2, Calendar } from 'lucide-react';
import calculatePriorityValue from '../TaskBoard';

interface RenderTaskCardProps {
  calculatePriorityValue: (weight: number, dueDate: string) => number;
  setOpenMenuId: React.Dispatch<React.SetStateAction<number | null>>;
  openMenuId: number | null;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setNewTask: React.Dispatch<React.SetStateAction<Task>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  handleDeleteTask: (id: number) => void;
  task: Task;
}

export function RenderTaskCard({
  calculatePriorityValue,
  setOpenMenuId,
  openMenuId,
  setEditingTask,
  setNewTask,
  tasks,
  setTasks,
  handleDeleteTask,
  task,
}: RenderTaskCardProps) {
  const weight = task.importance === 'alta' ? 5 : task.importance === 'media' ? 3 : 1;
  const score = calculatePriorityValue(weight, task.dueDate);
  const isCompleted = task.status === 'completado';

  return (
    <Card key={task.id} className="p-4 mb-3 border border-white/20 hover:shadow-lg transition-all backdrop-blur-md bg-white/10 relative">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 mb-1">

          {!isCompleted && (
            <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${score >= 13 ? 'bg-red-500' : score >= 5 ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
          )}

          <h3 className={`font-semibold text-white ${isCompleted ? 'line-through opacity-50' : ''}`}>
            {task.title}
          </h3>

          {!isCompleted && (
            <h2 className="text-xs text-gray-500 ml-2">{score}</h2>
          )}
        </div>

        <div className="relative">
          <button
            className="text-white/60 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {openMenuId === task.id && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenuId(null)}
              />
              <div className="absolute right-0 mt-2 bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl p-2 min-w-[140px] z-20">
                <button
                  className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 w-full text-left px-3 py-2 rounded-md transition-colors"
                  onClick={() => {
                    setEditingTask(task);
                    setNewTask({ ...task });
                    setOpenMenuId(null);
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-white/10 w-full text-left px-3 py-2 rounded-md transition-colors"
                  onClick={() => {
                    setTasks(tasks.filter(t => t.id !== task.id));
                    setOpenMenuId(null);
                    handleDeleteTask(task.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{task.description}</p>

      <div className="flex items-center text-xs text-gray-500">
        <Calendar className="w-3 h-3 mr-1" />
        {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric'
        })}
      </div>
    </Card>
  );
}
