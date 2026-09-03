import React, { useState } from 'react';
import { Edit2, Trash2, Shield, User, Mail, UserPlus, CheckCircle, XCircle } from 'react-feather';

const INITIAL_USERS = [
  { id: 1, name: 'Matheus Stanley', email: 'matheus.stanley12@gmail.com', role: 'gestor', status: 'ativo' },
  { id: 2, name: 'Teste Cliente', email: 'testecliente@gmail.com', role: 'cliente', status: 'ativo' },
  { id: 3, name: 'Teste Inspetor', email: 'testeinspetor@gmail.com', role: 'inspetor', status: 'ativo' }
];

const ROLE_COLORS: Record<string, string> = {
  gestor: 'bg-purple-100 text-purple-700 border-purple-200',
  financeiro: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inspetor: 'bg-blue-100 text-blue-700 border-blue-200',
  cliente: 'bg-orange-100 text-orange-700 border-orange-200'
};

const ROLE_LABELS: Record<string, string> = {
  gestor: 'Gestor',
  financeiro: 'Financeiro',
  inspetor: 'Inspetor',
  cliente: 'Cliente'
};

export default function UserManager() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'inspetor',
    status: 'ativo'
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', email: '', password: '', role: 'inspetor', status: 'ativo' });
    setEditingUserId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: typeof INITIAL_USERS[0]) => {
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', // Não carregamos a senha por segurança
      role: user.role, 
      status: user.status 
    });
    setEditingUserId(user.id);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if(confirm('Tem certeza que deseja remover este usuário do sistema?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingUserId) {
      setUsers(users.map(u => u.id === editingUserId ? { ...u, ...formData } : u));
    } else {
      const newUser = {
        id: Math.random(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      };
      setUsers([...users, newUser]);
    }
    setShowModal(false);
  };

  return (
    <div className="h-full flex flex-col w-full max-w-6xl mx-auto pt-4 relative">
      
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">Controle de acessos e permissões do sistema.</p>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center"
        >
          <UserPlus size={18} className="mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Lista / Tabela */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col mb-12">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nível de Acesso
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <User size={20} className="text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-0.5">
                          <Mail size={12} className="mr-1" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${ROLE_COLORS[user.role]}`}>
                      <Shield size={12} className="mr-1.5 mt-0.5" /> {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.status === 'ativo' ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                        <CheckCircle size={12} className="mr-1" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md">
                        <XCircle size={12} className="mr-1" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 p-2 rounded"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 p-2 rounded"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {users.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-medium text-gray-900">Nenhum usuário cadastrado.</p>
              <p className="text-sm">Clique em "Novo Usuário" para adicionar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                {editingUserId ? <Edit2 size={18} className="mr-2 text-blue-600"/> : <UserPlus size={18} className="mr-2 text-blue-600"/>}
                {editingUserId ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">NOME COMPLETO</label>
                <input 
                  type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                  placeholder="Ex: João da Silva"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">E-MAIL (Login)</label>
                <input 
                  type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500" 
                  placeholder="exemplo@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">SENHA</label>
                <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 flex items-center justify-between">
                  <span>Padrão do sistema: <strong className="text-gray-800">123456</strong></span>
                  <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Troca no 1º Acesso</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">NÍVEL DE ACESSO</label>
                  <select 
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 bg-white font-medium" 
                  >
                    <option value="inspetor">Inspetor</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="gestor">Gestor</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">STATUS</label>
                  <select 
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 bg-white font-medium" 
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {formData.role === 'cliente' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <label className="block text-xs font-bold text-orange-600 mb-1">EMPRESA DO CLIENTE</label>
                  <select 
                    className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-md text-sm focus:ring-1 focus:ring-orange-500 font-medium text-orange-900" 
                  >
                    <option value="">Selecione a empresa vinculada...</option>
                    <option value="CORACORTHE">CORACORTHE</option>
                    <option value="Fabrica ABC">Fábrica ABC</option>
                    <option value="Mercado Central">Mercado Central</option>
                    <option value="Weir">Weir</option>
                    <option value="JRDL">JRDL</option>
                    <option value="GALEÃO">GALEÃO</option>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Este usuário só terá acesso aos relatórios desta empresa.</p>
                </div>
              )}

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >Cancelar</button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                >Salvar Usuário</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
