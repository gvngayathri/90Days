import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Upload,
  Zap,
  LogOut,
  LogIn
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
import { AFFIRMATIONS } from './constants';
import { 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

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
  onToggle: (id: string) => void;
  onMove: (id: string, date: Date) => void;
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
      {(provided, snapshot) => {
        // Close menu if drag starts
        if (snapshot.isDragging && isMenuOpen) {
          setIsMenuOpen(false);
        }

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              // Force pointer events to auto when not dragging to prevent "frozen" state
              pointerEvents: snapshot.isDragging ? ((provided.draggableProps.style as any)?.pointerEvents || 'none') : 'auto'
            }}
            className={cn(
              "relative mb-3 last:mb-0 force-pointer-events",
              snapshot.isDragging && "z-50"
            )}
          >
          <div
            className={cn(
              "group relative bg-white/[0.03] border border-white/10 rounded-xl p-3 hover:bg-white/[0.06] hover:border-white/20 shadow-sm",
              task.done && "opacity-50 grayscale-[0.3]"
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
                    className="p-1 hover:bg-white/10 rounded-md"
                  >
                    <MoreVertical className="w-3.5 h-3.5 text-white/30" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-[#191102] border border-white/10 rounded-lg shadow-2xl z-[70] p-1 overflow-hidden backdrop-blur-xl">
                        <button
                          onClick={() => { onEdit(task); setIsMenuOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center gap-2"
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
                              onClick={() => { onMove(task.id, day); setIsMenuOpen(false); }}
                              className="w-full text-left px-3 py-1.5 text-[10px] hover:bg-white/5 flex items-center justify-between"
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
                          className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 flex items-center gap-2"
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
                  onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                  className={cn(
                    "mt-0.5 shrink-0",
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
      );
    }}
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date('2026-04-09'));
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [endDate, setEndDate] = useState(new Date('2026-07-07'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Check for redirect result on mount (important for mobile login)
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect Login Error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach((doc) => {
        taskList.push(doc.data() as Task);
      });
      // Sort by order if needed, or just use Firestore ordering
      setTasks(taskList.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const login = async () => {
    try {
      // On mobile, popups are often blocked. Try popup first, then fallback to redirect.
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (popupError: any) {
          // If popup is blocked or fails, fallback to redirect
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-by-user') {
            await signInWithRedirect(auth, googleProvider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      alert(`Login failed: ${error.message}. Please ensure your domain is authorized in Firebase Console.`);
    }
  };

  const logout = () => signOut(auth);

  // Calculate the week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weeklyAffirmation = useMemo(() => {
    const dateStr = format(weekStart, 'yyyy-MM-dd');
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    return AFFIRMATIONS[Math.abs(hash) % AFFIRMATIONS.length];
  }, [weekStart]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filter === 'all' || t.category === filter);
  }, [tasks, filter]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      await updateDoc(doc(db, 'tasks', id), { done: !task.done });
    }
  }, [tasks]);

  const moveTask = useCallback(async (id: string, newDate: Date) => {
    await updateDoc(doc(db, 'tasks', id), { date: format(newDate, 'yyyy-MM-dd') });
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  }, []);

  const handleSaveTask = useCallback(async (taskData: Partial<Task>) => {
    if (!user) return;

    if (editingTask) {
      await updateDoc(doc(db, 'tasks', editingTask.id), { ...taskData });
    } else {
      const id = crypto.randomUUID();
      const newTask: any = {
        id,
        title: taskData.title || '',
        notes: taskData.notes || '',
        category: taskData.category || 'job',
        phase: taskData.phase || 'Stabilize',
        date: taskData.date || format(new Date(), 'yyyy-MM-dd'),
        done: false,
        userId: user.uid,
        order: tasks.length
      };
      await setDoc(doc(db, 'tasks', id), newTask);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  }, [editingTask, user, tasks.length]);

  const extendCalendar = useCallback(() => {
    setEndDate(prev => addMonths(prev, 1));
  }, []);

  const exportTasks = useCallback(() => {
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
  }, [tasks]);

  const importTasks = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedTasks = JSON.parse(content);
        
        if (Array.isArray(importedTasks)) {
          if (confirm(`Are you sure you want to import ${importedTasks.length} tasks?`)) {
            for (const t of importedTasks) {
              const id = t.id || crypto.randomUUID();
              await setDoc(doc(db, 'tasks', id), {
                ...t,
                id,
                userId: user.uid,
                done: !!t.done
              });
            }
          }
        }
      } catch (err) {
        alert('Failed to import tasks.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [user]);

  const nextWeek = useCallback(() => setCurrentDate(prev => addWeeks(prev, 1)), []);
  const prevWeek = useCallback(() => setCurrentDate(prev => subWeeks(prev, 1)), []);
  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const seedInitialData = useCallback(async () => {
    if (!user) return;
    
    if (confirm('This will load the pre-set 90-day transformation plan into your account. Continue?')) {
      const batch = writeBatch(db);
      
      INITIAL_DATA.tasks.forEach((task, index) => {
        const docRef = doc(collection(db, 'tasks'), task.id);
        batch.set(docRef, {
          ...task,
          userId: user.uid,
          done: false,
          order: index
        });
      });
      
      try {
        await batch.commit();
        alert('90-Day Plan loaded successfully!');
      } catch (error) {
        console.error("Error seeding data:", error);
        alert('Failed to load plan. Please try again.');
      }
    }
  }, [user]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId;
    const newDate = destination.droppableId;
    
    // Optimistic UI update (optional, but good for feel)
    // For now, let's just update Firestore and let onSnapshot handle it
    await updateDoc(doc(db, 'tasks', taskId), { 
      date: newDate,
      order: destination.index // Simplistic ordering
    });

    document.body.style.pointerEvents = 'auto';
    requestAnimationFrame(() => {
      window.scrollBy(0, 1);
      window.scrollBy(0, -1);
    });
  }, []);

  const onEditTask = useCallback((t: Task) => {
    setEditingTask(t);
    setIsModalOpen(true);
  }, []);

  const totalDays = differenceInDays(endDate, parseISO(INITIAL_DATA.startDate)) + 1;
  const currentProgress = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191102] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#d6aa55] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#d6aa55] font-bold uppercase tracking-widest text-xs">Loading Transformation...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#191102] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-[#d6aa55] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#d6aa55]/20 mx-auto">
            <span className="text-white font-bold text-4xl">G</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">YouSquared</h1>
            <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-medium">90-Day Transformation</p>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">
            Your journey to the best version of yourself starts here. Sign in to sync your progress across all your devices.
          </p>
          <button 
            onClick={login}
            className="w-full py-4 bg-white text-[#191102] font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
            {user && tasks.length === 0 && (
              <button 
                onClick={seedInitialData}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#d6aa55]/10 hover:bg-[#d6aa55]/20 border border-[#d6aa55]/20 rounded-lg text-[#d6aa55] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Load 90-Day Plan</span>
                <span className="xs:hidden">Load Plan</span>
              </button>
            )}

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
              onClick={logout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>

              <button 
                onClick={() => { setEditingTask(null); setDefaultDate(undefined); setIsModalOpen(true); }}
                className="w-10 h-10 bg-[#d6aa55] text-[#191102] rounded-lg flex items-center justify-center shadow-lg shadow-[#d6aa55]/20"
              >
                <Plus className="w-6 h-6" />
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto p-4 sm:p-6 pb-40 lg:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 min-h-[calc(100vh-12rem)]">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasks = filteredTasks.filter(t => t.date === dateStr);
              const isDayToday = isToday(day);

              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "flex flex-col gap-4 rounded-2xl p-4 border",
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
                      className="p-2 bg-white/5 hover:bg-[#d6aa55]/20 hover:text-[#d6aa55] rounded-lg text-white/20"
                      title="Add Task"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Droppable droppableId={dateStr} type="TASK">
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 flex flex-col min-h-[100px] rounded-xl"
                        style={{ pointerEvents: 'auto' }}
                      >
                        {dayTasks.map((task, index) => (
                          <TaskCard 
                            key={`${task.id}-${task.date}-${index}`} 
                            task={task} 
                            index={index}
                            onToggle={toggleTask}
                            onMove={moveTask}
                            onEdit={onEditTask}
                            onDelete={deleteTask}
                            weekDays={weekDays}
                          />
                        ))}
                        {provided.placeholder}
                        
                        {dayTasks.length === 0 && (
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

          {/* Weekly Affirmation removed from here */}
        </main>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#191102]/95 backdrop-blur-2xl border-t border-white/10 py-4 px-6 sm:px-8 z-40">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
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

          {/* Weekly Affirmation - Compact in Footer */}
          <div className="flex flex-1 items-center justify-center px-4 lg:px-8 border-y lg:border-y-0 lg:border-x border-white/5 my-4 lg:my-0 py-2 lg:py-0 mx-2 lg:mx-4">
            <div className="flex items-center gap-3 max-w-2xl">
              <Zap className="w-3 h-3 text-[#d6aa55] shrink-0" />
              <motion.p 
                key={weeklyAffirmation}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] font-serif italic text-white/60 text-center lg:text-left"
              >
                "{weeklyAffirmation}"
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={extendCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg group"
            >
              <CalendarPlus className="w-4 h-4 text-[#d6aa55]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Extend Plan</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="h-1 w-20 sm:w-32 bg-white/5 rounded-full overflow-hidden border border-white/10">
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
    </DragDropContext>
  );
}

