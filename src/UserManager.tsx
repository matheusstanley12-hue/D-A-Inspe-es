import { useState, useEffect } from 'react';
import { Edit2, Trash2, Shield, User, Mail, UserPlus, CheckCircle, XCircle, Key, RefreshCw } from 'react-feather';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import {
  getSystemUsers,
  saveSystemUsers,
  resetUserPasswordToDefault,
  syncFromServer,
  DEFAULT_INITIAL_PASSWORD,
  MASTER_DEV_EMAIL,
  USERS_CHANGE_EVENT,
  type SystemUser,
} from './stores/formulariosStore';

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
  const [users, setUsers] = useState<SystemUser[]>(() => getSystemUsers());
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: SystemUser['role'];
    status: SystemUser['status'];
    company: string;
    resetPasswordOnEdit: boolean;
  }>({
    name: '',
    email: '',
    role: 'inspetor',
    status: 'ativo',
    company: '',
    resetPasswordOnEdit: false,
  });

  useEffect(() => {
    syncFromServer();
    const syncUsers = () => setUsers(getSystemUsers());
    window.addEventListener(USERS_CHANGE_EVENT, syncUsers);
    return () => window.removeEventListener(USERS_CHANGE_EVENT, syncUsers);
  }, []);

  // O usuário desenvolvedor master fica oculto da listagem comum de usuários
  const displayedUsers = users.filter(
    u => u.email?.trim().toLowerCase() !== MASTER_DEV_EMAIL
  );

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      role: 'inspetor',
      status: 'ativo',
      company: '',
      resetPasswordOnEdit: false,
    });
    setEditingUserId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      company: user.company || '',
      resetPasswordOnEdit: false,
    });
    setEditingUserId(String(user.id));
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const target = users.find(u => String(u.id) === String(id));
    if (target?.email?.trim().toLowerCase() === MASTER_DEV_EMAIL) {
      toast.error('O usuário desenvolvedor é protegido e não pode ser removido.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este usuário do sistema?')) {
      const updated = users.filter(u => String(u.id) !== String(id));
      saveSystemUsers(updated, true, [String(id)]);
      setUsers(updated);
      toast.success('Usuário removido.');
    }
  };

  const handleResetPassword = (user: SystemUser) => {
    resetUserPasswordToDefault(String(user.id));
    setUsers(getSystemUsers());
    toast.success(`Senha de "${user.name}" redefinida para a senha padrão ${DEFAULT_INITIAL_PASSWORD} (troca obrigatória no próximo acesso)!`);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      if (cleanEmail === MASTER_DEV_EMAIL) {
        toast.error('Este e-mail é de uso exclusivo do Desenvolvedor do Sistema.');
        setIsSaving(false);
        return;
      }
      const nowTs = Date.now();

      if (editingUserId) {
        const updated = users.map(u => {
          if (String(u.id) === String(editingUserId)) {
            return {
              ...u,
              name: formData.name.trim(),
              email: cleanEmail,
              role: formData.role,
              status: formData.status,
              company: formData.role === 'cliente' ? formData.company : undefined,
              password: formData.resetPasswordOnEdit ? DEFAULT_INITIAL_PASSWORD : u.password,
              mustChangePassword: formData.resetPasswordOnEdit ? true : u.mustChangePassword,
              passwordChangedAt: formData.resetPasswordOnEdit ? undefined : u.passwordChangedAt,
              updatedAt: nowTs,
            };
          }
          return u;
        });
        saveSystemUsers(updated, true);
        setUsers(updated);
        toast.success(
          formData.resetPasswordOnEdit
            ? `Usuário atualizado e senha redefinida para ${DEFAULT_INITIAL_PASSWORD}!`
            : 'Usuário atualizado com sucesso!'
        );
        setShowModal(false);
      } else {
        if (users.some(u => u.email.trim().toLowerCase() === cleanEmail)) {
          toast.error('Já existe um usuário cadastrado com este e-mail.');
          setIsSaving(false);
          return;
        }

        let createdUserId = 'usr_' + nowTs;

        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-do-supabase.supabase.co';
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-anon-key';

          const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          });

          const { data, error } = await tempClient.auth.signUp({
            email: cleanEmail,
            password: DEFAULT_INITIAL_PASSWORD,
            options: {
              data: {
                name: formData.name.trim(),
                role: formData.role,
                status: formData.status,
                company: formData.role === 'cliente' ? formData.company : undefined,
                must_change_password: true,
              }
            }
          });

          if (!error && data?.user) {
            createdUserId = data.user.id;
          }
        } catch (supaErr) {
          console.warn('Supabase offline/unreachable, saving locally:', supaErr);
        }

        const newUser: SystemUser = {
          id: createdUserId,
          name: formData.name.trim(),
          email: cleanEmail,
          password: DEFAULT_INITIAL_PASSWORD,
          role: formData.role,
          status: formData.status,
          company: formData.role === 'cliente' ? formData.company : undefined,
          mustChangePassword: true,
          updatedAt: nowTs,
        };

        const updated = [...users, newUser];
        saveSystemUsers(updated, true);
        setUsers(updated);
        toast.success(`Usuário "${newUser.name}" cadastrado com a senha padrão ${DEFAULT_INITIAL_PASSWORD}! No 1º acesso o sistema solicitará a troca de senha.`);
        setShowModal(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar: ' + (err?.message || 'Falha'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col w-full max-w-6xl mx-auto pt-4 relative">
      
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">
            Novos usuários recebem automaticamente a senha padrão <strong className="text-blue-700">{DEFAULT_INITIAL_PASSWORD}</strong> e alteram no primeiro acesso.
          </p>
        </div>
        
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center cursor-pointer"
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
                  Senha / 1º Acesso
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
              {displayedUsers.map((user) => (
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
                    {user.mustChangePassword ? (
                      <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                        <Key size={12} className="mr-1.5" />
                        Padrão: <strong className="ml-1 font-black">{DEFAULT_INITIAL_PASSWORD}</strong> (Troca no 1º Acesso)
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                        <CheckCircle size={12} className="mr-1.5" />
                        Senha Pessoal Definida
                      </span>
                    )}
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
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(user)}
                        className="text-amber-600 hover:text-amber-800 transition-colors bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded text-xs font-bold flex items-center cursor-pointer"
                        title={`Redefinir senha para ${DEFAULT_INITIAL_PASSWORD} (exigir troca no próximo login)`}
                      >
                        <RefreshCw size={13} className="mr-1" /> Resetar p/ {DEFAULT_INITIAL_PASSWORD}
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 p-2 rounded cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(String(user.id))}
                        className="text-gray-400 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 p-2 rounded cursor-pointer"
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
          
          {displayedUsers.length === 0 && (
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
                <label className="block text-xs font-bold text-gray-500 mb-1">SENHA DE ACESSO INICIAL</label>
                <div className="w-full px-3.5 py-2.5 border border-blue-200 bg-blue-50/60 rounded-lg text-sm text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key size={14} className="text-blue-600" />
                    Senha Padrão Automática: <strong className="text-blue-900 font-black tracking-wider">{DEFAULT_INITIAL_PASSWORD}</strong>
                  </span>
                  <span className="text-[10px] uppercase font-extrabold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded">
                    Troca no 1º Acesso
                  </span>
                </div>
                {editingUserId && (
                  <label className="mt-2 flex items-center gap-2 text-xs font-bold text-amber-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.resetPasswordOnEdit}
                      onChange={e => setFormData({ ...formData, resetPasswordOnEdit: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Redefinir senha deste usuário para {DEFAULT_INITIAL_PASSWORD} e exigir troca no próximo login
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">NÍVEL DE ACESSO</label>
                  <select 
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as SystemUser['role']})}
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
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as SystemUser['status']})}
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
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
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
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >Cancelar</button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 flex items-center cursor-pointer"
                >
                  {isSaving ? (
                    <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div> Salvando...</>
                  ) : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
