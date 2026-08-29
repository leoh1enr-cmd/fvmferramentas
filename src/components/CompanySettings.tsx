import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { exportAllDataJson, importAllDataJson, resetAllDataToDemo } from '../utils/storage';
import { DEFAULT_PASSWORD, getAppPassword, resetAppPasswordToDefault, saveAppPassword } from '../utils/auth';
import { formatCEP, formatCNPJ, formatDocument, formatPhone } from '../utils/formatters';
import { 
  Building2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  ShieldAlert, 
  CreditCard,
  FileText,
  Lock,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';

interface CompanySettingsProps {
  company: CompanyProfile;
  onSaveCompany: (updatedCompany: CompanyProfile) => void;
  onReloadData: () => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({
  company,
  onSaveCompany,
  onReloadData,
}) => {
  const [tradeName, setTradeName] = useState<string>(company.tradeName || '');
  const [legalName, setLegalName] = useState<string>(company.legalName || '');
  const [cnpjCpf, setCnpjCpf] = useState<string>(company.cnpjCpf || '');
  const [phone, setPhone] = useState<string>(company.phone || '');
  const [whatsapp, setWhatsapp] = useState<string>(company.whatsapp || '');
  const [email, setEmail] = useState<string>(company.email || '');
  const [street, setStreet] = useState<string>(company.address.street || '');
  const [number, setNumber] = useState<string>(company.address.number || '');
  const [complement, setComplement] = useState<string>(company.address.complement || '');
  const [neighborhood, setNeighborhood] = useState<string>(company.address.neighborhood || '');
  const [city, setCity] = useState<string>(company.address.city || '');
  const [state, setState] = useState<string>(company.address.state || 'SP');
  const [zipCode, setZipCode] = useState<string>(company.address.zipCode || '');
  const [pixKey, setPixKey] = useState<string>(company.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState<CompanyProfile['pixKeyType']>(company.pixKeyType || 'CNPJ');
  const [representativeName, setRepresentativeName] = useState<string>(company.representativeName || '');
  const [representativeRole, setRepresentativeRole] = useState<string>(company.representativeRole || '');
  const [defaultLateFeePerDay, setDefaultLateFeePerDay] = useState<number>(company.defaultLateFeePerDay || 25);
  const [defaultLateFeePercent, setDefaultLateFeePercent] = useState<number>(company.defaultLateFeePercent || 2);
  const [customClauses, setCustomClauses] = useState<string[]>(company.customClauses || []);
  const [newClauseText, setNewClauseText] = useState<string>('');

  // Password Security Settings
  const [currentAppPassword, setCurrentAppPassword] = useState<string>(() => getAppPassword());
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) {
      setPasswordError('Digite a nova senha desejada.');
      return;
    }
    if (newPasswordInput.trim().length < 3) {
      setPasswordError('A senha deve ter no mínimo 3 caracteres.');
      return;
    }

    saveAppPassword(newPasswordInput.trim());
    setCurrentAppPassword(newPasswordInput.trim());
    setNewPasswordInput('');
    setPasswordError(null);
    setPasswordChangeSuccess('Senha alterada com sucesso!');
    setTimeout(() => setPasswordChangeSuccess(null), 4000);
  };

  const handleResetPasswordToDefault = () => {
    if (window.confirm(`Deseja restaurar a senha de acesso para o padrão "${DEFAULT_PASSWORD}"?`)) {
      resetAppPasswordToDefault();
      setCurrentAppPassword(DEFAULT_PASSWORD);
      setNewPasswordInput('');
      setPasswordError(null);
      setPasswordChangeSuccess(`Senha restaurada para "${DEFAULT_PASSWORD}"!`);
      setTimeout(() => setPasswordChangeSuccess(null), 4000);
    }
  };

  const handleAddClause = () => {
    if (!newClauseText.trim()) return;
    setCustomClauses([...customClauses, newClauseText.trim()]);
    setNewClauseText('');
  };

  const handleRemoveClause = (index: number) => {
    setCustomClauses(customClauses.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: CompanyProfile = {
      tradeName,
      legalName,
      cnpjCpf,
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
      pixKey,
      pixKeyType,
      representativeName,
      representativeRole,
      defaultLateFeePerDay,
      defaultLateFeePercent,
      customClauses,
    };

    onSaveCompany(updatedProfile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonStr = exportAllDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_locaferramentas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importAllDataJson(content);
        if (success) {
          alert('Dados restaurados com sucesso a partir do backup!');
          onReloadData();
        } else {
          alert('Erro ao importar arquivo. Verifique se o formato JSON é válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração iniciais? Suas alterações locais serão redefinidas.')) {
      resetAllDataToDemo();
      onReloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="glass-panel p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            Dados da Empresa Emissora (Locadora)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure as informações da sua empresa, chave PIX, multas padrão e cláusulas que constarão em todos os contratos de locação.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-500/10">
            <Check className="w-4 h-4" />
            Dados salvos com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: DADOS CADASTRAIS DA LOCADORA */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
            <span>Identificação da Empresa</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Nome Fantasia *</label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                placeholder="Ex: LocaFácil Ferramentas & Máquinas"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-xs focus:ring-1 focus:ring-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Razão Social Completa *</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Ex: LocaFácil Locação de Equipamentos LTDA"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-xs focus:ring-1 focus:ring-amber-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">CNPJ ou CPF da Empresa *</label>
              <input
                type="text"
                value={cnpjCpf}
                onChange={(e) => setCnpjCpf(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full px-3 py-2 glass-input rounded-xl font-mono text-xs focus:ring-1 focus:ring-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">WhatsApp de Atendimento *</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 glass-input rounded-xl font-mono text-xs focus:ring-1 focus:ring-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@minhalocadora.com.br"
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Nome do Responsável / Assinante</label>
              <input
                type="text"
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Mendes"
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Cargo do Responsável</label>
              <input
                type="text"
                value={representativeRole}
                onChange={(e) => setRepresentativeRole(e.target.value)}
                placeholder="Ex: Gerente Operacional / Sócio Administrador"
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ENDEREÇO DA LOCADORA */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/10 pb-3">
            Endereço da Sede da Empresa
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-300 mb-1">Rua / Avenida *</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Av. das Indústrias"
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
                placeholder="1420"
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Complemento</label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Galpão 03"
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Bairro *</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Distrito Industrial"
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
              <label className="block font-bold text-slate-300 mb-1">Estado (UF) *</label>
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

          <div className="text-xs">
            <label className="block font-bold text-slate-300 mb-1">CEP</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="04500-000"
              className="w-48 px-3 py-2 glass-input rounded-xl text-xs font-mono"
            />
          </div>
        </div>

        {/* SECTION 3: PIX E MULTAS PADRÃO */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/10 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Dados de Recebimento PIX & Multas Padrão</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Chave PIX da Empresa</label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: 38.452.890/0001-44 ou (11) 98765-4321"
                className="w-full px-3 py-2 glass-input rounded-xl font-mono text-xs focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Tipo da Chave PIX</label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as any)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-amber-400"
              >
                <option value="CNPJ" className="bg-slate-900 text-slate-100">CNPJ</option>
                <option value="CPF" className="bg-slate-900 text-slate-100">CPF</option>
                <option value="Telefone" className="bg-slate-900 text-slate-100">Telefone / Celular</option>
                <option value="E-mail" className="bg-slate-900 text-slate-100">E-mail</option>
                <option value="Aleatória" className="bg-slate-900 text-slate-100">Chave Aleatória (EVP)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-3.5 glass-panel-subtle rounded-xl border border-rose-500/30">
              <label className="block font-bold text-rose-300 uppercase mb-1">
                ⚠️ Multa Padrão por Dia de Atraso (R$/dia)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={defaultLateFeePerDay}
                onChange={(e) => setDefaultLateFeePerDay(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 glass-input rounded-xl font-bold text-rose-300 text-xs"
              />
              <p className="text-[10px] text-rose-400 mt-1">
                Sugestão pré-preenchida automaticamente ao abrir novos contratos.
              </p>
            </div>

            <div className="p-3.5 glass-panel-subtle rounded-xl border border-amber-500/30">
              <label className="block font-bold text-amber-300 uppercase mb-1">
                Multa Percentual de Mora (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={defaultLateFeePercent}
                onChange={(e) => setDefaultLateFeePercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 glass-input rounded-xl font-bold text-amber-300 text-xs"
              />
              <p className="text-[10px] text-amber-400 mt-1">
                Juros / taxa percentual em caso de atraso na devolução.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: CLÁUSULAS CONTRATUAIS PERSONALIZADAS */}
        <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Cláusulas e Termos Padrão do Contrato</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{customClauses.length} cláusula(s)</span>
          </div>

          <p className="text-xs text-slate-400">
            Estas cláusulas serão impressas automaticamente em todos os contratos de locação gerados.
          </p>

          <div className="space-y-2">
            {customClauses.map((clause, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3.5 glass-panel-subtle rounded-xl border border-white/10 text-xs text-slate-200">
                <span className="font-bold text-amber-400 shrink-0">{idx + 1}.</span>
                <p className="flex-1 text-justify leading-relaxed">{clause}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveClause(idx)}
                  className="text-slate-400 hover:text-rose-400 p-1 shrink-0 transition-colors"
                  title="Remover cláusula"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new clause */}
          <div className="pt-2 flex gap-2">
            <input
              type="text"
              value={newClauseText}
              onChange={(e) => setNewClauseText(e.target.value)}
              placeholder="Digite uma nova cláusula ou condição para adicionar..."
              className="flex-1 px-3 py-2 glass-input rounded-xl text-xs"
            />
            <button
              type="button"
              onClick={handleAddClause}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Cláusula</span>
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Informações da Empresa</span>
          </button>
        </div>
      </form>

      {/* SECTION 5: SEGURANÇA E SENHA DE ACESSO */}
      <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wide">
              Segurança & Senha de Acesso ao Sistema
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          A tela inicial de senha protege o sistema contra acessos não autorizados. Você pode alterar a senha de acesso a qualquer momento ou restaurar as configurações padrão.
        </p>

        {passwordChangeSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{passwordChangeSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha Atual do Sistema
            </label>
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-slate-200">
              <span>{showPasswordText ? currentAppPassword : '••••••••'}</span>
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="text-slate-400 hover:text-white transition-colors"
                title={showPasswordText ? 'Ocultar' : 'Exibir'}
              >
                {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nova Senha de Acesso
            </label>
            <div className="relative">
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => {
                  setNewPasswordInput(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Ex: novaSenha123"
                className="w-full pl-3 pr-3 py-2 glass-input rounded-xl text-xs font-medium text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-98 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Salvar Senha</span>
            </button>

            <button
              type="button"
              onClick={handleResetPasswordToDefault}
              className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-98"
              title="Restaurar senha padrão (a1b2c3)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 6: BACKUP & RESTAURAÇÃO DE DADOS */}
      <div className="glass-panel rounded-2xl p-5 space-y-4 shadow-2xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/10 pb-3">
          Backup, Exportação & Restauração de Dados
        </h2>

        <p className="text-xs text-slate-400">
          Você pode salvar uma cópia completa dos seus dados (ferramentas, locatários, contratos e configurações) no seu computador e restaurar quando desejar.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-white/10 shadow-md active:scale-98">
            <Upload className="w-4 h-4" />
            <span>Importar Backup (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleResetDemo}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all ml-auto active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Demonstração Inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
