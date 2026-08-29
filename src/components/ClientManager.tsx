import React, { useState } from 'react';
import { Client, DocumentType, RentalContract } from '../types';
import { formatCEP, formatCurrency, formatDateBR, formatDocument, formatPhone, openWhatsApp } from '../utils/formatters';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  MessageCircle, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  History, 
  X 
} from 'lucide-react';

interface ClientManagerProps {
  clients: Client[];
  contracts: RentalContract[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onNewRentalForClient?: (clientId: string) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({
  clients,
  contracts,
  onSaveClient,
  onDeleteClient,
  onNewRentalForClient,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [rgIe, setRgIe] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [complement, setComplement] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('SP');
  const [zipCode, setZipCode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const openNewClientModal = () => {
    setEditingClient(null);
    setName('');
    setDocumentType('CPF');
    setDocumentNumber('');
    setRgIe('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('São Paulo');
    setState('SP');
    setZipCode('');
    setNotes('');
    setIsFormModalOpen(true);
  };

  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setDocumentType(client.documentType);
    setDocumentNumber(client.documentNumber);
    setRgIe(client.rgIe || '');
    setPhone(client.phone);
    setWhatsapp(client.whatsapp || client.phone);
    setEmail(client.email || '');
    setStreet(client.address.street);
    setNumber(client.address.number);
    setComplement(client.address.complement || '');
    setNeighborhood(client.address.neighborhood);
    setCity(client.address.city);
    setState(client.address.state);
    setZipCode(client.address.zipCode);
    setNotes(client.notes || '');
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const clientToSave: Client = {
      id: editingClient ? editingClient.id : `client-${Date.now()}`,
      name,
      documentType,
      documentNumber,
      rgIe,
      phone,
      whatsapp: whatsapp || phone,
      email,
      address: {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
      },
      notes,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
    };

    onSaveClient(clientToSave);
    setIsFormModalOpen(false);
  };

  const filteredClients = clients.filter(client => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = client.name.toLowerCase().includes(term);
      const matchDoc = client.documentNumber.includes(term);
      const matchPhone = client.phone.includes(term) || client.whatsapp.includes(term);
      return matchName || matchDoc || matchPhone;
    }
    return true;
  });

  const clientRentals = historyClient
    ? contracts.filter(c => c.clientId === historyClient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <Users className="w-5 h-5" />
            </span>
            Cadastro de Locatários (Clientes)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie o cadastro completo dos clientes, documentos, contatos e histórico de contratos emitidos.
          </p>
        </div>

        <button
          onClick={openNewClientModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 self-start sm:self-auto active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Locatário</span>
        </button>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-2xl shadow-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do cliente, CPF/CNPJ ou telefone..."
            className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum locatário cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cadastre os dados dos clientes para agilizar a emissão dos contratos de locação.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => {
            const countContracts = contracts.filter(c => c.clientId === client.id).length;

            return (
              <div
                key={client.id}
                className="glass-panel rounded-2xl p-4 shadow-2xl hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-slate-300 rounded-lg font-mono border border-white/10">
                      {client.documentType}: {formatDocument(client.documentNumber)}
                    </span>

                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      {countContracts} {countContracts === 1 ? 'locação' : 'locações'}
                    </span>
                  </div>

                  <h3 className="font-black text-white text-sm leading-snug">{client.name}</h3>

                  <div className="text-xs text-slate-300 mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatPhone(client.whatsapp || client.phone)}</span>
                    </div>

                    {client.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {client.address.street}, {client.address.number} - {client.address.neighborhood}, {client.address.city}/{client.address.state}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`Olá ${client.name}, tudo bem? Aqui é da locadora.`);
                      openWhatsApp(client.whatsapp || client.phone, msg);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistoryClient(client)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Ver histórico de locações"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openEditClientModal(client)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Editar cliente"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Deseja excluir o cliente ${client.name}?`)) {
                          onDeleteClient(client.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CLIENT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl overflow-hidden my-auto">
            <div className="bg-slate-900/80 border-b border-white/10 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                {editingClient ? 'Editar Cadastro do Locatário' : 'Cadastrar Novo Locatário'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs text-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Nome Completo / Razão Social *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Construtora Silva & Ramos LTDA"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="CPF" className="bg-slate-900 text-slate-100">CPF (Pessoa Física)</option>
                    <option value="CNPJ" className="bg-slate-900 text-slate-100">CNPJ (Pessoa Jurídica)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    {documentType} *
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder={documentType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    RG / Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={rgIe}
                    onChange={(e) => setRgIe(e.target.value)}
                    placeholder="Ex: 12.345.678-9 SSP/SP"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value);
                      if (!phone) setPhone(e.target.value);
                    }}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Telefone Fixo / Alternativo
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 3333-3333"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@cliente.com.br"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Address section */}
              <div className="p-3.5 glass-panel-subtle border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Endereço do Locatário / Obra
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-300 mb-1">Logradouro / Rua *</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Av. Paulista, Rua das Flores"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Número *</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 42, Bloco B"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Bairro *</label>
                    <input
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Centro"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Cidade *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">UF *</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="w-full px-3 py-2 glass-input rounded-xl text-xs font-bold text-center uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">CEP</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="01000-000"
                    className="w-48 px-3 py-2 glass-input rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Observações Internas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Apresentou comprovante de endereço; responsável pela retirada."
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl font-medium transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-98"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Locatário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT RENTAL HISTORY MODAL */}
      {historyClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/20 w-full max-w-xl overflow-hidden my-auto">
            <div className="bg-slate-900/80 border-b border-white/10 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Histórico de Locações do Cliente</h3>
                  <p className="text-xs text-slate-400">{historyClient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryClient(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3 text-xs">
              {clientRentals.length === 0 ? (
                <p className="text-center text-slate-400 py-6">
                  Nenhuma locação registrada para este cliente ainda.
                </p>
              ) : (
                clientRentals.map(contract => (
                  <div key={contract.id} className="p-3.5 glass-panel-subtle border border-white/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white">{contract.contractNumber}</span>
                      <span className="font-bold text-amber-300">{formatCurrency(contract.totalRentalValue)}</span>
                    </div>
                    <p className="text-slate-300">
                      Equipamentos: <strong className="text-white">{contract.tools.map(t => t.toolSnapshot.name).join(', ')}</strong>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Prazo: {formatDateBR(contract.startDate)} até {formatDateBR(contract.expectedEndDate)} ({contract.rentalDays} dias)
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 bg-white/5 border-t border-white/10 text-right">
              <button
                onClick={() => setHistoryClient(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
