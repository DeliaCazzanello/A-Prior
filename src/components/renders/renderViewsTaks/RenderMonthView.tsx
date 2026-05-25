import { Task } from '../../TaskBoard'; // Asegúrate de que Task esté exportado en TaskBoard.tsx
import { Button } from '../../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface RenderMonthViewProps {
  tasksToShow: Task[];
  getTaskScore: (task: Task) => number;
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  setSelectedTask: (task: Task) => void;
  setShowTaskModal: (show: boolean) => void;
}

export default function RenderMonthView({ 
  tasksToShow, 
  getTaskScore, 
  monthOffset,
  setMonthOffset,
  setSelectedTask,
  setShowTaskModal,
}: RenderMonthViewProps) {
  
  // Ordenamos las tareas por puntaje antes de mapearlas
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Obtener el primer día de la semana del mes (domingo = 0)
    const firstDayOfWeek = monthStart.getDay();

    // Crear array con todos los días a mostrar (incluyendo días del mes anterior)
    const calendarDays = [];

    // Agregar días del mes anterior si es necesario
    const prevMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(prevMonthEnd);
      day.setDate(prevMonthEnd.getDate() - i);
      calendarDays.push({ date: day, isCurrentMonth: false });
    }

    // Agregar todos los días del mes actual
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      calendarDays.push({ date, isCurrentMonth: true });
    }

    // Agregar días del mes siguiente para completar la última semana
    const remainingDays = 7 - (calendarDays.length % 7);
    if (remainingDays < 7) {
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
        calendarDays.push({ date, isCurrentMonth: false });
      }
    }

    const daysOfWeekShort = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

    return (
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            {monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMonthOffset(0)}
              variant="outline"
              className="border-gray-400 hover:bg-gray-700 hover:text-white text-sm"
              style={{ color: '#066E8B' }}
            >
              Hoy
            </Button>
            <Button
              onClick={() => setMonthOffset(monthOffset - 1)}
              variant="outline"
              size="sm"
              className="border-gray-400 hover:bg-gray-700 hover:text-white px-2"
              style={{ color: '#066E8B' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setMonthOffset(monthOffset + 1)}
              variant="outline"
              size="sm"
              className="border-gray-400 hover:bg-gray-700 hover:text-white px-2"
              style={{ color: '#066E8B' }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Encabezado de días de la semana */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-700">
          {daysOfWeekShort.map((day) => (
            <div key={day} className="text-center text-sm text-gray-400 py-2 border-r border-b border-gray-700 bg-gray-900/30">
              {day}
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="grid grid-cols-7 gap-0 border-l border-gray-700">
          {calendarDays.map((calendarDay, index) => {
            // Dentro de renderMonthView, busca:
            const dayTasks = tasksToShow.filter((task) => {
              const taskDate = new Date(task.dueDate + 'T00:00:00');
              // Solo mostrar si coincide la fecha Y no está completada
              return taskDate.toDateString() === calendarDay.date.toDateString();
            });

            const isToday = calendarDay.date.toDateString() === new Date().toDateString();
            const isFirstDayOfMonth = calendarDay.date.getDate() === 1;

            return (
              <div
                key={index}
                className={`bg-gray-900/50 backdrop-blur-sm border-r border-b border-gray-700 p-3 min-h-[140px] ${!calendarDay.isCurrentMonth ? 'opacity-40' : ''
                  }`}
              >
                <div className="mb-2">
                  {isFirstDayOfMonth ? (
                    <span className={`text-sm font-semibold ${isToday ? 'text-white' : calendarDay.isCurrentMonth ? 'text-white' : 'text-gray-500'
                      }`}>
                      {calendarDay.date.getDate()} {calendarDay.date.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                  ) : (
                    <>
                      {isToday ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#FF5733] text-white">
                          <span className="font-semibold text-sm">{calendarDay.date.getDate()}</span>
                        </div>
                      ) : (
                        <span className={`text-sm font-semibold ${calendarDay.isCurrentMonth ? 'text-white' : 'text-gray-500'
                          }`}>
                          {calendarDay.date.getDate()}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-1.5 overflow-y-auto max-h-[100px] pr-1 scrollbar-hide">
                  {dayTasks
                    // 1. Ordenamos las tareas del día por prioridad antes de mapear
                    .sort((a, b) => getTaskScore(b) - getTaskScore(a))
                    .map((task) => {
                      // 2. Calculamos el score actual
                      const score = getTaskScore(task);

                      return (
                        <div
                          key={task.id}
                          className="group text-[10px] p-1.5 rounded bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-cyan-500/30 transition-all backdrop-blur-md bg-white/10 relative"
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskModal(true);
                          }}
                        >
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
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div >
    );
  };