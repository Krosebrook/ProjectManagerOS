import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, Phase, Task, Priority, Risk } from '../types';
import { ArrowLeft, Calendar, CheckCircle2, Circle, AlertTriangle, Edit3, Filter, X, Save, GripVertical, Plus, Trash2, Link as LinkIcon, Lock } from 'lucide-react';
import Button from '../components/Button';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  
  // Filtering states
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Completed' | 'Pending'>('All');

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', summary: '', goal: '' });

  // Adding Task State
  const [addingTaskPhaseId, setAddingTaskPhaseId] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', estimate: '', priority: Priority.MEDIUM });

  // Adding Risk State
  const [addingRisk, setAddingRisk] = useState(false);
  const [newRiskForm, setNewRiskForm] = useState<Partial<Risk>>({
    description: '',
    severity: 'Medium',
    likelihood: 'Medium',
    mitigation: ''
  });

  // Editing Task State
  const [editingTask, setEditingTask] = useState<{ phaseId: string, task: Task } | null>(null);

  // Dependency Graph State
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);

  // DnD Refs
  const dragItem = useRef<{ phaseIndex: number; taskIndex: number } | null>(null);
  const dragOverItem = useRef<{ phaseIndex: number; taskIndex: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('planai_projects');
    if (saved && id) {
      const projects = JSON.parse(saved) as Project[];
      const found = projects.find(p => p.id === id);
      if (found) {
        setProject(found);
        setEditForm({ title: found.title, summary: found.summary, goal: found.goal });
      } else {
        navigate('/dashboard');
      }
    }
  }, [id, navigate]);

  const saveProjectToStore = (updatedProject: Project) => {
    const allProjects = JSON.parse(localStorage.getItem('planai_projects') || '[]');
    const newAllProjects = allProjects.map((p: Project) => p.id === updatedProject.id ? updatedProject : p);
    localStorage.setItem('planai_projects', JSON.stringify(newAllProjects));
    setProject(updatedProject);
  };

  const allTasks = useMemo(() => {
    if (!project) return [];
    return project.phases.flatMap(p => p.tasks);
  }, [project]);

  const isTaskBlocked = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return depTask && !depTask.completed;
    });
  };

  const toggleTask = (phaseId: string, taskId: string) => {
    if (!project) return;
    
    // Check if task is blocked
    const phase = project.phases.find(p => p.id === phaseId);
    const task = phase?.tasks.find(t => t.id === taskId);
    if (task && !task.completed && isTaskBlocked(task)) {
      alert("This task cannot be completed until all its dependencies are met.");
      return;
    }

    const updatedPhases = project.phases.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, completed: !t.completed };
        })
      };
    });
    saveProjectToStore({ ...project, phases: updatedPhases });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const updated = { ...project, ...editForm };
    saveProjectToStore(updated);
    setIsEditing(false);
  };

  // Drag and Drop Logic
  const handleDragStart = (phaseIndex: number, taskIndex: number) => {
    dragItem.current = { phaseIndex, taskIndex };
  };

  const handleDragEnter = (phaseIndex: number, taskIndex: number) => {
    dragOverItem.current = { phaseIndex, taskIndex };
  };

  const handleDragEnd = () => {
    if (!project || !dragItem.current || !dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const sourcePhaseIdx = dragItem.current.phaseIndex;
    const sourceTaskIdx = dragItem.current.taskIndex;
    const destPhaseIdx = dragOverItem.current.phaseIndex;
    const destTaskIdx = dragOverItem.current.taskIndex;

    if (sourcePhaseIdx === destPhaseIdx) {
      // Reorder within same phase
      const newPhases = [...project.phases];
      const phase = newPhases[sourcePhaseIdx];
      const newTasks = [...phase.tasks];
      
      const [draggedTask] = newTasks.splice(sourceTaskIdx, 1);
      newTasks.splice(destTaskIdx, 0, draggedTask);
      
      newPhases[sourcePhaseIdx] = { ...phase, tasks: newTasks };
      saveProjectToStore({ ...project, phases: newPhases });
    } else {
      // Move across phases
      const newPhases = [...project.phases];
      const sourcePhase = newPhases[sourcePhaseIdx];
      const destPhase = newPhases[destPhaseIdx];
      
      const sourceTasks = [...sourcePhase.tasks];
      const destTasks = [...destPhase.tasks];
      
      const [draggedTask] = sourceTasks.splice(sourceTaskIdx, 1);
      destTasks.splice(destTaskIdx, 0, draggedTask);
      
      newPhases[sourcePhaseIdx] = { ...sourcePhase, tasks: sourceTasks };
      newPhases[destPhaseIdx] = { ...destPhase, tasks: destTasks };
      saveProjectToStore({ ...project, phases: newPhases });
    }

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Add Task Logic
  const handleAddTask = (phaseId: string) => {
    if (!project || !newTaskForm.title.trim()) return;
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title,
      description: 'Manually added task',
      estimate: newTaskForm.estimate || '1 day',
      priority: newTaskForm.priority,
      completed: false
    };

    const updatedPhases = project.phases.map(p => {
      if (p.id !== phaseId) return p;
      return { ...p, tasks: [...p.tasks, newTask] };
    });

    saveProjectToStore({ ...project, phases: updatedPhases });
    setAddingTaskPhaseId(null);
    setNewTaskForm({ title: '', estimate: '', priority: Priority.MEDIUM });
  };

  const handleAddRisk = () => {
    if (!project || !newRiskForm.description?.trim()) return;
    
    const newRisk: Risk = {
      id: `risk-${Date.now()}`,
      description: newRiskForm.description,
      severity: newRiskForm.severity as any || 'Medium',
      likelihood: newRiskForm.likelihood as any || 'Medium',
      mitigation: newRiskForm.mitigation || ''
    };

    saveProjectToStore({ ...project, risks: [...project.risks, newRisk] });
    setAddingRisk(false);
    setNewRiskForm({ description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '' });
  };

  const deleteTask = (phaseId: string, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project || !window.confirm("Delete this task?")) return;
    const updatedPhases = project.phases.map(p => {
      if (p.id !== phaseId) return p;
      return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
    });
    saveProjectToStore({ ...project, phases: updatedPhases });
  };

  const stats = useMemo(() => {
    if (!project) return { total: 0, completed: 0, progress: 0 };
    const total = project.phases.reduce((acc, p) => acc + p.tasks.length, 0);
    const completed = project.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.completed).length, 0);
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [project]);

  // Apply filters visually but keep structure for DnD
  // Note: DnD is disabled when filters are active to prevent index confusion
  const isFiltered = filterPriority !== 'All' || filterStatus !== 'All';

  if (!project) return null;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link to="/dashboard" className="inline-flex items-center text-slate-500 hover:text-blue-600 font-medium transition-all mb-2 group">
        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </Link>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{project.title}</h1>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                    title="Edit project details"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button 
                    onClick={() => setShowDependencyGraph(true)}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                    title="View Dependency Graph"
                  >
                    <LinkIcon size={20} />
                  </button>
                </div>
              </div>
              <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">{project.summary}</p>
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 min-w-[280px] shadow-inner">
               <div className="flex justify-between items-end mb-3">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Progress</span>
                 <span className="text-3xl font-black text-blue-600 tabular-nums">{stats.progress}%</span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                 <div 
                   className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]" 
                   style={{ width: `${stats.progress}%` }}
                 ></div>
               </div>
               <div className="flex justify-between items-center mt-3">
                 <span className="text-xs font-medium text-slate-500">{stats.completed} of {stats.total} items done</span>
                 <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold uppercase tracking-tighter">Live</span>
               </div>
            </div>
        </div>
      </div>

      <div className="p-8 md:p-10 pt-0">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            {/* Refined Filter Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 py-4 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Filter size={16} className="text-blue-600" />
                  <span>Filter Roadmap</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                    <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
                      {['All', 'High', 'Medium', 'Low'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setFilterPriority(p as any)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            filterPriority === p 
                              ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {p === 'High' && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                          {p === 'Medium' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          {p === 'Low' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-100">
                      {['All', 'Pending', 'Completed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(s as any)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                            filterStatus === s 
                              ? 'bg-white text-blue-600 shadow-sm border border-slate-200' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {s === 'Completed' && <CheckCircle2 size={12} className="text-blue-600" />}
                          {s === 'Pending' && <Circle size={12} className="text-slate-400" />}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {isFiltered && (
                  <button 
                    onClick={() => { setFilterPriority('All'); setFilterStatus('All'); }}
                    className="text-xs text-slate-400 hover:text-red-500 font-bold flex items-center gap-1 md:ml-auto transition-colors group"
                  >
                    <X size={14} className="group-hover:rotate-90 transition-transform" /> Clear Filters
                  </button>
                )}
              </div>

              {project.phases.map((phase, phaseIndex) => {
                // Filter logic
                const visibleTasks = phase.tasks.filter(task => {
                  const priorityMatch = filterPriority === 'All' || task.priority === filterPriority;
                  const statusMatch = filterStatus === 'All' || 
                    (filterStatus === 'Completed' && task.completed) || 
                    (filterStatus === 'Pending' && !task.completed);
                  return priorityMatch && statusMatch;
                });

                if (visibleTasks.length === 0 && isFiltered) return null;

                return (
                  <div key={phase.id} className="relative">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex-none h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-200">
                        {phaseIndex + 1}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight">{phase.name}</h2>
                        <p className="text-sm text-slate-500">{phase.description}</p>
                      </div>
                    </div>
                    
                    <div 
                      className="grid gap-4 min-h-[100px] p-2 -m-2 rounded-2xl transition-colors"
                      onDragEnter={() => {
                        if (phase.tasks.length === 0) {
                          handleDragEnter(phaseIndex, 0);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      {visibleTasks.map((task, taskIndex) => (
                        <div 
                          key={task.id}
                          draggable={!isFiltered}
                          onDragStart={() => handleDragStart(phaseIndex, phase.tasks.indexOf(task))}
                          onDragEnter={() => handleDragEnter(phaseIndex, phase.tasks.indexOf(task))}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() => toggleTask(phase.id, task.id)}
                          className={`
                            group p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-5 relative overflow-hidden select-none
                            ${task.completed 
                              ? 'bg-slate-50 border-slate-100 opacity-75' 
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-0.5'}
                          `}
                        >
                          {!isFiltered && (
                            <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-blue-400">
                              <GripVertical size={16} />
                            </div>
                          )}

                          <div className="relative z-10 flex-none pt-0.5">
                            <div className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                              ${task.completed 
                                ? 'bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-200' 
                                : 'bg-white border-slate-300 group-hover:border-blue-400'}
                            `}>
                              <CheckCircle2 size={14} className={`text-white transition-all duration-300 ${task.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                            </div>
                          </div>

                          <div className="relative z-10 flex-1 min-w-0">
                            <h4 className={`text-base font-bold transition-all duration-300 truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {task.title}
                            </h4>
                            <p className={`text-sm mt-1 transition-colors duration-300 truncate ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>{task.description}</p>
                            
                            <div className="flex items-center gap-4 mt-3">
                               <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${
                                  task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {task.priority}
                                </span>
                              <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                <Calendar size={14} className="text-slate-300" /> {task.estimate}
                              </span>
                            </div>

                            {task.dependencies && task.dependencies.length > 0 && (
                              <div className="flex items-center gap-2 mt-3">
                                <LinkIcon size={12} className="text-slate-400" />
                                <div className="flex flex-wrap gap-1.5">
                                  {task.dependencies.map(depId => {
                                    const depTask = allTasks.find(t => t.id === depId);
                                    if (!depTask) return null;
                                    return (
                                      <span key={depId} className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 truncate max-w-[150px] ${
                                        depTask.completed ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                                      }`}>
                                        {depTask.completed ? <CheckCircle2 size={10} /> : <Lock size={10} />}
                                        {depTask.title}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingTask({ phaseId: phase.id, task }); }}
                              className="p-2 text-slate-300 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-all"
                              title="Edit task"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={(e) => deleteTask(phase.id, task.id, e)}
                              className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                              title="Delete task"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Task Area */}
                      {!isFiltered && (
                         <div className="mt-2">
                           {addingTaskPhaseId === phase.id ? (
                             <div className="bg-slate-50 border border-blue-200 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                               <div className="flex gap-3 mb-3">
                                 <input 
                                   autoFocus
                                   placeholder="Task title..."
                                   className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={newTaskForm.title}
                                   onChange={e => setNewTaskForm({...newTaskForm, title: e.target.value})}
                                 />
                                 <input 
                                   placeholder="Est (e.g. 2h)"
                                   className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={newTaskForm.estimate}
                                   onChange={e => setNewTaskForm({...newTaskForm, estimate: e.target.value})}
                                 />
                               </div>
                               <div className="flex items-center justify-between">
                                 <select 
                                   className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={newTaskForm.priority}
                                   onChange={e => setNewTaskForm({...newTaskForm, priority: e.target.value as Priority})}
                                 >
                                   <option value={Priority.HIGH}>High Priority</option>
                                   <option value={Priority.MEDIUM}>Medium Priority</option>
                                   <option value={Priority.LOW}>Low Priority</option>
                                 </select>
                                 <div className="flex gap-2">
                                   <button 
                                     onClick={() => setAddingTaskPhaseId(null)}
                                     className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg"
                                   >
                                     Cancel
                                   </button>
                                   <button 
                                     onClick={() => handleAddTask(phase.id)}
                                     className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                                   >
                                     Save Task
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ) : (
                             <button 
                               onClick={() => setAddingTaskPhaseId(phase.id)}
                               className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm font-bold"
                             >
                               <Plus size={16} /> Add Task
                             </button>
                           )}
                         </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl sticky top-8 border-4 border-slate-800">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                     <AlertTriangle size={16} /> Risk Mitigation Radar
                   </h3>
                   <button 
                     onClick={() => setAddingRisk(!addingRisk)}
                     className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                   >
                     {addingRisk ? <X size={14} /> : <Plus size={14} />}
                   </button>
                 </div>

                 {addingRisk && (
                   <div className="mb-6 bg-slate-800 rounded-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                       <input 
                         type="text"
                         value={newRiskForm.description}
                         onChange={e => setNewRiskForm({...newRiskForm, description: e.target.value})}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="What is the risk?"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                         <select 
                           value={newRiskForm.severity}
                           onChange={e => setNewRiskForm({...newRiskForm, severity: e.target.value as any})}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                         >
                           <option value="Low">Low</option>
                           <option value="Medium">Medium</option>
                           <option value="High">High</option>
                           <option value="Critical">Critical</option>
                         </select>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Likelihood</label>
                         <select 
                           value={newRiskForm.likelihood}
                           onChange={e => setNewRiskForm({...newRiskForm, likelihood: e.target.value as any})}
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                         >
                           <option value="Low">Low</option>
                           <option value="Medium">Medium</option>
                           <option value="High">High</option>
                         </select>
                       </div>
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mitigation (Optional)</label>
                       <textarea 
                         value={newRiskForm.mitigation}
                         onChange={e => setNewRiskForm({...newRiskForm, mitigation: e.target.value})}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16"
                         placeholder="How to prevent or handle it?"
                       />
                     </div>
                     <button 
                       onClick={handleAddRisk}
                       className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                     >
                       Add Risk
                     </button>
                   </div>
                 )}

                 <ul className="space-y-4">
                   {project.risks.map((risk, i) => {
                     const isString = typeof risk === 'string';
                     const description = isString ? risk : risk.description;
                     const severity = isString ? 'Medium' : risk.severity;
                     const likelihood = isString ? 'Medium' : risk.likelihood;
                     const mitigation = isString ? '' : risk.mitigation;

                     return (
                       <li key={i} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
                         <div className="flex items-start gap-3">
                           <div className={`mt-0.5 w-2 h-2 rounded-full flex-none ${
                             severity === 'Critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                             severity === 'High' ? 'bg-orange-500' :
                             severity === 'Medium' ? 'bg-amber-500' :
                             'bg-green-500'
                           }`} />
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-slate-200 leading-snug">{description}</p>
                             
                             {!isString && (
                               <div className="mt-3 space-y-2">
                                 <div className="flex flex-wrap gap-2">
                                   <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase tracking-wider border border-slate-700">
                                     Severity: <span className={
                                       severity === 'Critical' ? 'text-red-400' :
                                       severity === 'High' ? 'text-orange-400' :
                                       severity === 'Medium' ? 'text-amber-400' :
                                       'text-green-400'
                                     }>{severity}</span>
                                   </span>
                                   <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold uppercase tracking-wider border border-slate-700">
                                     Likelihood: <span className="text-slate-300">{likelihood}</span>
                                   </span>
                                 </div>
                                 {mitigation && (
                                   <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                     <span className="font-bold text-slate-500 block mb-0.5">Mitigation:</span>
                                     {mitigation}
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                         </div>
                       </li>
                     );
                   })}
                 </ul>

                 <div className="mt-12 pt-8 border-t border-slate-800">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Master Goal Statement</h3>
                    <p className="text-sm text-slate-400 italic leading-relaxed font-serif">"{project.goal}"</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Refine Roadmap</h3>
                <p className="text-slate-500 text-sm">Update the core vision and summary of this plan.</p>
              </div>
              <button 
                onClick={() => setIsEditing(false)} 
                className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-2xl shadow-sm hover:shadow transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Executive Summary</label>
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setEditForm({...editForm, summary: e.target.value})}
                  className="w-full h-32 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none font-medium text-slate-600"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Original High-Level Goal</label>
                <textarea
                  value={editForm.goal}
                  onChange={(e) => setEditForm({...editForm, goal: e.target.value})}
                  className="w-full h-32 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none font-medium text-slate-600"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-4 pt-6">
                <Button type="button" variant="ghost" className="px-8" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" className="gap-2 px-10 h-14 rounded-2xl shadow-lg shadow-blue-200">
                  <Save size={20} /> Update Blueprint
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 flex-none">
              <div>
                <h3 className="text-xl font-black text-slate-900">Edit Task</h3>
              </div>
              <button 
                onClick={() => setEditingTask(null)} 
                className="p-2 bg-white text-slate-400 hover:text-slate-900 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                  <input
                    type="text"
                    value={editingTask.task.title}
                    onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, title: e.target.value } })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    value={editingTask.task.description}
                    onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, description: e.target.value } })}
                    className="w-full h-24 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm text-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Estimate</label>
                    <input
                      type="text"
                      value={editingTask.task.estimate}
                      onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, estimate: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                    <select
                      value={editingTask.task.priority}
                      onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, priority: e.target.value as Priority } })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-900"
                    >
                      <option value={Priority.HIGH}>High</option>
                      <option value={Priority.MEDIUM}>Medium</option>
                      <option value={Priority.LOW}>Low</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dependencies (Must be completed first)</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                    {allTasks.filter(t => t.id !== editingTask.task.id).map(t => {
                      const isSelected = editingTask.task.dependencies?.includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                          <input 
                            type="checkbox" 
                            checked={isSelected || false}
                            onChange={(e) => {
                              const currentDeps = editingTask.task.dependencies || [];
                              const newDeps = e.target.checked 
                                ? [...currentDeps, t.id]
                                : currentDeps.filter(id => id !== t.id);
                              setEditingTask({ ...editingTask, task: { ...editingTask.task, dependencies: newDeps } });
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{t.title}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[400px]">{t.description}</span>
                          </div>
                        </label>
                      );
                    })}
                    {allTasks.length <= 1 && (
                      <p className="text-sm text-slate-500 italic">No other tasks available to set as dependencies.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-none">
              <Button variant="ghost" onClick={() => setEditingTask(null)}>Cancel</Button>
              <Button onClick={() => {
                const updatedPhases = project.phases.map(p => {
                  if (p.id !== editingTask.phaseId) return p;
                  return {
                    ...p,
                    tasks: p.tasks.map(t => t.id === editingTask.task.id ? editingTask.task : t)
                  };
                });
                saveProjectToStore({ ...project, phases: updatedPhases });
                setEditingTask(null);
              }}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
      {/* Dependency Graph Modal */}
      {showDependencyGraph && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 flex-none">
              <div>
                <h3 className="text-xl font-black text-slate-900">Dependency Graph</h3>
                <p className="text-slate-500 text-sm">Visual representation of task relationships.</p>
              </div>
              <button 
                onClick={() => setShowDependencyGraph(false)} 
                className="p-2 bg-white text-slate-400 hover:text-slate-900 rounded-xl shadow-sm hover:shadow transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              {allTasks.filter(t => t.dependencies && t.dependencies.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <LinkIcon size={48} className="mx-auto text-slate-300 mb-4" />
                  <h4 className="text-lg font-bold text-slate-700">No Dependencies Defined</h4>
                  <p className="text-slate-500 mt-2">Edit tasks to add dependencies and they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allTasks.filter(t => t.dependencies && t.dependencies.length > 0).map(task => (
                    <div key={task.id} className="flex items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex-1 flex flex-col items-end gap-3">
                        {task.dependencies?.map(depId => {
                          const dep = allTasks.find(t => t.id === depId);
                          if (!dep) return null;
                          return (
                            <div key={depId} className={`px-4 py-2 rounded-xl border text-sm font-bold shadow-sm ${dep.completed ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                              {dep.title}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex-none flex flex-col items-center justify-center w-16">
                        <div className="w-full h-0.5 bg-blue-200 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-blue-400 rotate-45"></div>
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2 bg-blue-50 px-2 py-0.5 rounded-full">Blocks</span>
                      </div>

                      <div className="flex-1">
                        <div className={`inline-block px-5 py-3 rounded-xl border-2 text-sm font-black shadow-md ${task.completed ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-blue-500 text-slate-900'}`}>
                          {task.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;