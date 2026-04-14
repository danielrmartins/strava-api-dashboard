import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Dashboard } from './pages/Dashboard';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>
);
