import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, MapPin, Briefcase, Phone, Mail } from 'react-feather';

// Mock Data
const INITIAL_CLIENTS = [
  { id: '1', name: 'CORACORTHE', document: '12.345.678/0001-90', email: 'contato@coracorthe.com', address: 'Coracorthe Hardox Wearparts, BH', phone: '(31) 99999-9999' },
  { id: '2', name: 'Fábrica ABC', document: '98.765.432/0001-10', email: 'logistica@fabricaabc.com', address: 'Av. Industrial, 500 - Contagem, MG', phone: '(31) 3333-4444' },
  { id: '3', name: 'Mercado Central', document: '55.666.777/0001-22', email: 'admin@mercadocentral.com', address: 'Av. Augusto de Lima, 744 - Centro, BH', phone: '(31) 3274-9595' }
];

export default function ClientManager() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.includes(searchTerm)
  );

  const handleOpenModal = (client: any = null) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingClient(null);
    setIsModalOpen(false);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      name: formData.get('name') as string,
      document: formData.get('document') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
    };

    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c));
      import('react-hot-toast').then(({ toast }) => toast.success('Cliente atualizado!'));
    } else {
      setClients([...clients, { id: Math.random().toString(36).substr(2, 9), ...clientData }]);
      import('react-hot-toast').then(({ toast }) => toast.success('Cliente cadastrado com sucesso!'));
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col w-full max-w-7xl mx-auto pt-2 relative">
      
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Briefcase className="mr-3 text-blue-600" size={28} />
            Gestão de Clientes
          </h1>
          <p className="text-base text-gray-500 mt-1">Cadastre os clientes para agilizar o preenchimento da O.S. pelo inspetor.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Briefcase size={24} />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(client)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(client.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{client.name}</h3>
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded mt-1 mb-4">CNPJ: {client.document}</span>
            
            <div className="space-y-2">
              <div className="flex items-start text-xs text-gray-600">
                <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 shrink-0" />
                <span className="line-clamp-2">{client.address}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <Mail size={14} className="mr-2 text-gray-400 shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <Phone size={14} className="mr-2 text-gray-400 shrink-0" />
                <span>{client.phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[slideIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-extrabold text-gray-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Razão Social / Nome</label>
                  <input type="text" name="name" defaultValue={editingClient?.name} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">CNPJ / CPF</label>
                  <input type="text" name="document" defaultValue={editingClient?.document} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input type="text" name="phone" defaultValue={editingClient?.phone} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">E-mail</label>
                  <input type="email" name="email" defaultValue={editingClient?.email} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Endereço Completo</label>
                  <input type="text" name="address" defaultValue={editingClient?.address} required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white outline-none" />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
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
