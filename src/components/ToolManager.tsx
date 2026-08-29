import React, { useState } from 'react';
import { RentalContract, Tool, ToolCategory, ToolCondition, ToolPowerType, ToolStatus, ToolVoltage } from '../types';
import { formatCurrency, formatDateBR, getPowerTypeLabel } from '../utils/formatters';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Zap, 
  Hammer, 
  Battery, 
  Fuel, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  History,
  X,
  Sparkles
} from 'lucide-react';

interface ToolManagerProps {
  tools: Tool[];
  contracts: RentalContract[];
  onSaveTool: (tool: Tool) => void;
  onDeleteTool: (toolId: string) => void;
  onNewRentalWithTool?: (toolId: string) => void;
}

export const ToolManager: React.FC<ToolManagerProps> = ({
  tools,
  contracts,
  onSaveTool,
  onDeleteTool,
  onNewRentalWithTool,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal state for editing or creating tool
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  // Modal state for viewing tool history
  const [historyTool, setHistoryTool] = useState<Tool | null>(null);

  // Form inputs
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<ToolCategory>('eletrica');
  const [brand, setBrand] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [powerType, setPowerType] = useState<ToolPowerType>('eletrica_cabo');
  const [voltage, setVoltage] = useState<ToolVoltage>('220V');
  const [dailyPrice, setDailyPrice] = useState<number>(50);
  const [replacementValue, setReplacementValue] = useState<number>(1500);
  const [defaultLateFeePerDay, setDefaultLateFeePerDay] = useState<number>(20);
  const [condition, setCondition] = useState<ToolCondition>('excelente');
  const [status, setStatus] = useState<ToolStatus>('disponivel');
  const [accessoriesIncluded, setAccessoriesIncluded] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const openNewToolModal = () => {
    setEditingTool(null);
    setName('');
    setCategory('eletrica');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setPowerType('eletrica_cabo');
    setVoltage('220V');
    setDailyPrice(50);
    setReplacementValue(1500);
    setDefaultLateFeePerDay(20);
    setCondition('excelente');
    setStatus('disponivel');
    setAccessoriesIncluded('');
    setNotes('');
    setIsFormModalOpen(true);
  };

  const openEditToolModal = (tool: Tool) => {
    setEditingTool(tool);
    setName(tool.name);
    setCategory(tool.category);
    setBrand(tool.brand);
    setModel(tool.model);
    setSerialNumber(tool.serialNumber);
    setPowerType(tool.powerType);
    setVoltage(tool.voltage);
    setDailyPrice(tool.dailyPrice);
    setReplacementValue(tool.replacementValue);
    setDefaultLateFeePerDay(tool.defaultLateFeePerDay);
    setCondition(tool.condition);
    setStatus(tool.status);
    setAccessoriesIncluded(tool.accessoriesIncluded || '');
    setNotes(tool.notes || '');
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const toolToSave: Tool = {
      id: editingTool ? editingTool.id : `tool-${Date.now()}`,
      name,
      category,
      brand,
      model,
      serialNumber,
      powerType,
      voltage,
      dailyPrice,
      replacementValue,
      defaultLateFeePerDay,
      condition,
      status,
      accessoriesIncluded,
      notes,
      createdAt: editingTool ? editingTool.createdAt : new Date().toISOString(),
    };

    onSaveTool(toolToSave);
    setIsFormModalOpen(false);
  };

  // Filter tools
  const filteredTools = tools.filter(tool => {
    if (categoryFilter !== 'all' && tool.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && tool.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = tool.name.toLowerCase().includes(term);
      const matchBrand = tool.brand.toLowerCase().includes(term);
      const matchModel = tool.model.toLowerCase().includes(term);
      const matchSerial = tool.serialNumber.toLowerCase().includes(term);
      return matchName || matchBrand || matchModel || matchSerial;
    }
    return true;
  });

  // Tool rental history
  const toolRentals = historyTool
    ? contracts.filter(c => c.tools.some(t => t.toolId === historyTool.id))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </span>
            Catálogo & Controle de Ferramentas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre e acompanhe ferramentas elétricas, manuais, a bateria e combustão com números de série, valores de diária e extravio.
          </p>
        </div>

        <button
          onClick={openNewToolModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 self-start sm:self-auto active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Ferramenta</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, marca, modelo ou número de série..."
            className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-xs font-medium focus:ring-1 focus:ring-amber-400"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 glass-input rounded-xl text-xs font-semibold text-slate-200"
        >
          <option value="all" className="bg-slate-900 text-slate-100">Todas as Categorias</option>
          <option value="eletrica" className="bg-slate-900 text-slate-100">⚡ Elétricas (Cabo / Bateria)</option>
          <option value="manual" className="bg-slate-900 text-slate-100">🔨 Manuais</option>
          <option value="combustao" className="bg-slate-900 text-slate-100">⛽ A Combustão (Gasolina)</option>
          <option value="bancada" className="bg-slate-900 text-slate-100">🛠️ Bancada / Corte</option>
          <option value="medicao" className="bg-slate-900 text-slate-100">📐 Medição / Nível</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 glass-input rounded-xl text-xs font-semibold text-slate-200"
        >
          <option value="all" className="bg-slate-900 text-slate-100">Todos os Status</option>
          <option value="disponivel" className="bg-slate-900 text-slate-100">🟢 Disponível</option>
          <option value="locado" className="bg-slate-900 text-slate-100">🟠 Locada</option>
          <option value="manutencao" className="bg-slate-900 text-slate-100">🔴 Em Manutenção</option>
        </select>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-slate-400 mx-auto flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhuma ferramenta encontrada</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ajuste os filtros de pesquisa ou cadastre uma nova ferramenta para iniciar o controle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map(tool => {
            const isRented = tool.status === 'locado';
            const isAvailable = tool.status === 'disponivel';

            return (
              <div
                key={tool.id}
                className="glass-panel rounded-2xl p-4 shadow-2xl hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Status & Category badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-slate-300 rounded-lg border border-white/10">
                      {tool.category}
                    </span>

                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border backdrop-blur-xs ${
                      isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : isRented
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {isAvailable ? '● Disponível' : isRented ? '● Locada' : '● Manutenção'}
                    </span>
                  </div>

                  {/* Title & Brand */}
                  <h3 className="font-black text-white text-sm leading-snug">{tool.name}</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {tool.brand} {tool.model}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    S/N: {tool.serialNumber || 'Não especificado'}
                  </p>

                  <div className="text-xs text-slate-300 mt-2.5 space-y-1">
                    <p>⚡ <strong className="text-slate-400">Tipo:</strong> {getPowerTypeLabel(tool.powerType, tool.voltage)}</p>
                    {tool.accessoriesIncluded && (
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        📦 <strong className="text-slate-300">Itens:</strong> {tool.accessoriesIncluded}
                      </p>
                    )}
                  </div>
                </div>

                {/* Financial values box */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2 glass-panel-subtle p-2.5 rounded-xl text-xs border border-white/10">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Diária Sugerida</span>
                      <strong className="text-white font-black text-sm">{formatCurrency(tool.dailyPrice)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Extravio</span>
                      <strong className="text-amber-300 font-bold">{formatCurrency(tool.replacementValue)}</strong>
                    </div>
                  </div>

                  {/* Card actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setHistoryTool(tool)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
                      title="Ver histórico de locações desta ferramenta"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Histórico</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditToolModal(tool)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Editar ferramenta"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja excluir a ferramenta ${tool.name}?`)) {
                            onDeleteTool(tool.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Excluir ferramenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT TOOL MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-slate-900/80 border-b border-white/10 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                {editingTool ? 'Editar Dados da Ferramenta' : 'Cadastrar Nova Ferramenta'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs text-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Nome / Descrição da Ferramenta *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Martelete Demolidor 15kg"
                    className="w-full px-3 py-2 glass-input rounded-xl font-medium text-xs focus:ring-1 focus:ring-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ToolCategory)}
                    className="w-full px-3 py-2 glass-input rounded-xl font-medium text-xs text-slate-200 focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="eletrica" className="bg-slate-900 text-slate-100">Elétrica</option>
                    <option value="manual" className="bg-slate-900 text-slate-100">Manual</option>
                    <option value="combustao" className="bg-slate-900 text-slate-100">A Combustão</option>
                    <option value="bancada" className="bg-slate-900 text-slate-100">Bancada / Corte</option>
                    <option value="medicao" className="bg-slate-900 text-slate-100">Medição / Nível</option>
                    <option value="acessorios" className="bg-slate-900 text-slate-100">Acessórios / Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Makita, Bosch, DeWalt"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Modelo</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: HM1203C - 1500W"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Nº de Série</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Ex: SN-998234"
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Alimentação</label>
                  <select
                    value={powerType}
                    onChange={(e) => setPowerType(e.target.value as ToolPowerType)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-200"
                  >
                    <option value="eletrica_cabo" className="bg-slate-900 text-slate-100">Elétrica (Cabo)</option>
                    <option value="bateria" className="bg-slate-900 text-slate-100">Bateria Recarregável</option>
                    <option value="manual" className="bg-slate-900 text-slate-100">Manual</option>
                    <option value="gasolina" className="bg-slate-900 text-slate-100">A Combustão (Gasolina)</option>
                    <option value="pneumatica" className="bg-slate-900 text-slate-100">Pneumática</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Voltagem</label>
                  <select
                    value={voltage}
                    onChange={(e) => setVoltage(e.target.value as ToolVoltage)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-200"
                  >
                    <option value="220V" className="bg-slate-900 text-slate-100">220V</option>
                    <option value="110V" className="bg-slate-900 text-slate-100">110V</option>
                    <option value="Bivolt" className="bg-slate-900 text-slate-100">Bivolt</option>
                    <option value="Bateria" className="bg-slate-900 text-slate-100">Bateria</option>
                    <option value="N/A" className="bg-slate-900 text-slate-100">N/A (Manual/Gasolina)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Status Atual</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ToolStatus)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs font-semibold text-slate-200"
                  >
                    <option value="disponivel" className="bg-slate-900 text-slate-100">Disponível</option>
                    <option value="locado" className="bg-slate-900 text-slate-100">Locado</option>
                    <option value="manutencao" className="bg-slate-900 text-slate-100">Em Manutenção</option>
                  </select>
                </div>
              </div>

              {/* Financial values */}
              <div className="p-3.5 glass-panel-subtle border border-white/10 rounded-xl space-y-3">
                <h4 className="font-bold text-white uppercase text-[11px]">
                  Valores Padrão para Contratos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Valor da Diária (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dailyPrice}
                      onChange={(e) => setDailyPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 glass-input rounded-xl font-bold text-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-300 mb-1">
                      🛡️ Valor Extravio/Perda (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={replacementValue}
                      onChange={(e) => setReplacementValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 glass-input rounded-xl font-bold text-amber-300 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-rose-300 mb-1">
                      ⚠️ Multa Atraso (R$/dia)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={defaultLateFeePerDay}
                      onChange={(e) => setDefaultLateFeePerDay(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 glass-input rounded-xl font-bold text-rose-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Acessórios e Itens Inclusos (Maleta, ponteiros, brocas, etc.)
                </label>
                <input
                  type="text"
                  value={accessoriesIncluded}
                  onChange={(e) => setAccessoriesIncluded(e.target.value)}
                  placeholder="Ex: 1 Maleta plástica, 2 baterias, 1 carregador rápido, chave mandril"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Observações Técnicas / Manutenção
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Revisada troca de carvão em Jan/2026."
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
                  {editingTool ? 'Salvar Alterações' : 'Cadastrar Ferramenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOOL RENTAL HISTORY MODAL */}
      {historyTool && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/20 w-full max-w-xl overflow-hidden my-auto">
            <div className="bg-slate-900/80 border-b border-white/10 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Histórico de Locações da Ferramenta</h3>
                  <p className="text-xs text-slate-400">{historyTool.name} ({historyTool.brand})</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryTool(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3 text-xs">
              {toolRentals.length === 0 ? (
                <p className="text-center text-slate-400 py-6">
                  Nenhuma locação registrada para esta ferramenta ainda.
                </p>
              ) : (
                toolRentals.map(contract => (
                  <div key={contract.id} className="p-3.5 glass-panel-subtle border border-white/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white">{contract.contractNumber}</span>
                      <span className="font-bold text-amber-300">{formatCurrency(contract.totalRentalValue)}</span>
                    </div>
                    <p className="text-slate-300">Locatário: <strong className="text-white">{contract.clientSnapshot.name}</strong></p>
                    <p className="text-slate-400 text-[11px]">
                      Período: {formatDateBR(contract.startDate)} até {formatDateBR(contract.expectedEndDate)} ({contract.rentalDays} dias)
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 bg-white/5 border-t border-white/10 text-right">
              <button
                onClick={() => setHistoryTool(null)}
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
