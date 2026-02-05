import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, Phase, Task, Priority } from '../types';
import { ArrowLeft, Calendar, CheckCircle2, Circle, AlertTriangle, Edit3, Filter, X, Save } from 'lucide-react';
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

  const toggleTask = (phaseId: string, taskId: string) => {
    if (!project) return;

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

  const stats = useMemo(() => {
    if (!project) return { total: 0, completed: 0, progress: 0 };
    const total = project.phases.reduce((acc, p) => acc + p.tasks.length, 0);
    const completed = project.phases.reduce((acc, p) => acc + p.tasks.filter(t => t.completed).length, 0);
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, progress };
  }, [project]);

  const filteredPhases = useMemo(() => {
    if (!project) return [];
    return project.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.filter(task => {
        const priorityMatch = filterPriority === 'All' || task.priority === filterPriority;
        const statusMatch = filterStatus === 'All' || 
          (filterStatus === 'Completed' && task.completed) || 
          (filterStatus === 'Pending' && !task.completed);
        return priorityMatch && statusMatch;
      })
    })).filter(phase => phase.tasks.length > 0);
  }, [project, filterPriority, filterStatus]);

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
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100"
                  title="Edit project details"
                >
                  <Edit3 size={20} />
                </button>
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

          {/* Advanced Filtering Control Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 py-5 px-6 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
              <Filter size={18} className="text-blue-500" /> Filter Tasks
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                  {['All', 'High', 'Medium', 'Low'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p as any)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        filterPriority === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                  {['All', 'Pending', 'Completed'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s as any)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(filterPriority !== 'All' || filterStatus !== 'All') && (
              <button 
                onClick={() => { setFilterPriority('All'); setFilterStatus('All'); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 sm:ml-auto transition-colors"
              >
                <X size={14} /> Reset
              </button>
            )}
          </div>
        </div>

        <div className="p-8 md:p-10 pt-0">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
              {filteredPhases.length === 0 ? (
                <div className="text-center py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                  <div className="text-slate-300 mb-4"><Filter size={48} strokeWidth={1} className="mx-auto" /></div>
                  <h4 className="text-lg font-bold text-slate-800">No matching tasks</h4>
                  <p className="text-slate-500">Adjust your filters to see more of the roadmap.</p>
                </div>
              ) : (
                filteredPhases.map((phase) => (
                  <div key={phase.id} className="relative">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex-none h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-200">
                        {project.phases.findIndex(p => p.id === phase.id) + 1}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-tight">{phase.name}</h2>
                        <p className="text-sm text-slate-500">{phase.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {phase.tasks.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => toggleTask(phase.id, task.id)}
                          className={`
                            group p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start gap-5 relative overflow-hidden
                            ${task.completed 
                              ? 'bg-slate-50 border-slate-100' 
                              : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-0.5'}
                          `}
                        >
                          {/* Animated Background Overlay */}
                          <div className={`absolute inset-0 bg-blue-600/5 transition-transform duration-700 origin-left ease-in-out pointer-events-none ${task.completed ? 'scale-x-100' : 'scale-x-0'}`} />
                          
                          <div className="relative z-10 flex-none pt-0.5">
                            <div className={`
                              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500
                              ${task.completed 
                                ? 'bg-blue-600 border-blue-600 scale-110 shadow-lg shadow-blue-200' 
                                : 'bg-white border-slate-300 group-hover:border-blue-400'}
                            `}>
                              {task.completed && (
                                <CheckCircle2 size={16} className="text-white animate-in zoom-in-50 duration-500" />
                              )}
                            </div>
                          </div>

                          <div className="relative z-10 flex-1">
                            <h4 className={`text-base font-bold transition-all duration-500 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {task.title}
                            </h4>
                            <p className={`text-sm mt-1 transition-colors duration-500 ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>{task.description}</p>
                            
                            <div className="flex items-center gap-4 mt-4">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl sticky top-8 border-4 border-slate-800">
                 <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <AlertTriangle size={16} /> Risk Mitigation Radar
                 </h3>
                 <ul className="space-y-6">
                   {project.risks.map((risk, i) => (
                     <li key={i} className="flex gap-4 text-sm font-medium leading-relaxed group">
                       <span className="h-6 w-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-500 group-hover:text-blue-400 transition-colors">{i+1}</span>
                       <span className="text-slate-300">{risk}</span>
                     </li>
                   ))}
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

      {/* Edit Modal - Staff Implementation */}
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
    </div>
  );
};

export default ProjectDetails;