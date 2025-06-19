// React se necesita para el JSX aunque no se use explícitamente
// React se necesita para el JSX aunque no se use explícitamente
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import NotificationContainer from './components/common/NotificationContainer';
import LoginErrorManager from './components/common/LoginErrorManager'; // Importar el nuevo componente

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App transition-colors duration-300">
              <LoginErrorManager /> {/* Componente para manejar errores de login */}
              <NotificationContainer />
              <AppRoutes />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
