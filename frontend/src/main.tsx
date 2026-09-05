import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import App from './App';
import './index.css';
import './utils/i18n';
import { SnackbarProvider } from 'notistack';
import { ColorModeProvider } from './hooks/useColorMode';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeProvider>
    <ChakraProvider value={defaultSystem}>
    <SnackbarProvider maxSnack={1} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} autoHideDuration={null}>
      <App />
    </SnackbarProvider>
    </ChakraProvider>
    </ColorModeProvider>
  </React.StrictMode>,
);
