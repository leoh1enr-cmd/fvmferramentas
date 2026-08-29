import React from 'react';
import { CompanyProfile } from '../types';
import { 
  Wrench, 
  FileText, 
  FilePlus, 
  Bell, 
  Users, 
  Building2, 
  LayoutDashboard,
  Menu,
  X,
  Lock,
  LogOut
} from 'lucide-react';

export type NavTab = 'dashboard' | 'generator' | 'history' | 'reminders' | 'tools' | 'clients' | 'company';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  company: CompanyProfile;
  alertCount: number;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  company,
  alertCount,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Início / Painel', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'generator', label: 'Nova Locação (Contrato)', icon: <FilePlus className="w-4 h-4" /> },
    { id: 'history', label: 'Histórico de Locações', icon: <FileText className="w-4 h-4" /> },
    { id: 'reminders', label: 'Lembretes & Renovações', icon: <Bell className="w-4 h-4" />, badge: alertCount },
    { id: 'tools', label: 'Ferramentas & Estoque', icon: <Wrench className="w-4 h-4" /> },
    { id: 'clients', label: 'Locatários (Clientes)', icon: <Users className="w-4 h-4" /> },
    { id: 'company', label: 'Minha Empresa / Configs', icon: <Building2 className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="no-print bg-slate-950/70 backdrop-blur-xl text-white border-b border-white/10 sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
                FVM Ferramentas
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded backdrop-blur-xs">
                  PRO
                </span>
              </span>
              <p className="text-[11px] text-amber-300/80 font-medium truncate max-w-[200px] sm:max-w-xs mt-0.5">
                Floresta Verde Madeiras
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1.5">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-slate-950 text-white' : 'bg-rose-500 text-white animate-pulse shadow-sm'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 ml-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl transition-all"
                title="Bloquear Sistema (Tela de Senha)"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </nav>

          {/* Tablet/Compact Actions */}
          <div className="hidden lg:flex xl:hidden items-center space-x-2">
            <button
              onClick={() => handleTabClick('generator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'generator'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              <span>Novo Contrato</span>
            </button>

            <button
              onClick={() => handleTabClick('reminders')}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl transition-colors"
              title="Lembretes e Alertas"
            >
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {alertCount}
                </span>
              )}
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 rounded-xl transition-colors"
                title="Bloquear Sistema"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 px-4 pt-2 pb-4 space-y-1.5">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {onLogout && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all mt-2"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4" />
                <span>Bloquear / Sair do Sistema</span>
              </div>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
