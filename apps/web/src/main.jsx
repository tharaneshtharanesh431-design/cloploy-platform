import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './router';
import { ProjectPreviewPage } from './pages/ProjectPreviewPage';
import './index.css';

const getSubdomain = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null;
  const parts = hostname.split('.');
  if (hostname.endsWith('.amazonaws.com')) {
    if (parts.length > 5) {
      if (parts[0] === 'www' || parts[0] === 'app') return null;
      return parts[0];
    }
    return null;
  }
  if (parts.length === 2 && parts[1] === 'localhost') return parts[0];
  if (parts.length >= 3) {
    if (parts[0] === 'www' || parts[0] === 'app') {
      if (parts.length > 3) return parts[1];
      return null;
    }
    return parts[0];
  }
  return null;
};

const subdomain = getSubdomain();
const isCustomDomain = !window.location.hostname.endsWith('localhost') && 
                       !window.location.hostname.endsWith('cloploy.app') &&
                       !window.location.hostname.endsWith('.amazonaws.com') &&
                       window.location.hostname !== 'localhost' &&
                       window.location.hostname !== '127.0.0.1';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (subdomain || isCustomDomain) {
  root.render(
    <React.StrictMode>
      <ProjectPreviewPage />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </React.StrictMode>
  );
}
