import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-2">
            <h1 className="text-3xl font-bold text-gradient leading-tight">ORBIZ.ASIA</h1>
            <span className="text-sm text-dark-400 uppercase tracking-wider">B2B Platform</span>
          </div>
          <p className="text-dark-300">Профессиональная платформа для бизнеса</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;