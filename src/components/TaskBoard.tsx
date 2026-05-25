import { useEffect, useState, useRef } from 'react';
import { Plus, Calendar, LayoutGrid, ListOrdered, CalendarDays, CalendarRange, LogOut, User, MoreVertical, Trash2, Edit, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TaskService } from '../lib/services/taskService';
import { BoardService } from '../lib/services/boardService';
import RenderAllView from './renders/renderViewsTaks/RenderAllView';
import RenderKanbanView from './renders/renderViewsTaks/RenderKanbanView';
import RenderPriorityView from './renders/renderViewsTaks/RenderPriorityView';
import RenderWeekView from './renders/renderViewsTaks/RenderWeekView';
import RenderMonthView from './renders/renderViewsTaks/RenderMonthView';
import RenderBoardsGrid from './renders/renderViewsBoards/RenderBoardsGrid';
import { ProfileService } from '../lib/services/profilesService';
import { InvitationService } from '../lib/services/invitationService';
import { InvitationPanel } from './InvitationPanel';
import { RenderTaskCard } from './renders/RenderTaskCard';

// --- TIPOS ---
export type Importance = 'alta' | 'media' | 'baja';
export type Status = 'por-hacer' | 'en-progreso' | 'completado';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  importance: Importance;
  status: Status;
  dueDate: string;
  board_id: number | null;
  assignated_to: string[] | null;
}

export interface Board {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
  team: string[];
  user_id: string;
}

type ViewMode = 'all' | 'priority' | 'kanban' | 'week' | 'month' | 'lol';

interface TaskBoardProps {
  onLogout: () => void;
  userEmail: string | undefined;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  date: string | null;
}

export const calculatePriorityValue = (importance: number, dueDate: string): number => {
  const ahora = new Date().getTime();
  const limite = new Date(dueDate).getTime();

  // Diferencia en horas
  const diferenciaHoras = (limite - ahora) / (1000 * 60 * 60);

  // Factor de Urgencia (basado en tu requerimiento de que aumente al acercarse la fecha)
  const factorUrgencia = diferenciaHoras > 0
    ? (100 / (diferenciaHoras + 1))
    : 200; // Máxima prioridad si ya venció

  // Retornamos el producto (Importancia * Urgencia)
  return Math.round(importance * factorUrgencia);
};

