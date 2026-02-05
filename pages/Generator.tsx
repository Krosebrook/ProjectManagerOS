import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateProjectPlan } from '../services/geminiService';
import { Project } from '../types';
import Button from '../components/Button';
import { Wand2, AlertTriangle, FileText, ArrowLeft, Save } from 'lucide-react';

const Generator: React.FC = () => {
  const navigate = useNavigate();
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedProject, setGeneratedProject] = useState<Partial<Project> | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedProject(null);

    try {
      const result = await generateProjectPlan(goal, context);
      setGeneratedProject(result);
    } catch (err) {
      setError("Failed to generate plan. Please try again with a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedProject) return;

    // Persist to local storage
    const newProject: Project = {
      ...generatedProject as Project,
      id: `proj-${Date.now()}`,
      goal,
      createdAt: Date.now(),
      // Ensure generated phases have what they need, relying on service to provide structure
      phases: generatedProject.phases || []
    };

    const existingProjects = JSON.parse(localStorage.getItem('planai_projects') || '[]');
    localStorage.setItem('planai_projects', JSON.stringify([newProject, ...existingProjects]));
    
    navigate('/dashboard');
  };

  // Preview Mode
  if (generatedProject) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setGeneratedProject(null)}
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to Edit
          </button>
          <Button onClick={handleSave} className="gap-2">
            <Save size={18} /> Save Project
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{generatedProject.title}</h2>
            <p className="text-slate-600 leading-relaxed">{generatedProject.summary}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> Execution Plan
              </h3>
              
              {generatedProject.phases?.map((phase, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-semibold text-slate-800">{phase.name}</h4>
                    <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                      {phase.tasks.length} tasks
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {phase.tasks.map((task, tIdx) => (
                      <div key={tIdx} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'High' ? 'bg-red-50 text-red-700' :
                            task.priority === 'Medium' ? 'bg-amber-50 text-amber-700' :
                            'bg-green-50 text-green-700'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400">{task.estimate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Risks */}
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
                <h3 className="text-amber-800 font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} /> Potential Risks
                </h3>
                <ul className="space-y-3">
                  {generatedProject.risks?.map((risk, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-amber-900/80">
                      <span className="text-amber-500 font-bold">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Input Mode
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">What do you want to build?</h1>
        <p className="text-slate-600">Describe your goal, and our AI will architect the roadmap.</p>
      </div>

      <form onSubmit={handleGenerate} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Project Goal <span className="text-red-500">*</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Launch a new organic coffee brand for remote workers..."
            className="w-full h-32 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all placeholder:text-slate-400"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Additional Context (Optional)
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Budget is $5k, timeline is 2 months"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <Button 
          type="submit" 
          size="lg" 
          className="w-full gap-2"
          isLoading={isGenerating}
        >
          {isGenerating ? 'Analyzing Requirements...' : (
            <>
              <Wand2 size={20} /> Generate Roadmap
            </>
          )}
        </Button>
      </form>

      {/* Examples */}
      <div className="mt-8">
        <p className="text-sm font-medium text-slate-500 mb-3 text-center">Try these examples:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["Plan a company retreat", "Build a React Native app", "Write a fantasy novel"].map(example => (
            <button
              key={example}
              type="button"
              onClick={() => setGoal(example)}
              className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Generator;