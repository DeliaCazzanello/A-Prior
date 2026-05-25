import React from 'react';
import { Board, Task } from '../../TaskBoard';
import { Button } from '../../ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '../../ui/card';

interface RenderBoardsGridProps {
    boards: Board[];
    tasks: Task[];
    setSelectedBoardId: React.Dispatch<React.SetStateAction<number | null>>;
    setShowAddBoard: React.Dispatch<React.SetStateAction<boolean>>;
    handleDeleteBoard: (boardId: number) => void;
    setEditingBoard: React.Dispatch<React.SetStateAction<Board | null>>;
    setNewBoard: React.Dispatch<React.SetStateAction<{ name: string; description: string; date: string }>>;
    setViewType: React.Dispatch<React.SetStateAction< 'boards' | 'tasks' >>;
    currentUserId: string | null;
  }

export default function RenderBoardsGrid({
    boards,
    tasks,
    setSelectedBoardId,
    setShowAddBoard,
    handleDeleteBoard,
    setEditingBoard,
    setNewBoard,
    setViewType,
    currentUserId,

}: RenderBoardsGridProps) {
    return (
      <div className="flex flex-col"> {/* Contenedor para alinear verticalmente */}
  
        {/* 1. Mover el botón aquí (fuera y arriba del grid) */}
        <div className="mb-6">
          <Button
            onClick={() => setShowAddBoard(true)}
            className="flex items-center gap-2 text-white hover:opacity-90"
            style={{ backgroundColor: '#044B5F' }}
          >
            <Plus className="w-4 h-4" />
            Nuevo Tablero
          </Button>
        </div>
  
        {/* 2. El grid ahora solo contiene las cards de los proyectos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {boards.map(board => (
            <Card
              key={board.id}
              className="p-6 cursor-pointer border-white/20 bg-white/10 hover:bg-white/20 transition-all group"
              onClick={() => {
                setSelectedBoardId(board.id);
                setViewType('tasks');
              }}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {board.name}
                </h3>
                {currentUserId === board.user_id && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoard(board);
                        setNewBoard({ name: board.name, description: board.description, date: board.date || '' });
                      }}
                    >
                      <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id); }}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-gray-400 mt-2 text-sm line-clamp-2">{board.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400">
                  {tasks.filter(t => t.board_id === board.id).length} Tareas
                </span>
                <span className="text-gray-500">{board.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }