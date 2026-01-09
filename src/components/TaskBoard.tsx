import { useState } from 'react';
import { Plus, Calendar, LayoutGrid, ListOrdered, CalendarDays, CalendarRange, LogOut, User, MoreVertical, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';

type Priority = 'alta' | 'media' | 'baja';
type Status = 'por-hacer' | 'en-progreso' | 'completado';

interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  dueDate: string;
}

type ViewMode = 'all' | 'priority' | 'kanban' | 'week' | 'month';

interface TaskBoardProps {
  onLogout: () => void;
  userEmail: string | undefined; // Añade esta línea
}

export function TaskBoard({ onLogout, userEmail }: TaskBoardProps) { // Recibe la prop aquí
  const [viewMode, setViewMode] = useState<ViewMode>('priority');
  const [showAddTask, setShowAddTask] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Diseñar interfaz de usuario',
      description: 'Crear mockups para la nueva aplicación',
      priority: 'alta',
      status: 'en-progreso',
      dueDate: '2025-12-30',
    },
    {
      id: 2,
      title: 'Revisar documentación',
      description: 'Actualizar la documentación del proyecto',
      priority: 'media',
      status: 'por-hacer',
      dueDate: '2025-12-31',
    },
    {
      id: 3,
      title: 'Reunión con el equipo',
      description: 'Discutir avances del sprint',
      priority: 'alta',
      status: 'completado',
      dueDate: '2025-12-29',
    },
    {
      id: 4,
      title: 'Optimizar base de datos',
      description: 'Mejorar queries lentas',
      priority: 'baja',
      status: 'por-hacer',
      dueDate: '2026-01-02',
    },
    {
      id: 5,
      title: 'Implementar autenticación',
      description: 'Agregar login y registro de usuarios',
      priority: 'alta',
      status: 'en-progreso',
      dueDate: '2025-12-15',
    },
    {
      id: 6,
      title: 'Testing de aplicación',
      description: 'Realizar pruebas unitarias y de integración',
      priority: 'media',
      status: 'por-hacer',
      dueDate: '2025-12-20',
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'media' as Priority,
    status: 'por-hacer' as Status,
    dueDate: '',
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: tasks.length + 1,
      ...newTask,
    };
    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      priority: 'media',
      status: 'por-hacer',
      dueDate: '',
    });
    setShowAddTask(false);
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      const updatedTasks = tasks.map(task => task.id === editingTask.id ? { ...task, ...newTask } : task);
      setTasks(updatedTasks);
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        priority: 'media',
        status: 'por-hacer',
        dueDate: '',
      });
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'completado':
        return 'bg-green-50 border-green-200';
      case 'en-progreso':
        return 'bg-blue-50 border-blue-200';
      case 'por-hacer':
        return 'bg-gray-50 border-gray-200';
    }
  };

  const renderTaskCard = (task: Task) => (
    <Card
      key={task.id}
      className="p-4 mb-3 border border-white/20 hover:shadow-lg transition-all backdrop-blur-md bg-white/10 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-white flex-1 pr-2">{task.title}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()}
          </span>
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
                      const updatedTasks = tasks.filter(t => t.id !== task.id);
                      setTasks(updatedTasks);
                      setOpenMenuId(null);
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
      </div>
      <p className="text-sm text-white/90 mb-2">{task.description}</p>
      <div className="flex justify-between items-center text-xs text-white/80">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(task.dueDate).toLocaleDateString('es-ES')}
        </span>
        <span className="capitalize">{task.status.replace('-', ' ')}</span>
      </div>
    </Card>
  );

  const renderAllView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map(renderTaskCard)}
    </div>
  );

  const renderPriorityView = () => {
    const priorities: Priority[] = ['alta', 'media', 'baja'];
    return (
      <div className="space-y-6">
        {priorities.map((priority) => (
          <div key={priority}>
            <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2 text-white">
              <div className={`w-3 h-3 rounded-full ${priority === 'alta' ? 'bg-red-500' : priority === 'media' ? 'bg-yellow-500' : 'bg-green-500'}`} />
              Prioridad {priority}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.filter((task) => task.priority === priority).map(renderTaskCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderKanbanView = () => {
    const statuses: Status[] = ['por-hacer', 'en-progreso', 'completado'];
    const statusLabels = {
      'por-hacer': 'Por Hacer',
      'en-progreso': 'En Progreso',
      'completado': 'Completado',
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statuses.map((status) => (
          <div key={status} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h3 className="font-semibold mb-4 text-white">{statusLabels[status]}</h3>
            <div className="space-y-3">
              {tasks.filter((task) => task.status === status).map(renderTaskCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
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
            const dayTasks = tasks.filter((task) => {
              const taskDate = new Date(task.dueDate);
              return taskDate.toDateString() === day.toDateString();
            });

            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div 
                key={index} 
                className={`bg-gray-900/50 backdrop-blur-sm border-r border-gray-700 last:border-r-0 min-h-[400px] flex flex-col ${
                  index === 0 ? '' : ''
                }`}
              >
                {/* Header del día */}
                <div className="p-3 border-b border-gray-700 text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {daysOfWeekShort[day.getDay()]}
                  </div>
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                    isToday ? 'bg-[#FF5733] text-white' : 'text-white'
                  }`}>
                    <span className="font-semibold">{day.getDate()}</span>
                  </div>
                </div>

                {/* Área de tareas */}
                <div className="p-2 flex-1 overflow-y-auto">
                  <div className="space-y-2">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="text-xs p-2 rounded backdrop-blur-md bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20 transition-all"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            task.priority === 'alta' ? 'bg-red-500' : 
                            task.priority === 'media' ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} />
                          <span className="text-white font-medium truncate">{task.title}</span>
                        </div>
                        <p className="text-gray-400 text-[10px] truncate">{task.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
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
            const dayTasks = tasks.filter((task) => {
              const taskDate = new Date(task.dueDate);
              return taskDate.toDateString() === calendarDay.date.toDateString();
            });

            const isToday = calendarDay.date.toDateString() === new Date().toDateString();
            const isFirstDayOfMonth = calendarDay.date.getDate() === 1;

            return (
              <div
                key={index}
                className={`bg-gray-900/50 backdrop-blur-sm border-r border-b border-gray-700 p-3 min-h-[140px] ${
                  !calendarDay.isCurrentMonth ? 'opacity-40' : ''
                }`}
              >
                <div className="mb-2">
                  {isFirstDayOfMonth ? (
                    <span className={`text-sm font-semibold ${
                      isToday ? 'text-white' : calendarDay.isCurrentMonth ? 'text-white' : 'text-gray-500'
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
                        <span className={`text-sm font-semibold ${
                          calendarDay.isCurrentMonth ? 'text-white' : 'text-gray-500'
                        }`}>
                          {calendarDay.date.getDate()}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-1.5 overflow-y-auto max-h-[100px]">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="text-xs p-2 rounded backdrop-blur-md bg-gray-800/80 border border-gray-700 cursor-pointer hover:bg-gray-700/80 transition-all"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === 'alta' ? 'bg-red-500' : 
                          task.priority === 'media' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`} />
                        <span className="text-white truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (viewMode) {
      case 'all':
        return renderAllView();
      case 'priority':
        return renderPriorityView();
      case 'kanban':
        return renderKanbanView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      default:
        return renderAllView();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #000000, #066E8B)' }}>
      {/* Header */}
      <header className="border-b border-gray-600 sticky top-0 z-10" style={{ backgroundColor: '#066E8B' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">A-Prior</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-200">
                <User className="w-5 h-5" />
                {/* Reemplaza la línea estática por esta dinámica */}
                <span className="hidden sm:inline">
                  {userEmail || 'Usuario'} 
                </span>
              </div>
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex items-center gap-2 border-gray-400 hover:bg-gray-700 hover:text-white"
                style={{ color: '#066E8B' }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b border-gray-600" style={{ backgroundColor: '#044B5F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 py-3">
            <Button
              onClick={() => setViewMode('all')}
              variant={viewMode === 'all' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${viewMode === 'all' ? 'text-white' : 'border-gray-400 hover:bg-opacity-20 hover:bg-white'}`}
              style={viewMode === 'all' ? { backgroundColor: '#044B5F' } : { color: '#044B5F' }}
            >
              <LayoutGrid className="w-4 h-4" />
              Todo
            </Button>
            <Button
              onClick={() => setViewMode('priority')}
              variant={viewMode === 'priority' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${viewMode === 'priority' ? 'text-white' : 'border-gray-400 hover:bg-opacity-20 hover:bg-white'}`}
              style={viewMode === 'priority' ? { backgroundColor: '#044B5F' } : { color: '#044B5F' }}
            >
              <ListOrdered className="w-4 h-4" />
              Prioridad
            </Button>
            <Button
              onClick={() => setViewMode('kanban')}
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${viewMode === 'kanban' ? 'text-white' : 'border-gray-400 hover:bg-opacity-20 hover:bg-white'}`}
              style={viewMode === 'kanban' ? { backgroundColor: '#044B5F' } : { color: '#044B5F' }}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
            <Button
              onClick={() => setViewMode('week')}
              variant={viewMode === 'week' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${viewMode === 'week' ? 'text-white' : 'border-gray-400 hover:bg-opacity-20 hover:bg-white'}`}
              style={viewMode === 'week' ? { backgroundColor: '#044B5F' } : { color: '#044B5F' }}
            >
              <CalendarDays className="w-4 h-4" />
              Semana
            </Button>
            <Button
              onClick={() => setViewMode('month')}
              variant={viewMode === 'month' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${viewMode === 'month' ? 'text-white' : 'border-gray-400 hover:bg-opacity-20 hover:bg-white'}`}
              style={viewMode === 'month' ? { backgroundColor: '#044B5F' } : { color: '#044B5F' }}
            >
              <CalendarRange className="w-4 h-4" />
              Mes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Add Task Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 text-white hover:opacity-90"
            style={{ backgroundColor: '#044B5F' }}
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </Button>
        </div>

        {/* Add Task Form */}
        {/* Removed - now a modal */}

        {/* Edit Task Form */}
        {/* Removed - now a modal */}

        {/* Tasks View */}
        {renderView()}
      </main>

      {/* Add Task Modal */}
      {showAddTask && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => {
              setShowAddTask(false);
              setNewTask({
                title: '',
                description: '',
                priority: 'media',
                status: 'por-hacer',
                dueDate: '',
              });
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">Agregar Nueva Tarea</h2>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    setNewTask({
                      title: '',
                      description: '',
                      priority: 'media',
                      status: 'por-hacer',
                      dueDate: '',
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-gray-300">Título</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Título de la tarea"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">Descripción</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descripción de la tarea"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-gray-300">Prioridad</Label>
                    <select
                      id="priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-gray-300">Estado</Label>
                    <select
                      id="status"
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Status })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                    >
                      <option value="por-hacer">Por Hacer</option>
                      <option value="en-progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate" className="text-gray-300">Fecha límite</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 text-white hover:opacity-90" style={{ backgroundColor: '#044B5F' }}>
                    Agregar Tarea
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTask({
                        title: '',
                        description: '',
                        priority: 'media',
                        status: 'por-hacer',
                        dueDate: '',
                      });
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => {
              setEditingTask(null);
              setNewTask({
                title: '',
                description: '',
                priority: 'media',
                status: 'por-hacer',
                dueDate: '',
              });
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-white">Editar Tarea</h2>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setNewTask({
                      title: '',
                      description: '',
                      priority: 'media',
                      status: 'por-hacer',
                      dueDate: '',
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditTask} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-gray-300">Título</Label>
                  <Input
                    id="edit-title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Título de la tarea"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description" className="text-gray-300">Descripción</Label>
                  <Input
                    id="edit-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descripción de la tarea"
                    className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="edit-priority" className="text-gray-300">Prioridad</Label>
                    <select
                      id="edit-priority"
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-status" className="text-gray-300">Estado</Label>
                    <select
                      id="edit-status"
                      value={newTask.status}
                      onChange={(e) => setNewTask({ ...newTask, status: e.target.value as Status })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                    >
                      <option value="por-hacer">Por Hacer</option>
                      <option value="en-progreso">En Progreso</option>
                      <option value="completado">Completado</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="edit-dueDate" className="text-gray-300">Fecha límite</Label>
                    <Input
                      id="edit-dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 text-white hover:opacity-90" style={{ backgroundColor: '#044B5F' }}>
                    Guardar Cambios
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingTask(null);
                      setNewTask({
                        title: '',
                        description: '',
                        priority: 'media',
                        status: 'por-hacer',
                        dueDate: '',
                      });
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => {
              setShowTaskModal(false);
              setSelectedTask(null);
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">{selectedTask.title}</h3>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Descripción</label>
                  <p className="text-white">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Prioridad</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedTask.priority === 'alta' ? 'bg-red-500' : 
                        selectedTask.priority === 'media' ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`} />
                      <span className="text-white capitalize">{selectedTask.priority}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Estado</label>
                    <span className="text-white capitalize">{selectedTask.status.replace('-', ' ')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Fecha límite</label>
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedTask.dueDate).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setEditingTask(selectedTask);
                      setNewTask({ ...selectedTask });
                      setShowTaskModal(false);
                      setSelectedTask(null);
                    }}
                    className="flex-1 bg-[#066E8B] hover:bg-[#055670] text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => {
                      const updatedTasks = tasks.filter(t => t.id !== selectedTask.id);
                      setTasks(updatedTasks);
                      setShowTaskModal(false);
                      setSelectedTask(null);
                    }}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}