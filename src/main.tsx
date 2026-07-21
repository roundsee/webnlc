import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import 'react-quill/dist/quill.snow.css';
import '@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);