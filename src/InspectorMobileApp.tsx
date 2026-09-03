import React, { useState } from 'react';
import { MapPin, Navigation, Camera, DollarSign, CheckCircle, Clock, AlertCircle, ChevronRight, LogOut, Coffee, FileText } from 'react-feather';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function InspectorMobileApp({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'rota' | 'gastos'>('rota');
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startedDestinations, setStartedDestinations] = useState<number[]>([]);
  
  // States for Gastos (Meal Allowance)
  const limit = 50.00; // Limite diário definido pelo gestor
  const [gastoValue, setGastoValue] = useState('');
  const [gastos, setGastos] = useState<{valor: number, receipt: boolean}[]>([]);
  const totalGasto = gastos.reduce((acc, curr) => acc + curr.valor, 0);

  const mockRoute = [
    { id: 1, time: '08:00', location: 'Sede D&A', status: 'done' },
    { id: 2, time: '09:30', location: 'Mercado Central, BH', type: 'INSP-EST' },
    { id: 3, time: '14:00', location: 'Fábrica ABC, Contagem', type: 'INSP-SOLD' }
  ];

  const handleStartInspection = (id: number) => {
    setIsStarting(true);
    setTimeout(() => {
      setIsStarting(false);
      setStartedDestinations([...startedDestinations, id]);
      toast.success('Ordem de Serviço gerada automaticamente e enviada para o Gestor!');
    }, 1500);
  };

  const handleAddGasto = () => {
    const val = parseFloat(gastoValue.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      // simulate taking a photo
      setTimeout(() => {
        setGastos([...gastos, { valor: val, receipt: true }]);
        setGastoValue('');
        toast.success('Comprovante salvo com sucesso!');
      }, 500);
    }
  };

  return (
    <div className="flex justify-center bg-gray-900 min-h-screen">
      {/* Mobile App Container */}
      <div className="w-full max-w-[400px] bg-gray-50 flex flex-col h-screen shadow-2xl overflow-hidden relative">
        
        {/* Mobile Status Bar (Fake) */}
        <div className="bg-blue-700 text-white text-[10px] font-bold px-4 py-1.5 flex justify-between items-center z-10">
          <span>09:41</span>
          <div className="flex space-x-1">
            <span className="bg-white/20 px-1 rounded">5G</span>
            <span className="bg-white/20 px-1 rounded">100%</span>
          </div>
        </div>

        {/* App Header */}
        <header className="bg-blue-700 text-white px-5 pt-4 pb-6 rounded-b-[2rem] shadow-md z-10 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-0.5">Inspetor</p>
              <h1 className="text-xl font-extrabold">João Silva</h1>
            </div>
            <button onClick={onLogout} className="p-2 bg-blue-800 rounded-full hover:bg-blue-900 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 custom-scrollbar">
          
          {activeFormId !== null ? (
            <div className="space-y-6 animate-[slideIn_0.3s_ease-out]">
              <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                <button onClick={() => setActiveFormId(null)} className="mr-3 p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                  <ChevronRight size={16} className="rotate-180" />
                </button>
                <h2 className="text-lg font-extrabold text-gray-800 leading-tight">Formulário de Inspeção<br/><span className="text-sm font-bold text-blue-600">Diligenciamento</span></h2>
              </div>
              
              <div className="space-y-5">
                {/* Informações do Cliente */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">1. Informações do Cliente</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nome do Cliente</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800"
                        onChange={(e) => {
                          const val = e.target.value;
                          const cpfInput = document.getElementById('cpf_cnpj') as HTMLInputElement;
                          const enderecoInput = document.getElementById('endereco') as HTMLInputElement;
                          
                          if (val === 'coracorthe') {
                            if (cpfInput) cpfInput.value = '12.345.678/0001-90';
                            if (enderecoInput) enderecoInput.value = 'Coracorthe Hardox Wearparts, BH';
                          } else if (val === 'abc') {
                            if (cpfInput) cpfInput.value = '98.765.432/0001-10';
                            if (enderecoInput) enderecoInput.value = 'Av. Industrial, 500 - Contagem, MG';
                          } else if (val === 'mercado') {
                            if (cpfInput) cpfInput.value = '55.666.777/0001-22';
                            if (enderecoInput) enderecoInput.value = 'Av. Augusto de Lima, 744 - Centro, BH';
                          } else {
                            if (cpfInput) cpfInput.value = '';
                            if (enderecoInput) enderecoInput.value = '';
                          }
                        }}
                      >
                        <option value="">Selecione o Cliente...</option>
                        <option value="coracorthe">CORACORTHE</option>
                        <option value="abc">Fábrica ABC</option>
                        <option value="mercado">Mercado Central</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">CPF / CNPJ</label>
                      <input id="cpf_cnpj" type="text" placeholder="Auto-preenchido..." className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-500" readOnly />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Endereço</label>
                      <input id="endereco" type="text" placeholder="Auto-preenchido..." className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-500" readOnly />
                    </div>
                  </div>
                </div>

                {/* Tarefa */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">2. Execução e Relato</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Horário Chegada</label>
                      <input type="time" defaultValue="08:18" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Horário Saída</label>
                      <input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Relato de Execução</label>
                    <textarea rows={4} placeholder="Ex: Liberação dimensional final dos caps hardox não foram encontrado nenhuma divergência..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium text-gray-800 resize-none"></textarea>
                  </div>
                </div>

                {/* Diligenciamento */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">3. Diligenciamento</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">1) Nº do Pedido / OV</label>
                        <input type="text" placeholder="Ex: 4501730734" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">2) Quantidade</label>
                        <input type="number" placeholder="Ex: 120" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">3) Nº do Desenho</label>
                        <input type="text" placeholder="Ex: A754615 rev.0" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">4) Descrição</label>
                        <input type="text" placeholder="Ex: Caps hardox" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">5) Código da Peça</label>
                        <input type="text" placeholder="Ex: 705275..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">6) Relato</label>
                        <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-gray-800">
                          <option>Aprovado</option>
                          <option>Reprovado</option>
                          <option>Aprovado com Ressalvas</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fotos */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">4. Fotos (Obrigatório)</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Fake photos */}
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&h=200&fit=crop" className="opacity-80" />
                    </div>
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1581092335397-9583eb92d232?w=200&h=200&fit=crop" className="opacity-80" />
                    </div>
                    <button className="aspect-square bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                      <Camera size={24} className="mb-1" />
                      <span className="text-[10px] font-bold">Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Assinatura e Envio */}
                <button 
                  onClick={() => {
                    toast.success('Assinatura digital recolhida. PDF gerado e enviado ao gestor!');
                    setActiveFormId(null);
                  }}
                  className="w-full bg-emerald-600 text-white font-extrabold text-sm py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center mt-6"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Assinar e Finalizar O.S.
                </button>

              </div>
            </div>
          ) : activeTab === 'rota' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-lg font-extrabold text-gray-800">Sua Rota Hoje</h2>
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md">{format(new Date(), 'dd/MM/yyyy')}</span>
              </div>

              <div className="relative pl-4 space-y-6">
                {/* Vertical Timeline Line */}
                <div className="absolute left-[23px] top-4 bottom-8 w-0.5 bg-gray-200"></div>

                {mockRoute.map((stop, idx) => {
                  const isStarted = startedDestinations.includes(stop.id);
                  const isDone = stop.status === 'done';

                  return (
                    <div key={stop.id} className="relative z-10">
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full border-[3px] border-white shadow-sm flex-shrink-0 z-10 ${isDone || isStarted ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        <span className="ml-3 text-sm font-bold text-gray-500">{stop.time}</span>
                      </div>
                      
                      <div className={`ml-8 p-4 rounded-2xl border ${isStarted ? 'bg-blue-50 border-blue-200' : isDone ? 'bg-gray-100 border-transparent opacity-60' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <h3 className="font-bold text-gray-900 leading-tight">{stop.location}</h3>
                        {stop.type && <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">{stop.type}</p>}
                        
                        {!isDone && !isStarted && (
                          <button 
                            onClick={() => handleStartInspection(stop.id)}
                            disabled={isStarting}
                            className="mt-4 w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all flex justify-center items-center"
                          >
                            {isStarting ? (
                              <Clock size={18} className="animate-spin" />
                            ) : (
                              <>
                                <Navigation size={16} className="mr-2" /> Iniciar Inspeção
                              </>
                            )}
                          </button>
                        )}

                        {isStarted && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg text-[11px] font-bold">
                              <CheckCircle size={14} className="mr-2" />
                              O.S. Gerada. Serviço em Andamento.
                            </div>
                            <button 
                              onClick={() => setActiveFormId(stop.id)}
                              className="w-full bg-white border-2 border-blue-600 text-blue-700 font-bold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex justify-center items-center"
                            >
                              <FileText size={16} className="mr-2" />
                              Preencher Formulário
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-gray-800">Alimentação / Gastos</h2>
                <p className="text-sm text-gray-500 mt-1">Registre seus gastos e anexe os comprovantes.</p>
              </div>

              {/* Limite Widget */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Limite Diário</p>
                  <p className="text-xl font-black text-gray-800 mt-0.5">R$ {limit.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Utilizado</p>
                  <p className={`text-xl font-black mt-0.5 ${totalGasto > limit ? 'text-red-600' : 'text-emerald-600'}`}>
                    R$ {totalGasto.toFixed(2)}
                  </p>
                </div>
              </div>

              {totalGasto > limit && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex items-start text-sm font-medium">
                  <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
                  Você ultrapassou o limite estabelecido pelo gestor. O valor excedente (R$ {(totalGasto - limit).toFixed(2)}) não será reembolsado automaticamente.
                </div>
              )}

              {/* Form Add Gasto */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <label className="text-xs font-bold text-gray-600 mb-2 block">Novo Gasto (R$)</label>
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold">R$</span>
                  </div>
                  <input 
                    type="number" 
                    value={gastoValue}
                    onChange={(e) => setGastoValue(e.target.value)}
                    placeholder="0.00" 
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button 
                  onClick={handleAddGasto}
                  disabled={!gastoValue}
                  className="w-full bg-gray-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-black transition-colors flex justify-center items-center disabled:opacity-50"
                >
                  <Camera size={16} className="mr-2" /> Tirar Foto do Comprovante
                </button>
              </div>

              {/* Lista de Gastos */}
              {gastos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 mt-2">Comprovantes Salvos</h3>
                  {gastos.map((g, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                          <Coffee size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">Alimentação</p>
                          <p className="text-xs font-medium text-emerald-600 flex items-center mt-0.5"><CheckCircle size={10} className="mr-1"/> Foto Anexada</p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900">R$ {g.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-6 pt-3 px-6 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-20">
          <button 
            onClick={() => setActiveTab('rota')}
            className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'rota' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MapPin size={24} className={activeTab === 'rota' ? 'fill-blue-50' : ''} />
            <span className="text-[10px] font-bold mt-1">Minha Rota</span>
          </button>
          
          <button className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg -mt-8 mb-1 border-4 border-gray-50">
              <Camera size={20} />
            </div>
            <span className="text-[10px] font-bold">Lente D&A</span>
          </button>

          <button 
            onClick={() => setActiveTab('gastos')}
            className={`flex flex-col items-center p-2 transition-colors ${activeTab === 'gastos' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <DollarSign size={24} className={activeTab === 'gastos' ? 'fill-blue-50' : ''} />
            <span className="text-[10px] font-bold mt-1">Gastos</span>
          </button>
        </div>

      </div>
    </div>
  );
}