export function TaskBoard({ onLogout, userEmail }: TaskBoardProps) {
  // --- ESTADOS ---
  const [showAddTask, setShowAddTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('priority');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  // --- PROYECTOS ---
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'tasks' | 'boards'>('tasks');
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [newBoard, setNewBoard] = useState({ name: '', description: '', date: '' });
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [filterNoBoard, setFilterNoBoard] = useState(false);
  const [boardEmailsInput, setBoardEmailsInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<{ id: string; username: string | null; email: string }[]>([]);
  // --- INVITACIONES ---
  const [showInvitations, setShowInvitations] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const invitationBtnRef = useRef<HTMLButtonElement>(null);

  // Estado del formulario (Unificado para crear y editar)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    importance: 'media' as Importance,
    status: 'por-hacer' as Status,
    dueDate: '',
    board_id: null as number | null,
    assignated_to: [] as string[]
  });

  // --- EFECTOS ---
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // 1. Si no hay email en las props, limpiamos y evitamos peticiones en falso
      if (!userEmail) {
        if (isMounted) {
          setTasks([]);
          setBoards([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        // 2. Llamamos a los servicios en paralelo de forma segura
        const [tasksData, boardsData, profile] = await Promise.all([
          TaskService.getTasks(),
          BoardService.getBoards(),
          ProfileService.getCurrentProfile(),
        ]);

        if (isMounted && profile) setCurrentUserId(profile.id);

        // Si los servicios retornan undefined por algún fallo sutil, aseguramos un array vacío
        const safeTasks = tasksData || [];
        const safeBoards = boardsData || [];

        if (isMounted) {
          const mappedTasks: Task[] = safeTasks.map((t: any) => ({
            id: t.id,
            title: t.name,
            description: t.description,
            status: t.state as Status,
            importance: (t.importance === 5 ? 'alta' : t.importance === 3 ? 'media' : 'baja') as Importance,
            dueDate: t.date,
            board_id: t.board_id,
            assignated_to: t.assignated_to || []
          }));

          setTasks(mappedTasks);
          setBoards(safeBoards);
        }
      } catch (err) {
        console.error("Error crítico en el flujo de carga de datos:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userEmail]); // Reacciona de forma limpia al cambio de estado de autenticación

  useEffect(() => {
    if (!userEmail) return;
    InvitationService.getPendingCount().then(setPendingInvitationsCount);
  }, [userEmail]);

  const refreshInvitationCount = () => {
    InvitationService.getPendingCount().then(setPendingInvitationsCount);
  };

  useEffect(() => {
    const board = boards.find(b => b.id === newTask.board_id);
    if (!board) { setMemberProfiles([]); return; }
    const ids = [...new Set([board.user_id, ...board.team])];
    ProfileService.getProfilesByIds(ids).then(setMemberProfiles);
  }, [newTask.board_id, boards]);

  // Helper para convertir el string de importancia a número para el cálculo
  const importanceWeight = { alta: 5, media: 3, baja: 1 };

  // --- MANEJADORES ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones previas de prioridad e importancia
    const importanceValue = newTask.importance === 'alta' ? 5 : newTask.importance === 'media' ? 3 : 1;
    const calculatedPriority = importanceValue * 100; // Tu lógica de prioridad (ej. 600)

    try {
      console.log("Guardando nueva tarea:", newTask);

      // Enviamos el payload estrictamente formateado al servicio
      const newTaskDB = await TaskService.createTask({
        name: newTask.title,
        description: newTask.description,
        state: newTask.status,
        importance: importanceValue,
        date: newTask.dueDate,
        priority: calculatedPriority,
        board_id: newTask.board_id, // Puede ser id numérico o null
        assignated_to: newTask.assignated_to // Enviamos la lista de colaboradores asignados
      });

      // Mapeamos la respuesta que nos devolvió Supabase para insertarla en el estado local de React
      const mappedNewTask: Task = {
        id: newTaskDB.id,
        title: newTaskDB.name,
        description: newTaskDB.description,
        status: newTaskDB.state as Status,
        importance: (newTaskDB.importance === 5 ? 'alta' : newTaskDB.importance === 3 ? 'media' : 'baja') as Importance,
        dueDate: newTaskDB.date,
        board_id: newTaskDB.board_id,
        assignated_to: newTaskDB.assignated_to || []
      };

      // Actualizamos la interfaz reactiva agregando la tarea al inicio del array
      setTasks([mappedNewTask, ...tasks]);
      
      // Reseteamos el formulario a su estado inicial
      setShowAddTask(false);
      setNewTask({
        title: '',
        description: '',
        importance: 'media',
        status: 'por-hacer',
        dueDate: '',
        board_id: selectedBoardId, // Mantiene el tablero actual seleccionado
        assignated_to: []
      });

      alert("Tarea guardada con éxito");
    } catch (err) {
      console.error("Error detectado en la línea 221 de TaskBoard.tsx:", err);
      alert("Error 400: No se pudo registrar la tarea. Verifica las columnas de la tabla.");
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const importanceValue = newTask.importance === 'alta' ? 5 : newTask.importance === 'media' ? 3 : 1;
      const calculatedPriority = calculatePriorityValue(importanceValue, newTask.dueDate);

      const updates = {
        name: newTask.title,
        description: newTask.description,
        state: newTask.status,
        importance: importanceValue,
        date: newTask.dueDate,
        priority: calculatedPriority,
        board_id: newTask.board_id,
        assignated_to: newTask.assignated_to
      };

      // 1. Guardar en Supabase usando el TaskService
      const updatedData = await TaskService.updateTask(editingTask.id, updates);

      // 2. Actualizar el estado local para que la UI se refresque
      setTasks(tasks.map(t => t.id === editingTask.id ? {
        ...t,
        title: updatedData.name,
        description: updatedData.description,
        status: updatedData.state as Status,
        importance: (updatedData.importance === 5 ? 'alta' : updatedData.importance === 3 ? 'media' : 'baja') as Importance,
        dueDate: updatedData.date
      } : t));

      // 3. Cerrar modal y limpiar estados
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        importance: 'media',
        status: 'por-hacer',
        dueDate: '',
        board_id: null,
        assignated_to: []
      });

      alert("Tarea actualizada con éxito");
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar en la base de datos");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await TaskService.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      setShowTaskModal(false);
      setSelectedTask(null);

      // 3. Cerrar modal
      setShowTaskModal(false);
      setSelectedTask(null);

      alert("Tarea eliminada con éxito");
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  // En TaskBoard.tsx
  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await BoardService.createBoard(
        { name: newBoard.name, description: newBoard.description, date: newBoard.date },
        ''
      );

      if (boardEmailsInput.trim()) {
        const emails = boardEmailsInput.split(',').map(em => em.trim().toLowerCase()).filter(Boolean);
        const results = await Promise.allSettled(
          emails.map(email => InvitationService.sendInvitation(email, created.id))
        );
        const failed = results
          .map((r, i) => r.status === 'rejected' ? emails[i] : null)
          .filter(Boolean);
        if (failed.length > 0) {
          alert(`Invitaciones no enviadas (correo no registrado): ${failed.join(', ')}`);
        }
      }

      setBoards([...boards, created]);
      setShowAddBoard(false);
      setNewBoard({ name: '', description: '', date: '' });
      setBoardEmailsInput('');
      alert("Proyecto creado con éxito");
    } catch (err) {
      console.error(err);
      alert("Error al crear el proyecto");
    }
  };
  const handleEditBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoard) return;
    const board = editingBoard;

    try {
      const updated = await BoardService.updateBoard(board.id, {
        name: newBoard.name,
        description: newBoard.description,
        date: newBoard.date || null
      });

      if (boardEmailsInput.trim()) {
        const emails = boardEmailsInput.split(',').map(em => em.trim().toLowerCase()).filter(Boolean);
        const results = await Promise.allSettled(
          emails.map(email => InvitationService.sendInvitation(email, board.id))
        );
        const failed = results
          .map((r, i) => r.status === 'rejected' ? emails[i] : null)
          .filter(Boolean);
        if (failed.length > 0) {
          alert(`Invitaciones no enviadas (correo no registrado): ${failed.join(', ')}`);
        }
      }

      setBoards(boards.map(b => b.id === board.id ? updated : b));
      setEditingBoard(null);
      setNewBoard({ name: '', description: '', date: '' });
      setBoardEmailsInput('');
      alert("Proyecto actualizado con éxito");
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el proyecto");
    }
  };

  const handleDeleteBoard = async (id: number) => {
    if (confirm("¿Estás seguro? Se borrarán las tareas asociadas.")) {
      await BoardService.deleteBoard(id);
      setBoards(boards.filter(b => b.id !== id));
    }
  };

  // --- RENDERIZADO ---
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      Cargando tus tareas...
    </div>
  );

  const getPriorityColor = (score: number) => {
    if (score >= 13) {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    } else if (score >= 5) { // Antes era 70, lo bajamos a 20
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    } else {
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };


  // Esta función extrae los datos de la tarea y los pasa al calculador
  const getTaskScore = (task: Task): number => {
    const weight = task.importance === 'alta' ? 5 : task.importance === 'media' ? 3 : 1;
    return calculatePriorityValue(weight, task.dueDate);
  };

  // --- FILTRADO DE TAREAS ---
  // Esta es la clave: las vistas (Kanban, Mes, etc.) usarán 'filteredTasks'
  const filteredTasks = selectedBoardId
    ? tasks.filter(t => t.board_id === selectedBoardId) // Asegúrate que Task tenga board_id
    : tasks;


  const renderView = () => {
    // 1. Definimos el universo de tareas a mostrar según los filtros activos
    let tasksToShow;

    if (filterNoBoard) {
      // Si el interruptor de "Sin Tablero" está activo, mostramos solo las que no tienen ID
      tasksToShow = tasks.filter(t => !t.board_id);
    } else if (selectedBoardId) {
      // Si hay un tablero seleccionado, filtramos por ese ID específico
      tasksToShow = tasks.filter(t => t.board_id === selectedBoardId);
    } else {
      // Si no hay filtros activos, mostramos todo el universo de tareas
      tasksToShow = tasks;
    }


    // Pasamos 'tasksToShow' a cada función de renderizado
    switch (viewMode) {
      case 'all':
        return <RenderAllView
          tasksToShow={tasksToShow}
          getTaskScore={getTaskScore}
          renderTaskCard={(task) => <RenderTaskCard task={task} calculatePriorityValue={calculatePriorityValue} setOpenMenuId={setOpenMenuId} openMenuId={openMenuId} setEditingTask={setEditingTask} setNewTask={setNewTask} tasks={tasks} setTasks={setTasks} handleDeleteTask={handleDeleteTask} />}
        />
      case 'priority':
        return <RenderPriorityView
          tasksToShow={tasksToShow}
          getTaskScore={getTaskScore}
          renderTaskCard={(task) => <RenderTaskCard task={task} calculatePriorityValue={calculatePriorityValue} setOpenMenuId={setOpenMenuId} openMenuId={openMenuId} setEditingTask={setEditingTask} setNewTask={setNewTask} tasks={tasks} setTasks={setTasks} handleDeleteTask={handleDeleteTask} />}
        />
      case 'kanban':
        return <RenderKanbanView
          tasksToShow={tasksToShow}
          getTaskScore={getTaskScore}
          renderTaskCard={(task) => <RenderTaskCard task={task} calculatePriorityValue={calculatePriorityValue} setOpenMenuId={setOpenMenuId} openMenuId={openMenuId} setEditingTask={setEditingTask} setNewTask={setNewTask} tasks={tasks} setTasks={setTasks} handleDeleteTask={handleDeleteTask} />}
        />
      case 'week':
        return <RenderWeekView
          tasksToShow={tasksToShow}
          getTaskScore={getTaskScore}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          setSelectedTask={setSelectedTask}
          setShowTaskModal={setShowTaskModal}
          getPriorityColor={getPriorityColor}
        />
      case 'month':
        return <RenderMonthView
          tasksToShow={tasksToShow}
          getTaskScore={getTaskScore}
          monthOffset={monthOffset}
          setMonthOffset={setMonthOffset}
          setSelectedTask={setSelectedTask}
          setShowTaskModal={setShowTaskModal}
        />;
      default:
        return <RenderPriorityView
          tasksToShow={tasksToShow}
          getTaskScore={getTaskScore}
          renderTaskCard={(task) => <RenderTaskCard task={task} calculatePriorityValue={calculatePriorityValue} setOpenMenuId={setOpenMenuId} openMenuId={openMenuId} setEditingTask={setEditingTask} setNewTask={setNewTask} tasks={tasks} setTasks={setTasks} handleDeleteTask={handleDeleteTask} />}
        />
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
              {/* Campanita de notificaciones */}
              <button
                ref={invitationBtnRef}
                onClick={() => setShowInvitations(prev => !prev)}
                className="relative p-2 text-gray-200 hover:text-white transition-colors rounded-md hover:bg-white/10"
                title="Ver invitaciones"
              >
                <Mail className="w-5 h-5" />
                {pendingInvitationsCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-white font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: '#ef4444',
                      fontSize: '10px',
                      borderRadius: '9999px',
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      lineHeight: 1,
                    }}
                  >
                    {pendingInvitationsCount > 9 ? '9+' : pendingInvitationsCount}
                  </span>
                )}
              </button>

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

      {/* Selector de Vista Principal */}
      <div className='p-4' style={{ backgroundColor: '#044B5F' }} >
        <button
          onClick={() => setViewType('tasks')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${viewType === 'tasks' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
        >
          Mis tareas
          {viewType === 'tasks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
        </button>
        <button
          onClick={() => setViewType('boards')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${viewType === 'boards' ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
        >
          Mis Tableros
          {viewType === 'boards' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />}
        </button>
      </div>


      {/* Navigation */}
      {viewType === 'tasks' && (
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
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


        {/* Lógica Condicional de Renderizado */}
        {viewType === 'boards' ? (
          < RenderBoardsGrid
            boards={boards}
            tasks={tasks}
            setSelectedBoardId={setSelectedBoardId}
            setShowAddBoard={setShowAddBoard}
            handleDeleteBoard={handleDeleteBoard}
            setEditingBoard={setEditingBoard}
            setNewBoard={setNewBoard}
            setViewType={setViewType}
            currentUserId={currentUserId}
          />
        ) : (
          <>
            {/* Si hay un proyecto seleccionado, mostramos una pequeña barra de aviso */}
            {selectedBoardId && (
              <div className="mb-6 flex items-center justify-between bg-cyan-500/10">
                <span className="text-white text-sm">
                  Viendo tareas del tablero: <strong>{boards.find(b => b.id === selectedBoardId)?.name}</strong>
                </span>
              </div>
            )}

            {/* Selector de Filtro de Tareas */}
            <div className="mb-20 flex sm:flex-row sm:items-end bg-white/5 rounded-2xl">
              <div className='flex items-center gap-3 align-middle '>
                <span className='text-white flex flex-row whitespace-nowrap'>Filtrar por:</span>
                <select
                  // Si filterNoBoard es true, mostramos "none", si no, el ID o vacío
                  value={filterNoBoard ? 'none' : (selectedBoardId || '')}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (val === 'none') {
                      setFilterNoBoard(true);
                      setSelectedBoardId(null);
                    } else if (val === '') {
                      setFilterNoBoard(false);
                      setSelectedBoardId(null);
                    } else {
                      setFilterNoBoard(false);
                      setSelectedBoardId(Number(val));
                    }
                  }}
                  className="w-full max-w-xs h-10 px-4 border border-white/10 rounded-xl bg-gray-900/50 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="">📂 Todas las Tareas</option>
                  <option value="none">📂 Tareas sin tablero</option>
                  {boards.map(b => (
                    <option key={b.id} value={b.id}>📁 {b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <Button
                onClick={() => setShowAddTask(true)}
                className="mt-4 items-center gap-2 text-white hover:opacity-90"
                style={{ backgroundColor: '#044B5F' }}
              >
                <Plus className="w-4 h-4" />
                Nueva Tarea
              </Button>
            </div>

            {renderView()}
          </>
        )}
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
                importance: 'media',
                status: 'por-hacer',
                dueDate: '',
                board_id: null,
                assignated_to: []
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
                      importance: 'media',
                      status: 'por-hacer',
                      dueDate: '',
                      board_id: null,
                      assignated_to: []
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
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="priority" className="text-gray-300">Importancia</Label>
                    <select
                      id="priority"
                      value={newTask.importance}
                      onChange={(e) => setNewTask({ ...newTask, importance: e.target.value as Importance })}
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

                  <div>
                    <Label htmlFor="board" className="text-gray-300">Tablero</Label>
                    <select
                      id="board"
                      value={newTask.board_id || ''}
                      onChange={(e) => setNewTask({ ...newTask, board_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                    >
                      <option value="">Sin tablero</option>
                      {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  {/* --- DETECCIÓN DINÁMICA DE TABLERO COLABORATIVO --- */}
                  {newTask.board_id && (boards.find(b => b.id === newTask.board_id)?.team?.length ?? 0) > 0 && (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 rounded-lg space-y-2">
                      <Label className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Asignar tarea a miembros del equipo:</Label>
                      <select
                        multiple
                        value={newTask.assignated_to}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          setNewTask({ ...newTask, assignated_to: values });
                        }}
                        className="w-full border border-cyan-500/30 rounded-md bg-gray-900 text-white p-2 text-sm h-24"
                      >
                        {memberProfiles.map(p => {
                          const board = boards.find(b => b.id === newTask.board_id);
                          const isOwner = p.id === board?.user_id;
                          const label = p.username ?? p.email;
                          return (
                            <option key={p.id} value={p.id}>
                              {isOwner ? `👑 ${label}` : `👤 ${label}`}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[10px] text-gray-400 italic">* Usa Ctrl (o Cmd) presionado para seleccionar múltiples personas.</p>
                    </div>
                  )}
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
                        importance: 'media',
                        status: 'por-hacer',
                        dueDate: '',
                        board_id: null,
                        assignated_to: []
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
                importance: 'media',
                status: 'por-hacer',
                dueDate: '',
                board_id: null,
                assignated_to: []
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
                      importance: 'media',
                      status: 'por-hacer',
                      dueDate: '',
                      board_id: null,
                      assignated_to: []
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
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="edit-priority" className="text-gray-300">Prioridad</Label>
                    <select
                      id="edit-priority"
                      value={newTask.importance}
                      onChange={(e) => setNewTask({ ...newTask, importance: e.target.value as Importance })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                      required
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
                      required
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
                <div>
                  <Label htmlFor="edit-board" className="text-gray-300">Tablero</Label>
                    <select
                      id="edit-board"
                      value={newTask.board_id || ''}
                      onChange={(e) => setNewTask({ ...newTask, board_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full h-10 px-3 border border-gray-600 rounded-md bg-gray-700 text-white"
                    >
                      <option value="">Sin tablero</option>
                      {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select> 
                </div>
                <div>
                  {/* --- DETECCIÓN DINÁMICA DE TABLERO COLABORATIVO --- */}
                  {newTask.board_id && (boards.find(b => b.id === newTask.board_id)?.team?.length ?? 0) > 0 && (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 rounded-lg space-y-2">
                      <Label className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Asignar tarea a miembros del equipo:</Label>
                      <select
                        multiple
                        value={newTask.assignated_to}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          setNewTask({ ...newTask, assignated_to: values });
                        }}
                        className="w-full border border-cyan-500/30 rounded-md bg-gray-900 text-white p-2 text-sm h-24"
                      >
                        {memberProfiles.map(p => {
                          const board = boards.find(b => b.id === newTask.board_id);
                          const isOwner = p.id === board?.user_id;
                          const label = p.username ?? p.email;
                          return (
                            <option key={p.id} value={p.id}>
                              {isOwner ? `👑 ${label}` : `👤 ${label}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )} 
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 text-white hover:opacity-90"
                    style={{ backgroundColor: '#044B5F' }}
                  >
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
                        importance: 'media',
                        status: 'por-hacer',
                        dueDate: '',
                        board_id: null,
                        assignated_to: []
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
                    <label className="text-sm text-gray-400 mb-1 block">Importancia</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedTask.importance === 'alta' ? 'bg-red-500' :
                        selectedTask.importance === 'media' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                      <span className="text-white capitalize">{selectedTask.importance}</span>
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
                      setNewTask({ ...selectedTask, description: selectedTask.description ?? '', assignated_to: selectedTask.assignated_to ?? [] });
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
                      handleDeleteTask(selectedTask.id);
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
      {showAddBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-800 p-6 rounded-xl border border-white/20 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Nuevo Tablero</h2>
            <form onSubmit={handleAddBoard} className="space-y-4">
              <Label className="text-gray-300">Nombre del Tablero</Label>
              <Input
                placeholder="Nombre del Tablero"
                value={newBoard.name}
                onChange={e => setNewBoard({ ...newBoard, name: e.target.value })}
                className="bg-gray-700 text-white"
                required
              />
              <Label className="text-gray-300">Descripción</Label>
              <Input
                placeholder="Descripción"
                value={newBoard.description}
                onChange={e => setNewBoard({ ...newBoard, description: e.target.value })}
                className="bg-gray-700 text-white"
              />
              <Label htmlFor="dueDate" className="text-gray-300">Fecha límite</Label>
              <Input
                id="dueDate"
                type="date"
                value={newBoard.date}
                onChange={(e) => setNewBoard({ ...newBoard, date: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <div>
                {/* --- INPUT PARA INVITAR POR CORREO --- */}
                <div className="p-3 bg-gray-900/50 rounded-lg border border-white/5">
                  <Label htmlFor="team_emails" className="text-gray-300">Invitar equipo por correo electrónico</Label>
                  <Input
                    id="team_emails"
                    placeholder="ejemplo1@gmail.com, ejemplo2@gmail.com"
                    value={boardEmailsInput}
                    onChange={e => setBoardEmailsInput(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white mt-1 placeholder:text-gray-500 text-xs"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">* Separa múltiples correos electrónicos utilizando comas (,)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-[#044B5F]">Guardar</Button>
                <Button type="button" onClick={() => setShowAddBoard(false)} variant="outline">Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingBoard && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-10"
            onClick={() => {
              setEditingBoard(null);
              setNewBoard({ name: '', description: '', date: '' });
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-white/20 p-6 rounded-xl shadow-2xl w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Editar Tablero</h2>
              <form onSubmit={handleEditBoard} className="space-y-4">
                <div>
                  <Label className="text-gray-300">Nombre del Tablero</Label>
                  <Input
                    value={newBoard.name}
                    onChange={e => setNewBoard({ ...newBoard, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Descripción</Label>
                  <Input
                    value={newBoard.description}
                    onChange={e => setNewBoard({ ...newBoard, description: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate" className="text-gray-300">Fecha límite</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newBoard.date}
                    onChange={(e) => setNewBoard({ ...newBoard, date: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  {/* --- INPUT PARA INVITAR POR CORREO --- */}
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-white/5">
                    <Label htmlFor="team_emails" className="text-cyan-400 font-semibold text-xs uppercase">Invitar equipo por correo electrónico</Label>
                    <Input
                      id="team_emails"
                      placeholder="ejemplo1@gmail.com, ejemplo2@gmail.com"
                      value={boardEmailsInput}
                      onChange={e => setBoardEmailsInput(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white mt-1 placeholder:text-gray-500 text-xs"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">* Separa múltiples correos electrónicos utilizando comas (,)</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1 bg-[#044B5F] hover:bg-[#055670]">
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingBoard(null);
                      setNewBoard({ name: '', description: '', date: '' });
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Panel de Invitaciones */}
      <InvitationPanel
        isOpen={showInvitations}
        anchorRef={invitationBtnRef}
        onClose={() => {
          setShowInvitations(false);
          refreshInvitationCount();
        }}
        onAccepted={() => {
          refreshInvitationCount();
          BoardService.getBoards().then(data => setBoards(data || []));
        }}
      />
    </div>
  );
}