
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Plus, 
  Sun, 
  Moon, 
  Briefcase, 
  User, 
  ChevronDown, 
  LayoutDashboard, 
  CalendarDays, 
  List, 
  Building2, 
  TrendingUp, 
  BarChart3, 
  FolderKanban,
  LogOut,
  UserCircle2
} from 'lucide-react';
import { AccountType, AppSettings } from '../types';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  accountType: AccountType;
  setAccountType: (type: AccountType) => void;
  onNewTransaction: () => void;
  settings: AppSettings;
  onLogout?: () => void;
  userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onNavigate, 
  isDarkMode, 
  toggleTheme, 
  accountType, 
  setAccountType, 
  onNewTransaction, 
  settings,
  onLogout,
  userEmail
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSwitchAccount = (type: AccountType) => {
    setAccountType(type);
    setIsProfileOpen(false);
    setIsUserMenuOpen(false);
    onNavigate('dashboard'); // Redirect to dashboard on switch
  };
  
  // Specific Order: Visão Geral, Fluxo de Caixa, Projetos, Transações, Custos, Calendário, Relatórios
  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    ...(accountType === 'business' ? [
      { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
      { id: 'projects', label: 'Projetos', icon: FolderKanban },
    ] : []),
    { id: 'transactions', label: 'Transações', icon: List },
    ...(accountType === 'business' ? [
      { id: 'business_settings', label: 'Custos Fixos', icon: Building2 }
    ] : []),
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  const currentName = accountType === 'business' ? settings.business.name : settings.personal.name;

  return (
    <header className="sticky top-0 z-50 px-2 md:px-4 py-3 transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/40 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex flex-wrap xl:flex-nowrap items-center justify-between min-h-[72px] px-2 pl-4 py-2">
        
        {/* Left: Brand & Account */}
        <div className="flex items-center gap-6">
          <div className="relative z-50" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-xl transition-all border border-transparent ${isProfileOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform ${accountType === 'business' ? 'bg-gradient-to-br from-indigo-600 to-violet-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                {accountType === 'business' ? <Briefcase className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-sm text-slate-800 dark:text-white leading-tight max-w-[120px] truncate">
                  {currentName}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  {accountType === 'business' ? 'Corporativo' : 'Pessoal'} <ChevronDown size={10} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </span>
              </div>
            </button>
            
            {/* Account Switch Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 p-2">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alternar Perfil</span>
                </div>
                
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => handleSwitchAccount('personal')}
                    className={`w-full p-3 flex items-center gap-4 rounded-xl transition-all group/item ${accountType === 'personal' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
                  >
                    <div className={`p-2.5 rounded-xl text-white shadow-md transition-all ${accountType === 'personal' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700 group-hover/item:bg-blue-400'}`}>
                      <User size={18} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${accountType === 'personal' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>Pessoal</p>
                      <p className="text-xs text-slate-500">Gestão doméstica</p>
                    </div>
                    {accountType === 'personal' && <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>}
                  </button>

                  <button 
                    onClick={() => handleSwitchAccount('business')}
                    className={`w-full p-3 flex items-center gap-4 rounded-xl transition-all group/item ${accountType === 'business' ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
                  >
                     <div className={`p-2.5 rounded-xl text-white shadow-md transition-all ${accountType === 'business' ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700 group-hover/item:bg-violet-500'}`}>
                      <Briefcase size={18} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${accountType === 'business' ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>Empresarial</p>
                      <p className="text-xs text-slate-500">Gestão completa</p>
                    </div>
                    {accountType === 'business' && <div className="ml-auto w-2 h-2 rounded-full bg-violet-600"></div>}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>
        </div>

        {/* Navigation - Scrollable on Mobile */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full xl:w-auto order-3 xl:order-none mt-2 xl:mt-0 pb-1 xl:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative group whitespace-nowrap ${
                  isActive 
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                {item.label}
                {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>}
              </button>
            )
          })}
        </nav>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-2 pr-2 ml-auto xl:ml-0">
          <button 
            onClick={onNewTransaction}
            className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-[1.02] active:scale-95 mr-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>

          <button 
            onClick={toggleTheme}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => onNavigate('settings')}
            className={`p-2.5 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${activeView === 'settings' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
               onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
               className={`p-1.5 rounded-xl border transition-all ${isUserMenuOpen ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                    <UserCircle2 size={20} />
                </div>
            </button>

            {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 p-2">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Conta Atual</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{userEmail}</p>
                    </div>

                    <button 
                        onClick={() => handleSwitchAccount(accountType === 'business' ? 'personal' : 'business')}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                    >
                        {accountType === 'business' ? <User size={16} /> : <Briefcase size={16} />}
                        Ir para {accountType === 'business' ? 'Perfil Pessoal' : 'Perfil Empresarial'}
                    </button>

                    <button 
                        onClick={() => {
                            if(onLogout) onLogout();
                            setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-2 mt-1"
                    >
                        <LogOut size={16} />
                        Sair da Conta
                    </button>
                </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
