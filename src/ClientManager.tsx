import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Search, Plus, Edit2, Trash2, X, MapPin, Briefcase, Phone, Mail } from 'react-feather';
import toast from 'react-hot-toast';
import { getClients, saveClients, CLIENTS_CHANGE_EVENT, type SystemClient } from './stores/formulariosStore';

export default function ClientManager() {
  const [clients, setClients] = useState<SystemClient[]>(() => getClients());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<SystemClient | null>(null);

  useEffect(() => {
    const updateClients = () => {
      setClients(getClients());
    };
    window.addEventListener(CLIENTS_CHANGE_EVENT, updateClients);
    return () => {
      window.removeEventListener(CLIENTS_CHANGE_EVENT, updateClients);
    };
  }, []);

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cnpj.includes(searchTerm) ||
    c.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (client: SystemClient | null = null) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingClient(null);
    setIsModalOpen(false);
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const companyName = (formData.get('name') as string)?.trim();
    const cnpj = (formData.get('document') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || '';
    const email = (formData.get('email') as string)?.trim() || '';
    const address = (formData.get('address') as string)?.trim() || '';
    const contactName = (formData.get('contactName') as string)?.trim() || companyName;

    if (!companyName) {
      toast.error('Informe a razão social / nome do cliente.');
      return;
    }

    if (editingClient) {
      const updatedList = clients.map(c => 
        c.id === editingClient.id 
          ? { ...c, companyName, cnpj, phone, email, address, contactName } 
          : c
      );
      saveClients(updatedList);
      setClients(updatedList);
      toast.success('Cliente atualizado com sucesso!');
    } else {
      const newClient: SystemClient = {
        id: 'cli_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        companyName,
        cnpj,
        contactName,
        email,
        phone,
        address,
        activeOvs: 0,
        status: 'ativo',
        createdAt: new Date().toISOString(),
      };
      const updatedList = [newClient, ...clients];
      saveClients(updatedList);
      setClients(updatedList);
      toast.success('Cliente cadastrado com sucesso!');
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      const updatedList = clients.filter(c => c.id !== id);
      saveClients(updatedList, [id]);
      setClients(updatedList);
      toast.success('Cliente removido!');
    }
  };

  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Briefcase className="mr-3 text-blue-600" size={28} />
            Gestão de Clientes ({clients.length})
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Cadastre seus clientes para sincronização automática com o App Mobile dos Inspetores e emissão de O.S.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center cursor-pointer shrink-0"
        >
          <Plus size={18} className="mr-2" /> Novo Cliente
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Lista */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Briefcase size={26} />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">
            {searchTerm ? 'Nenhum cliente encontrado com esse filtro' : 'Nenhum cliente cadastrado ainda'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm 
              ? 'Tente buscar por outro termo ou limpe o campo de busca.'
              : 'Clique em "+ Novo Cliente" acima para cadastrar a primeira empresa parceira do sistema.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Briefcase size={24} />
                </div>
                <div className="flex space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(client)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{client.companyName}</h3>
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded mt-1 mb-4">
                CNPJ / CPF: {client.cnpj || 'Não informado'}
              </span>
              
              <div className="space-y-2">
                <div className="flex items-start text-xs text-gray-600">
                  <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 shrink-0" />
                  <span className="line-clamp-2">{client.address || 'Endereço não cadastrado'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400 shrink-0" />
                  <span className="truncate">{client.email || 'E-mail não cadastrado'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <Phone size={14} className="mr-2 text-gray-400 shrink-0" />
                  <span>{client.phone || 'Telefone não cadastrado'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[slideIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-extrabold text-gray-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Razão Social / Nome da Empresa *</label>
                  <input type="text" name="name" defaultValue={editingClient?.companyName} required placeholder="Ex: Mineração do Sul S/A" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">CNPJ / CPF</label>
                  <input type="text" name="document" defaultValue={editingClient?.cnpj} placeholder="00.000.000/0001-00" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input type="text" name="phone" defaultValue={editingClient?.phone} placeholder="(31) 99999-9999" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nome do Contato</label>
                  <input type="text" name="contactName" defaultValue={editingClient?.contactName} placeholder="Ex: Roberto Silva" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input type="email" name="email" defaultValue={editingClient?.email} placeholder="contato@empresa.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Endereço Completo</label>
                  <input type="text" name="address" defaultValue={editingClient?.address} placeholder="Ex: Av. das Indústrias, 1000 - Contagem, MG" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
