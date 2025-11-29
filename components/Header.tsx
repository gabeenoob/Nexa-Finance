

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  UserCircle2,
  Users,
  Check
} from 'lucide-react';
import { Workspace, AccountType } from '../types';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onChangeWorkspace: (ws: Workspace) => void;
  onCreateWorkspace: (name: string, type: AccountType) => void;
  onManageMembers: () => void;
  onNewTransaction: () => void;
  canEdit: boolean;
  onLogout?: () => void;
  userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onNavigate, 
  isDarkMode, 
  toggleTheme, 
  workspaces,
  currentWorkspace,
  onChangeWorkspace,
  onCreateWorkspace,
  onManageMembers,
  onNewTransaction,
  canEdit,
  onLogout,
  userEmail
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsType, setNewWsType] = useState<AccountType>('business');

  // Animation State for Sliding Indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navItemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsCreatingWs(false);
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

  // Update indicator position when activeView changes
  useEffect(() => {
    const updateIndicator = () => {
        const activeElement = navItemsRef.current.get(activeView);
        if (activeElement && navContainerRef.current) {
            // Calculate position relative to the container
            const containerLeft = navContainerRef.current.getBoundingClientRect().left;
            const itemLeft = activeElement.getBoundingClientRect().left;
            const scrollLeft = navContainerRef.current.scrollLeft;
            
            // Adjust calculation based on whether the container is scrolled or positioned
            const relativeLeft = activeElement.offsetLeft; 

            setIndicatorStyle({
                left: relativeLeft,
                width: activeElement.offsetWidth,
                opacity: 1
            });
        }
    };

    // Small delay to ensure DOM is ready and layout is stable
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateIndicator);
    };
  }, [activeView, currentWorkspace.type]);

  const handleCreateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newWsName) {
          onCreateWorkspace(newWsName, newWsType);
          setIsCreatingWs(false);
          setIsProfileOpen(false);
          setNewWsName('');
      }
  }

  // Navigation Items
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    ...(currentWorkspace.type === 'business' ? [
      { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
      { id: 'projects', label: 'Projetos', icon: FolderKanban },
    ] : []),
    { id: 'transactions', label: 'Transações', icon: List },
    ...(currentWorkspace.type === 'business' ? [
      { id: 'business_settings', label: 'Custos Fixos', icon: Building2 }
    ] : []),
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ], [currentWorkspace.type]);

  return (
    <header className="sticky top-0 z-50 px-2 md:px-4 py-3 transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/40 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 flex flex-wrap xl:flex-nowrap items-center justify-between min-h-[72px] px-2 pl-4 py-2">
        
        {/* Left: Workspace Switcher */}
        <div className="flex items-center gap-6">
          <div className="relative z-50" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-xl transition-all border border-transparent ${isProfileOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform overflow-hidden ${currentWorkspace.type === 'business' && !currentWorkspace.avatarUrl ? 'bg-gradient-to-br from-indigo-600 to-violet-600' : currentWorkspace.type === 'personal' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : ''}`}>
                {currentWorkspace.avatarUrl ? (
                    <img src={currentWorkspace.avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    currentWorkspace.type === 'business' ? <Briefcase className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-sm text-slate-800 dark:text-white leading-tight max-w-[140px] truncate">
                  {currentWorkspace.name}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  {currentWorkspace.role === 'owner' ? 'Dono' : currentWorkspace.role === 'admin' ? 'Admin' : 'Visualizador'} <ChevronDown size={10} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </span>
              </div>
            </button>
            
            {/* Workspace Dropdown */}
            {isProfileOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 p-2">
                
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seus Espaços</span>
                    <button 
                        onClick={() => setIsCreatingWs(!isCreatingWs)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                        {isCreatingWs ? 'Cancelar' : '+ Novo'}
                    </button>
                </div>
                
                {/* Create New Form */}
                {isCreatingWs ? (
                    <form onSubmit={handleCreateSubmit} className="p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50 m-2 rounded-xl">
                        <input 
                            autoFocus
                            placeholder="Nome do Espaço"
                            value={newWsName}
                            onChange={e => setNewWsName(e.target.value)}
                            className="w-full text-sm p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700"
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setNewWsType('personal')} className={`flex-1 text-xs py-1.5 rounded-lg border ${newWsType === 'personal' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-slate-200'}`}>Pessoal</button>
                            <button type="button" onClick={() => setNewWsType('business')} className={`flex-1 text-xs py-1.5 rounded-lg border ${newWsType === 'business' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-slate-200'}`}>Empresa</button>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg">Criar Espaço</button>
                    </form>
                ) : (
                    /* Workspace List */
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {workspaces.map(ws => (
                        <button 
                          key={ws.id}
                          onClick={() => { onChangeWorkspace(ws); setIsProfileOpen(false); }}
                          className={`w-full p-2 flex items-center gap-3 rounded-xl transition-all group/item ${currentWorkspace.id === ws.id ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${ws.type === 'business' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                             {ws.name.substring(0,1).toUpperCase()}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{ws.name}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{ws.type === 'business' ? 'Empresarial' : 'Pessoal'}</p>
                          </div>
                          {currentWorkspace.id === ws.id && <Check size={14} className="text-blue-500" />}
                        </button>
                      ))}
                    </div>
                )}
                
                <div className="border-t border-slate-100 dark:border-slate-800 p-2">
                    <button 
                        onClick={() => { onManageMembers(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Users size={16} /> Gerenciar Membros
                    </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block"></div>
        </div>

        {/* Navigation with Animated Sliding Indicator */}
        <nav className="relative flex items-center gap-1 overflow-x-auto no-scrollbar w-full xl:w-auto order-3 xl:order-none mt-2 xl:mt-0 pb-1 xl:pb-0" ref={navContainerRef}>
          
          {/* Animated Background Pill */}
          <div 
             className="absolute top-1/2 -translate-y-1/2 h-[80%] bg-slate-100 dark:bg-slate-800 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] pointer-events-none"
             style={{ 
                 left: `${indicatorStyle.left}px`, 
                 width: `${indicatorStyle.width}px`,
                 opacity: indicatorStyle.opacity 
             }}
          />

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => { if(el) navItemsRef.current.set(item.id, el); }}
                onClick={() => onNavigate(item.id)}
                className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 whitespace-nowrap ${
                  isActive 
                    ? 'text-slate-900 dark:text-white' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={16} className={`transition-transform duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : ''}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 pr-2 ml-auto xl:ml-0">
          {canEdit && (
            <button 
                onClick={onNewTransaction}
                className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all hover:scale-[1.02] active:scale-95 mr-2"
            >
                <Plus className="w-4 h-4" />
                <span>Novo Registro</span>
            </button>
          )}

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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Logado como</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{userEmail}</p>
                    </div>

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
