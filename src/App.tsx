import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  addWeeks, 
  subWeeks,
  isToday,
  startOfDay,
  addMonths,
  differenceInDays
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Briefcase, 
  Dumbbell, 
  Instagram,
  Calendar as CalendarIcon,
  Filter,
  MoreVertical,
  MoveHorizontal,
  Edit2,
  Trash2,
  X,
  Save,
  CalendarPlus,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { INITIAL_DATA } from './data';
import { Task, Category, Phase } from './types';
import { cn } from './lib/utils';

const COLORS = {
  gold: '#d6aa55',
  dark: '#191102',
  white: '#ffffff',
};

const CATEGORY_CONFIG: Record<Category, { icon: any; label: string; color: string }> = {
  job: { icon: Briefcase, label: 'New Job', color: '#3b82f6' },
  fitness: { icon: Dumbbell, label: 'Fitness', color: '#10b981' },
  yousquared: { icon: Instagram, label: 'YouSquared', color: '#d6aa55' },
};

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: () => void;
  onMove: (date: Date) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  weekDays: Date[];
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index,
  onToggle, 
  onMove,
  onEdit,
  onDelete,
  weekDays 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const config = CATEGORY_CONFIG[task.category];
  const Icon = config.icon;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            // Optimization: disable transitions during drag to prevent "ghosting"
            transition: snapshot.isDragging ? 'none' : provided.draggableProps.style?.transition,
          }}
          className={cn(
            "relative mb-3 last:mb-0",
            snapshot.isDragging && "z-[100]"
          )}
        >
          <div
            className={cn(
              "group relative bg-white/[0.03] border border-white/10 rounded-xl p-3 transition-all hover:bg-white/[0.06] hover:border-white/20 shadow-sm",
              task.done && "opacity-50 grayscale-[0.3]",
              snapshot.isDragging && "bg-white/[0.1] border-[#d6aa55]/50 shadow-2xl scale-[1.02] ring-2 ring-[#d6aa55]/20"
            )}
          >
            <div className="flex flex-col gap-2">
              {/* Top Row: Category & Menu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="w-3 h-3 shrink-0" style={{ color: config.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-40 truncate">{config.label}</span>
                </div>
                
                <div className="relative shrink-0 flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-1 hover:bg-white/10 rounded-md transition-all"
                  >
                    <MoreVertical className="w-3.5 h-3.5 text-white/30" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-[#191102] border border-white/10 rounded-lg shadow-2xl z-[70] p-1 overflow-hidden backdrop-blur-xl">
                        <button
                          onClick={() => { onEdit(task); setIsMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-white/40" />
                          <span>Edit Task</span>
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <div className="px-3 py-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Move to Day</p>
                        </div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                          {weekDays.map((day) => (
                            <button
                              key={day.toISOString()}
                              onClick={() => { onMove(day); setIsMenuOpen(false); }}
                              className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-white/5 transition-colors flex items-center justify-between"
                            >
                              <span>{format(day, 'EEE, MMM d')}</span>
                              {isSameDay(parseISO(task.date), day) && (
                                <div className="w-1 h-1 rounded-full bg-[#d6aa55]" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                          onClick={() => { onDelete(task.id); setIsMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Task</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Middle Row: Checkbox & Title */}
              <div className="flex gap-2.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggle(); }}
                  className={cn(
                    "mt-0.5 shrink-0 transition-all transform active:scale-90",
                    task.done ? "text-[#d6aa55]" : "text-white/20 hover:text-white/40"
                  )}
                >
                  {task.done ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Circle className="w-4.5 h-4.5" />}
                </button>
                
                <h3 className={cn(
                  "text-[13px] font-semibold leading-tight flex-1",
                  task.done && "line-through text-white/30"
                )}>
                  {task.title}
                </h3>
              </div>
              
              {/* Bottom Row: Notes & Phase */}
              {(task.notes || task.phase) && (
                <div className="flex flex-col gap-2 mt-1">
                  {task.notes && (
                    <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed italic font-light">
                      {task.notes}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-white/5 text-white/30">
                      {task.phase}
                    </span>
                    {task.done && (
                      <span className="text-[8px] font-bold text-[#d6aa55] uppercase tracking-widest">Done</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialTask?: Task | null;
  defaultDate?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialTask, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<Category>('job');
  const [phase, setPhase] = useState<Phase>('Stabilize');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setNotes(initialTask.notes);
      setCategory(initialTask.category);
      setPhase(initialTask.phase);
      setDate(initialTask.date);
    } else {
      setTitle('');
      setNotes('');
      setCategory('job');
      setPhase('Stabilize');
      setDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
    }
  }, [initialTask, defaultDate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#191102]/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#191102] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-lg font-semibold">{initialTask ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 opacity-40" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Title</label>
            <input 
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d6aa55]/50 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add some details..."
              rows={3}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d6aa55]/50 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d6aa55]/50 transition-colors appearance-none"
              >
                <option value="job" className="bg-[#191102]">New Job</option>
                <option value="fitness" className="bg-[#191102]">Fitness</option>
                <option value="yousquared" className="bg-[#191102]">YouSquared</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Phase</label>
              <select 
                value={phase}
                onChange={(e) => setPhase(e.target.value as Phase)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#d6aa55]/50 transition-colors appearance-none"
              >
                <option value="Stabilize" className="bg-[#191102]">Stabilize</option>
                <option value="Build" className="bg-[#191102]">Build</option>
                <option value="Convert" className="bg-[#191102]">Convert</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Date</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#d6aa55]/50 transition-colors"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave({ title, notes, category, phase, date })}
            disabled={!title}
            className="px-6 py-2 bg-[#d6aa55] text-[#191102] text-sm font-bold rounded-lg hover:bg-[#c49a4a] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Task
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_DATA.tasks);
  const [currentDate, setCurrentDate] = useState(new Date('2026-04-09'));
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [endDate, setEndDate] = useState(new Date('2026-07-07'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  // Calculate the week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filter === 'all' || t.category === filter);
  }, [tasks, filter]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const moveTask = (id: string, newDate: Date) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, date: format(newDate, 'yyyy-MM-dd') } : t));
  };

  const deleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || '',
        notes: taskData.notes || '',
        category: taskData.category || 'job',
        phase: taskData.phase || 'Stabilize',
        date: taskData.date || format(new Date(), 'yyyy-MM-dd'),
        done: false,
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const extendCalendar = () => {
    setEndDate(prev => addMonths(prev, 1));
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yousquared-tasks-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTasks = JSON.parse(content);
        
        if (Array.isArray(importedTasks)) {
          // Basic validation: check if first item has required fields
          if (importedTasks.length > 0) {
            const first = importedTasks[0];
            if (!first.id || !first.title || !first.category || !first.date) {
              throw new Error('Invalid task format');
            }
          }
          
          if (confirm(`Are you sure you want to import ${importedTasks.length} tasks? This will merge with your current tasks.`)) {
            setTasks(prev => {
              // Avoid duplicates by ID
              const existingIds = new Set(prev.map(t => t.id));
              const newTasks = importedTasks.filter(t => !existingIds.has(t.id));
              return [...prev, ...newTasks];
            });
          }
        }
      } catch (err) {
        alert('Failed to import tasks. Please ensure the file is a valid YouSquared export.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move task to new date
    const taskId = draggableId;
    const newDate = destination.droppableId; // droppableId is the date string
    
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, date: newDate } : t));
  };

  const totalDays = differenceInDays(endDate, parseISO(INITIAL_DATA.startDate)) + 1;
  const currentProgress = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-[#191102] text-white font-sans selection:bg-[#d6aa55] selection:text-[#191102]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#191102]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#d6aa55] rounded-lg flex items-center justify-center shadow-lg shadow-[#d6aa55]/20">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold tracking-tight">YouSquared</h1>
              <p className="text-xs text-white/40 uppercase tracking-widest font-medium">90-Day Transformation</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
              <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-2 sm:px-4 flex items-center gap-2 min-w-[140px] sm:min-w-[200px] justify-center">
                <CalendarIcon className="w-4 h-4 text-[#d6aa55] hidden xs:block" />
                <span className="font-medium text-xs sm:text-sm">
                  {format(weekDays[0], 'MMM d')} — {format(weekDays[6], 'MMM d')}
                </span>
              </div>
              <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={goToToday}
              className="hidden md:block text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10 mr-2">
              <button 
                onClick={exportTasks}
                className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-[#d6aa55]"
                title="Export Tasks"
              >
                <Download className="w-4 h-4" />
              </button>
              <label className="p-2 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-[#d6aa55] cursor-pointer" title="Import Tasks">
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={importTasks} className="hidden" />
              </label>
            </div>

            <div className="hidden lg:flex bg-white/5 rounded-lg p-1 border border-white/10">
              {(['all', 'job', 'fitness', 'yousquared'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                    filter === cat 
                      ? "bg-[#d6aa55] text-[#191102] shadow-sm" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat as Category].label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setEditingTask(null); setDefaultDate(undefined); setIsModalOpen(true); }}
              className="w-10 h-10 bg-[#d6aa55] text-[#191102] rounded-lg flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-[#d6aa55]/20"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-4 sm:p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 min-h-[calc(100vh-12rem)]">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasks = filteredTasks.filter(t => t.date === dateStr);
              const isDayToday = isToday(day);

              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "flex flex-col gap-4 rounded-2xl p-4 transition-all border",
                    isDayToday 
                      ? "bg-white/[0.03] border-[#d6aa55]/30 shadow-[0_0_40px_-15px_rgba(214,170,85,0.1)]" 
                      : "bg-transparent border-white/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className={cn(
                        "text-[10px] font-bold uppercase tracking-[0.2em]",
                        isDayToday ? "text-[#d6aa55]" : "text-white/30"
                      )}>
                        {format(day, 'EEEE')}
                      </h2>
                      <p className="text-2xl font-light mt-0.5">
                        {format(day, 'd')}
                      </p>
                    </div>
                    <button 
                      onClick={() => { setEditingTask(null); setDefaultDate(dateStr); setIsModalOpen(true); }}
                      className="p-2 bg-white/5 hover:bg-[#d6aa55]/20 hover:text-[#d6aa55] rounded-lg transition-all text-white/20"
                      title="Add Task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Droppable droppableId={dateStr}>
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "flex-1 flex flex-col min-h-[100px] transition-colors rounded-xl",
                          snapshot.isDraggingOver && "bg-white/[0.02]"
                        )}
                      >
                        {dayTasks.map((task, index) => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            index={index}
                            onToggle={() => toggleTask(task.id)}
                            onMove={(targetDay) => moveTask(task.id, targetDay)}
                            onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                            onDelete={deleteTask}
                            weekDays={weekDays}
                          />
                        ))}
                        {provided.placeholder}
                        
                        {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-xl opacity-20 py-8">
                            <p className="text-[9px] uppercase tracking-[0.3em] font-bold">Rest</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#191102]/95 backdrop-blur-2xl border-t border-white/10 py-4 px-6 sm:px-8 z-40">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <span className="text-[10px] uppercase tracking-wider text-white/40">Job: {tasks.filter(t => t.category === 'job' && t.done).length}/{tasks.filter(t => t.category === 'job').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="text-[10px] uppercase tracking-wider text-white/40">Fitness: {tasks.filter(t => t.category === 'fitness' && t.done).length}/{tasks.filter(t => t.category === 'fitness').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#d6aa55]" />
              <span className="text-[10px] uppercase tracking-wider text-white/40">YouSquared: {tasks.filter(t => t.category === 'yousquared' && t.done).length}/{tasks.filter(t => t.category === 'yousquared').length}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={extendCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
            >
              <CalendarPlus className="w-4 h-4 text-[#d6aa55] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Extend Plan</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="h-1 w-32 sm:w-48 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  className="h-full bg-[#d6aa55]"
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
                />
              </div>
              <span className="text-[#d6aa55] font-black text-[10px] uppercase tracking-widest">
                {currentProgress}%
              </span>
            </div>
          </div>
        </div>
      </footer>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultDate={defaultDate}
      />
    </div>
  );
}

