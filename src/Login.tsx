import React, { useState } from 'react';
import { Moon, Mail, Lock, LogIn, Eye, EyeOff } from 'react-feather';

const Login = ({ onLogin, error }: { onLogin: (email: string, pass: string) => void, error: string }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative bg-[#f4f7f9]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Subtle radial gradient to match the background glow in the image */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-blue-100/60 pointer-events-none"></div>

      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 w-full max-w-[400px] relative z-10 border border-gray-50">
        
        {/* Dark Mode Toggle */}
        <button className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-100">
          <Moon size={16} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8 mt-4">
          <img src="/logo.jpg" alt="D&A Inspeções Logo" className="h-28 object-contain" />
        </div>



        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }} className="space-y-4">
          {/* E-mail */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-md text-sm bg-[#f8fafc] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Digite seu e-mail"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-md text-sm bg-[#f8fafc] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0066cc] hover:bg-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-2"
          >
            <LogIn size={16} className="mr-2" />
            Entrar
          </button>
        </form>

        {/* Esqueci a senha */}
        <div className="mt-6 text-center">
          <a href="#" className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
