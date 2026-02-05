import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Zap, Shield } from 'lucide-react';
import Button from '../components/Button';

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="text-blue-600" size={24} />
          <span className="text-xl font-bold text-slate-900">PlanAI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/dashboard">
             <Button variant="ghost">Log In</Button>
          </Link>
          <Link to="/generate">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: Gemini 3.0 Integration
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            Turn vague ideas into <span className="text-blue-600">execution plans</span>.
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Stop struggling with "where to start". PlanAI breaks down your goals into prioritized tasks, timelines, and risk assessments instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/generate">
              <Button size="lg" className="gap-2">
                Create Project Plan <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline">View Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Breakdown</h3>
              <p className="text-slate-600">One sentence input generates a comprehensive multi-phase roadmap with task estimates.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Prioritization</h3>
              <p className="text-slate-600">AI automatically identifies critical path items and assigns priorities to keep you focused.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Risk Radar</h3>
              <p className="text-slate-600">Proactively identifies potential bottlenecks and risks before they become problems.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;