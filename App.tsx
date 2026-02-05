import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import ProjectDetails from './pages/ProjectDetails';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate" element={<Generator />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;