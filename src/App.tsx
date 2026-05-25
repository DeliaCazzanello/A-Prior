import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { TaskBoard } from './components/TaskBoard';
import { AccountService } from './lib/services/account';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await AccountService.login(email, password);
      } else {
        await AccountService.createAccount(email, password, username);
      }
      // Guardamos el email actual antes de limpiar el formulario
      setUserEmail(email);
      setIsLoggedIn(true);
    } catch (err: any) {
      const message = err?.message ?? String(err);
      setError(message);
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await AccountService.logout();
    } catch (err) {
      console.warn('Logout error', err);
    } finally {
      setIsLoggedIn(false);
      setEmail('');
      setPassword('');
      setIsLogin(false);
      setUserEmail(''); // Limpiamos el email al cerrar sesión
    }
  };

  // Si el usuario está logueado, mostrar el tablero de tareas
  if (isLoggedIn) {
    return <TaskBoard onLogout={handleLogout} userEmail={userEmail} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'linear-gradient(to bottom right, #000000, #066E8B)', boxSizing: 'border-box' }}>
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '100%', maxHeight: '680px', gridTemplateRows: '1fr' }}>
        {/* Panel izquierdo - Bienvenida */}
        <div className="relative p-8 md:p-6 flex flex-col justify-center items-start text-white" style={{ backgroundColor: '#066E8B' }}>
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1746563947316-6f4cc65a66fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYmxhY2slMjBhYnN0cmFjdCUyMHRleHR1cmV8ZW58MXx8fHwxNzYzMTY0OTc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          <div className="relative z-10 w-full" style={{ position: 'absolute', bottom: 0, left: 0, padding: '24px' }}>
            <div className="flex items-center gap-2 mb-4 md:mb-5">
              <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            
            <h1 className="text-3xl md:text-4xl mb-3">
              Bienvenido a
              <br />
              <span className="text-4xl md:text-5xl">A-Prior</span>
            </h1>
            
            <p className="text-base md:text-lg text-white max-w-md opacity-90">
              Prioriza tus tareas.
              <br />
              Maximiza tu tiempo.
            </p>
          </div>
        </div>

        {/* Panel derecho - Formulario */}
        <div className="bg-white p-6 md:p-6 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto py-6">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-gray-700">Nombre de usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Tu nombre o apodo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 bg-gray-50 border-gray-200"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-gray-700">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-gray-50 border-gray-200"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-gray-50 border-gray-200"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-black hover:bg-gray-800 text-white rounded-lg mt-4"
              >
                {isLogin ? 'Iniciar Sesión' : 'Registrar'}
              </Button>
            </form>

            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-xs text-center">{error}</p>
              </div>
            )}

            <div className="text-center my-3">
              <span className="text-gray-400 text-sm">o</span>
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-600 text-sm">
                {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              </p>
              
              <Button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full h-10 text-white rounded-lg"
                style={{ backgroundColor: '#066E8B' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#055670'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#066E8B'}
              >
                {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              A-Prior (To-Do List con Énfasis en Priorización Rápida)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}