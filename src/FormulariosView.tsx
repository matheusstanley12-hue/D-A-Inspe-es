import React from 'react';
import { FilePlus } from 'react-feather';

export default function FormulariosView() {
  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative animate-[fadeIn_0.2s_ease-out]">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
          <FilePlus className="mr-3 text-blue-600" size={28} />
          Gestão de Formulários
        </h1>
        <p className="text-base text-gray-500 mt-1">Crie e gerencie formulários customizados de inspeção.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center shadow-sm flex-1 mb-8">
        <FilePlus size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Nenhum formulário criado</h3>
        <p className="text-gray-500 mt-1">Esta funcionalidade está sendo desenvolvida.</p>
      </div>
    </div>
  );
}
