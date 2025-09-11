// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App.jsx';
// import './index.css';
// import { MantineProvider } from '@mantine/core';
// import '@mantine/core/styles.css';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <MantineProvider>
//     <App />
//   </MantineProvider>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Enhanced theme configuration
const theme = {
  colors: {
    brand: [
      '#f0f4ff',
      '#d9e2ff',
      '#b3c5ff',
      '#8da8ff',
      '#668bff',
      '#667eea',
      '#5a67d8',
      '#4c51bf',
      '#434190',
      '#3c366b'
    ]
  },
  primaryColor: 'brand',
  fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: 700,
  },
  components: {
    Button: {
      styles: {
        root: {
          borderRadius: '8px',
          fontWeight: 600,
        }
      }
    },
    Paper: {
      styles: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }
      }
    },
    Modal: {
      styles: {
        modal: {
          borderRadius: '16px',
          overflow: 'hidden',
        },
        header: {
          backgroundColor: 'var(--mantine-color-brand-6)',
          color: 'white',
          padding: '1.5rem',
        },
        title: {
          color: 'white',
          fontWeight: 600,
        },
        close: {
          color: 'white',
        },
        body: {
          padding: '1.5rem',
        }
      }
    },
    TextInput: {
      styles: {
        input: {
          borderRadius: '8px',
          border: '2px solid #e2e8f0',
          transition: 'all 0.2s',
          '&:focus': {
            borderColor: 'var(--mantine-color-brand-6)',
            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
          }
        }
      }
    },
    Textarea: {
      styles: {
        input: {
          borderRadius: '8px',
          border: '2px solid #e2e8f0',
          transition: 'all 0.2s',
          '&:focus': {
            borderColor: 'var(--mantine-color-brand-6)',
            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
          }
        }
      }
    }
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <MantineProvider theme={theme}>
    <Notifications 
      position="top-right" 
      zIndex={1000}
      containerWidth={400}
    />
    <App />
  </MantineProvider>
);