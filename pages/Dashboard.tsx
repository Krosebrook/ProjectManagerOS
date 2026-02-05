import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { Plus, Clock, ChevronRight, Trash2, Search, X } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('planai_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem('planai_projects', JSON.stringify(updated));
  };

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return projects;
    return projects.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.goal.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Manage your active projects and roadmaps.</p>
        </div>
        <Link 
          to="/generate" 
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus size={20} /> New Project
        </Link>
      </div>

      {/* Search Bar - Staff UI Refactor */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Search by title or goal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plus className="text-blue-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Build your first roadmap</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">Type a goal and let PlanAI architect the path forward for you.</p>
          <Link to="/generate">
            <button className="text-blue-600 font-bold hover:text-blue-700 transition-colors px-6 py-2 rounded-lg bg-blue-50">
              Get Started
            </button>
          </Link>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
          <div className="text-slate-400 mb-4 flex justify-center"><Search size={48} opacity={0.5} /></div>
          <h3 className="text-lg font-semibold text-slate-900">No results found</h3>
          <p className="text-slate-500">We couldn't find any projects matching "{searchQuery}"</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link 
              key={project.id} 
              to={`/project/${project.id}`}
              className="group flex flex-col bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-400 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Clock size={20} />
                </div>
                <button 
                  onClick={(e) => handleDelete(project.id, e)}
                  className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors relative z-10">
                {project.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow relative z-10">
                {project.summary}
              </p>

              <div className="flex items-center justify-between pt-5 border-t border-slate-100 relative z-10">
                <div className="flex flex-col">
                   <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Complexity</span>
                   <span className="text-xs font-semibold text-slate-700">
                    {project.phases.length} Phases • {project.phases.reduce((acc, p) => acc + p.tasks.length, 0)} Tasks
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
              
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;