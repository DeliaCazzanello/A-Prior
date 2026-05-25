import { Task } from '../../TaskBoard'; // Asegúrate de que Task esté exportado en TaskBoard.tsx
import {ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';

interface RenderWeekViewProps {
  tasksToShow: Task[];
  getTaskScore: (task: Task) => number;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  setSelectedTask: (task: Task) => void;
  setShowTaskModal: (show: boolean) => void;
  getPriorityColor: (score: number) => string;
}

export default function RenderWeekView({ 
  tasksToShow, 
  getTaskScore, 
  weekOffset,
  setWeekOffset,
  setSelectedTask,
  setShowTaskModal,
  getPriorityColor
}: RenderWeekViewProps) {
  
  // Ordenamos las tareas por puntaje antes de mapearlas
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay() + (weekOffset * 7)));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Crear array de 7 días de la semana
    const daysOfWeekShort = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            {weekStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })} - {weekEnd.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setWeekOffset(0)}
              variant="outline"
              className="border-gray-400 hover:bg-gray-700 hover:text-white text-sm"
              style={{ color: '#066E8B' }}
            >
              Hoy
            </Button>
            <Button
              onClick={() => setWeekOffset(weekOffset - 1)}
              variant="outline"
              size="sm"
              className="border-gray-400 hover:bg-gray-700 hover:text-white px-2"
              style={{ color: '#066E8B' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setWeekOffset(weekOffset + 1)}
              variant="outline"
              size="sm"
              className="border-gray-400 hover:bg-gray-700 hover:text-white px-2"
              style={{ color: '#066E8B' }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Grid de 7 columnas para los días */}
        <div className="grid grid-cols-7 gap-0 border border-gray-700 rounded-lg overflow-hidden">
          {weekDays.map((day, index) => {
            // Dentro de renderWeekView, busca:
            const dayTasks = tasksToShow.filter((task) => {
              const taskDate = new Date(task.dueDate + 'T00:00:00');
              return taskDate.toDateString() === day.toDateString();
            });

            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`bg-gray-900/50 backdrop-blur-sm border-r border-gray-700 last:border-r-0 min-h-[400px] flex flex-col ${index === 0 ? '' : ''
                  }`}
              >
                {/* Header del día */}
                <div className="p-3 border-b border-gray-700 text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {daysOfWeekShort[day.getDay()]}
                  </div>
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${isToday ? 'bg-[#FF5733] text-white' : 'text-white'
                    }`}>
                    <span className="font-semibold">{day.getDate()}</span>
                  </div>
                </div>

                {/* Área de tareas */}
                <div className="p-2 flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    {dayTasks.map((task) => {
                      // 1. Calculamos el score para esta tarea específica usando el helper
                      const score = getTaskScore(task);

                      // 2. Obtenemos las clases de color (puedes usar tu función getPriorityColor)
                      const colorClasses = getPriorityColor(score);

                      return (
                        <div
                          key={task.id}
                          className="text-[11px] p-2 rounded bg-white/5 border border-white/10 cursor-pointer hover:bg-white/15 transition-all  backdrop-blur-md bg-white/10 relative"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                        >
                          {/* Dentro del map de dayTasks */}
                          <div className="flex items-center gap-2 mb-1">
                            {/* Solo imprimimos el punto de color si NO está completado */}
                            {task.status !== 'completado' && (
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${score >= 13 ? 'bg-red-500' : score >= 5 ? 'bg-yellow-500' : 'bg-green-500'
                                } shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                            )}

                            <span className={`text-white font-medium truncate ${task.status === 'completado' ? 'opacity-50 line-through' : ''}`}>
                              {task.title}
                            </span>
                          </div>

                          {/* Opcional: Mostrar el score muy pequeño para referencia rápida */}
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-gray-500 text-[9px] truncate flex-1">{task.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };