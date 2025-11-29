
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BalanceCard from './components/BalanceCard';
import OverviewCharts from './components/OverviewCharts';
import TransactionList from './components/TransactionList';
import TransactionModal from './components/TransactionModal';
import BusinessSettings from './components/BusinessSettings';
import CalendarView from './components/CalendarView';
import TransactionsView from './components/TransactionsView';
import SettingsView from './components/SettingsView';
import CashFlowView from './components/CashFlowView';
import ReportsView from './components/ReportsView';
import ProjectsView from './components/ProjectsView';
import AuthPage from './components/AuthPage';
import ConfirmationModal from './components/ConfirmationModal';
import { Eye, EyeOff, Wallet, CheckCircle, LogOut, Loader2, AlertTriangle, RefreshCw, FolderPlus } from 'lucide-react';
import { Transaction, AccountType, BusinessConfig, AppSettings, Project, Client, FixedCostTemplate, Category, Tag } from './types';
import { useAuth } from './contexts/AuthContext';
import { transactionService, clientService, projectService, categoryService, tagService, fixedCostService, seedDatabase } from './services/api';

const defaultSettings: AppSettings = {
    personal: {
        name: 'Minha Conta',
        categories: [],
        tags: [],
        cashFlow: { allocations: { workingCapital: 0, operationalReserve: 0 }, workingCapitalPercent: 50 }
    },
    business: {
        name: 'Minha Empresa',
        categories: [],
        tags: [],
        cashFlow: { allocations: { workingCapital: 0, operationalReserve: 0 }, workingCapitalPercent: 50 }
    }
};

const App: React.FC = () => {
  const { session, loading, signOut, user } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- STATE MANAGEMENT ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<(Category & { scope: string })[]>([]);
  const [tags, setTags] = useState<(Tag & { scope: string })[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultSettings);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>({ fixedCostTemplates: [] });
  const [fixedCosts, setFixedCosts] = useState<FixedCostTemplate[]>([]);
  
  // --- UI STATE ---
  const [valuesVisible, setValuesVisible] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalMode, setModalMode] = useState<'default' | 'cash'>('default');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  
  // Unified Delete Confirmation State
  const [pendingDelete, setPendingDelete] = useState<{ id: string, type: 'transaction' | 'project' | 'client' | 'cost' } | null>(null);

  // --- DATA LOADING ---
  const loadAllData = useCallback(async () => {
    if (!user) return;
    setBackgroundSyncing(true);
    setLoadError(null);
    try {
      await seedDatabase(user.id);

      const [
        catsRes, tagsRes, txsRes, clientsRes, projectsRes, costsRes
      ] = await Promise.allSettled([
        categoryService.fetchAll(user.id),
        tagService.fetchAll(user.id),
        transactionService.fetchAll(user.id),
        clientService.fetchAll(user.id),
        projectService.fetchAll(user.id),
        fixedCostService.fetchAll(user.id)
      ]);

      const extract = <T,>(res: PromiseSettledResult<T>, fallback: T): T => 
        res.status === 'fulfilled' ? res.value : fallback;

      setCategories(extract(catsRes, []));
      setTags(extract(tagsRes, []));
      setTransactions(extract(txsRes, []));
      setClients(extract(clientsRes, []));
      setProjects(extract(projectsRes, []));
      const costs = extract(costsRes, []);
      setFixedCosts(costs);
      setBusinessConfig({ fixedCostTemplates: costs });

    } catch (error) {
      console.error("Critical Load Error:", error);
      setLoadError("Falha ao sincronizar. Tentando novamente...");
    } finally {
      setBackgroundSyncing(false);
      setInitialLoad(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !loading) loadAllData();
  }, [user, loading, loadAllData]);

  useEffect(() => {
    if (!user) return;
    setAppSettings(prev => ({
      personal: {
        ...prev.personal,
        name: user.user_metadata?.full_name || 'Pessoal',
        categories: categories.filter(c => c.scope === 'personal'),
        tags: tags.filter(t => t.scope === 'personal'),
      },
      business: {
        ...prev.business,
        name: 'Empresa',
        categories: categories.filter(c => c.scope === 'business'),
        tags: tags.filter(t => t.scope === 'business'),
      }
    }));
  }, [categories, tags, user]);

  const safeExecute = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBackgroundSyncing(true);
    try {
      return await fn();
    } catch (err: any) {
      console.error(err);
      return undefined;
    } finally {
      setBackgroundSyncing(false);
    }
  };

  // --- SYNC LOGIC: Transaction <-> Project ---

  const handleSaveTransaction = (txData: any, id?: string) => safeExecute(async () => {
    if (!user) return;
    const payload = { ...txData, date: new Date(txData.date), accountId: accountType };
    
    let savedTx: Transaction;

    if (id) {
      // --- UPDATE TRANSACTION ---
      savedTx = await transactionService.update(id, payload);
      setTransactions(prev => prev.map(t => t.id === id ? savedTx : t));

      // SYNC REVERSE: If Transaction is linked to a Project, update Project
      if (savedTx.projectId) {
          const linkedProject = projects.find(p => p.id === savedTx.projectId);
          if (linkedProject) {
              // Extract pure name if formatted
              let newName = savedTx.description;
              if (newName.startsWith('Projeto: ')) newName = newName.replace('Projeto: ', '');

              // Check if actual values changed to avoid loop
              const amountChanged = Math.abs(linkedProject.value - savedTx.amount) > 0.01;
              const dateChanged = linkedProject.startDate.getTime() !== savedTx.date.getTime();
              const nameChanged = linkedProject.name !== newName;

              if (amountChanged || dateChanged || nameChanged) {
                  const updatedProj = await projectService.update(linkedProject.id, {
                      value: savedTx.amount,
                      startDate: savedTx.date,
                      name: newName
                  });
                  setProjects(prev => prev.map(p => p.id === linkedProject.id ? updatedProj : p));
              }
          }
      }
    } else {
      // --- CREATE TRANSACTION ---
      savedTx = await transactionService.create(user.id, payload);
      setTransactions(prev => [...prev, savedTx]);
    }
    
    setIsTransactionModalOpen(false);
  });

  const handleCreateProject = (projectData: any) => safeExecute(async () => {
    if(!user) return undefined;
    
    // 1. Create Project
    const createdProject = await projectService.create(user.id, projectData);
    setProjects(prev => [...prev, createdProject]);

    // 2. Automatically Create Linked Transaction
    const clientName = clients.find(c => c.id === projectData.clientId)?.name || 'Cliente';
    const txPayload = {
        description: `Projeto: ${createdProject.name}`,
        amount: Number(createdProject.value),
        date: new Date(createdProject.startDate),
        type: 'income' as const,
        category: 'Projetos',
        accountId: 'business' as AccountType,
        tags: ['projeto'],
        projectId: createdProject.id, // IMPORTANT: Link IDs
        source: clientName
    };

    const createdTx = await transactionService.create(user.id, txPayload);
    setTransactions(prev => [...prev, createdTx]);

    return createdProject;
  });

  const handleUpdateProject = (id: string, projectData: any) => safeExecute(async () => {
    if(!user) return;
    
    // 1. Update the Project
    const updatedProject = await projectService.update(id, projectData);
    setProjects(prev => prev.map(proj => proj.id === id ? updatedProject : proj));

    // 2. Find Linked Transaction (Locally OR via API to be safe)
    let linkedTx = transactions.find(t => t.projectId === id);
    
    // If not found locally, try to fetch it to ensure we don't duplicate or fail
    if (!linkedTx) {
       const found = await transactionService.fetchByProjectId(id);
       if (found) linkedTx = found;
    }
    
    if (linkedTx) {
      // 3. Update the existing transaction
      const newDescription = `Projeto: ${updatedProject.name}`;
      const newAmount = Number(updatedProject.value);
      const newDate = new Date(updatedProject.startDate);

      const updatedTx = await transactionService.update(linkedTx.id, {
        description: newDescription,
        amount: newAmount,
        date: newDate
      });
      
      // Update local state (whether it was there before or we just fetched it)
      setTransactions(prev => {
        const exists = prev.some(t => t.id === updatedTx.id);
        if (exists) {
           return prev.map(t => t.id === updatedTx.id ? updatedTx : t);
        } else {
           return [...prev, updatedTx];
        }
      });
    } else {
        // 4. Healing: If for some reason it doesn't exist at all, recreate it.
        // This handles cases where user might have deleted the transaction manually but kept the project.
        const clientName = clients.find(c => c.id === updatedProject.clientId)?.name || 'Cliente';
        const txPayload = {
            description: `Projeto: ${updatedProject.name}`,
            amount: Number(updatedProject.value),
            date: new Date(updatedProject.startDate),
            type: 'income' as const,
            category: 'Projetos',
            accountId: 'business' as AccountType,
            tags: ['projeto', 'restaurado'],
            projectId: updatedProject.id,
            source: clientName
        };
        const restoredTx = await transactionService.create(user.id, txPayload);
        setTransactions(prev => [...prev, restoredTx]);
    }
  });

  const handleCreateClient = (c: any) => safeExecute(async () => {
    if(!user) return;
    const created = await clientService.create(user.id, c);
    setClients(prev => [...prev, created]);
  });

  const handleUpdateClient = (id: string, c: any) => safeExecute(async () => {
    if(!user) return;
    const updated = await clientService.update(id, c);
    setClients(prev => prev.map(cli => cli.id === id ? updated : cli));
  });

  const handleAddCategory = (name: string) => safeExecute(async () => {
    if(!user) return;
    const newCat = await categoryService.create(user.id, { id: '', name, type: 'both' }, accountType);
    setCategories(prev => [...prev, newCat]);
  });

  const handleRemoveCategory = (id: string) => safeExecute(async () => {
    await categoryService.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  });

  const handleAddTag = (label: string) => safeExecute(async () => {
    if(!user) return;
    const newTag = await tagService.create(user.id, { id: '', label, color: 'blue' }, accountType);
    setTags(prev => [...prev, newTag]);
  });

  const handleRemoveTag = (id: string) => safeExecute(async () => {
    await tagService.delete(id);
    setTags(prev => prev.filter(t => t.id !== id));
  });

  const handleAddFixedCost = (cost: FixedCostTemplate) => safeExecute(async () => {
    if(!user) return;
    const created = await fixedCostService.create(user.id, cost);
    setFixedCosts(prev => [...prev, created]);
  });

  const requestDelete = (id: string, type: 'transaction' | 'project' | 'client' | 'cost') => {
      // If deleting a transaction that is a project, confirm project deletion instead
      if (type === 'transaction') {
          const tx = transactions.find(t => t.id === id);
          if (tx && tx.projectId) {
              setPendingDelete({ id: tx.projectId, type: 'project' });
              return;
          }
      }
      setPendingDelete({ id, type });
  };

  const executeDelete = async () => {
    if (!user || !pendingDelete) return;
    const { id, type } = pendingDelete;
    setBackgroundSyncing(true);

    try {
        if (type === 'transaction') {
            await transactionService.delete(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
        } 
        else if (type === 'project') {
            // Delete Project
            await projectService.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
            
            // Try to delete linked transaction if it exists
            const linkedTx = transactions.find(t => t.projectId === id);
            
            // Even if not in local state, try to fetch and delete by project ID to be clean
            try {
               // We don't have a direct deleteByProjectId, but we can try to find and delete
               let txToDeleteId = linkedTx?.id;
               if (!txToDeleteId) {
                   const fetched = await transactionService.fetchByProjectId(id);
                   if (fetched) txToDeleteId = fetched.id;
               }
               
               if (txToDeleteId) {
                   await transactionService.delete(txToDeleteId);
                   setTransactions(prev => prev.filter(t => t.id !== txToDeleteId));
               }
            } catch (e) {
                console.log('Linked transaction cleanup handled or already done.');
            }
        } 
        else if (type === 'client') {
            await clientService.delete(id);
            setClients(prev => prev.filter(c => c.id !== id));
        }
        else if (type === 'cost') {
            await fixedCostService.delete(id);
            setFixedCosts(prev => prev.filter(c => c.id !== id));
        }
    } catch (error) {
        console.error("Erro fatal ao apagar:", error);
        alert("Erro: O item não pôde ser apagado. Os dados serão recarregados.");
        await loadAllData(); 
    } finally {
        setPendingDelete(null);
        setIsTransactionModalOpen(false);
        setBackgroundSyncing(false);
    }
  };

  // Full Screen Loader only for initial auth check and first data load
  if (loading || (initialLoad && user)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
            <p className="text-slate-400 font-medium animate-pulse">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  const currentSettingsScope = accountType === 'business' ? appSettings.business : appSettings.personal;
  
  const getFilteredTransactions = () => {
    const accountTxs = transactions.filter(t => t.accountId === accountType);
    if (['transactions', 'settings', 'business_settings', 'cashflow', 'reports', 'projects'].includes(currentView)) return accountTxs;
    
    const now = new Date();
    return accountTxs.filter(t => {
      if (timeFilter === 'year') return t.date.getFullYear() === now.getFullYear();
      if (timeFilter === 'month') return t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear();
      
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      return t.date >= start && t.date <= end;
    });
  };

  const filteredTransactions = getFilteredTransactions();
  const periodBalance = filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : t.type === 'expense' ? acc - t.amount : acc, 0);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalCashBalance = transactions.filter(t => t.accountId === accountType).reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  
  const getFilteredProjects = () => {
      const now = new Date();
      return projects.filter(p => {
          const pDate = new Date(p.startDate);
          
          if (timeFilter === 'year') {
              return pDate.getFullYear() === now.getFullYear();
          }
          if (timeFilter === 'month') {
              return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
          }
          const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
          const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
          return pDate >= start && pDate <= end;
      });
  };
  const newProjectsCount = getFilteredProjects().length;
  const projectLabel = timeFilter === 'month' ? 'Neste Mês' : timeFilter === 'year' ? 'Neste Ano' : 'Nesta Semana';

  return (
    <div className={`min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-[#F0F2F5]'}`}>
      
      {isDarkMode && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-black to-black opacity-90"></div>
              <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[150px]"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[150px]"></div>
          </div>
      )}

      <div className="relative z-10">
          <Header 
            activeView={currentView} onNavigate={setCurrentView}
            isDarkMode={isDarkMode} toggleTheme={() => { setIsDarkMode(!isDarkMode); document.documentElement.classList.toggle('dark'); }}
            accountType={accountType} setAccountType={setAccountType}
            onNewTransaction={() => { setModalMode('default'); setEditingTransaction(null); setIsTransactionModalOpen(true); }}
            settings={appSettings}
          />

          <main className="max-w-[1600px] mx-auto px-4 pt-8 pb-20 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {loadError && (
              <div className="bg-amber-100 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-2">
                <AlertTriangle size={20} /> {loadError}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentView === 'dashboard' ? 'Visão Geral' : currentView === 'transactions' ? 'Transações' : currentView === 'projects' ? 'Projetos' : currentView}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">{accountType === 'business' ? 'Perfil Empresarial' : 'Perfil Pessoal'}</p>
              </div>
              <div className="flex gap-3">
                {(currentView === 'dashboard' || currentView === 'calendar') && (
                  <div className="bg-white dark:bg-white/10 dark:backdrop-blur-md rounded-xl p-1 flex border border-slate-200 dark:border-white/10">
                    {['week', 'month', 'year'].map(t => (
                      <button key={t} onClick={() => setTimeFilter(t as any)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === t ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}>
                        {t === 'week' ? 'Semana' : t === 'month' ? 'Mês' : 'Ano'}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setValuesVisible(!valuesVisible)} className="p-3 bg-white dark:bg-white/10 dark:backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/20 transition-colors">
                  {valuesVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button onClick={signOut} className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"><LogOut size={20} /></button>
              </div>
            </div>

            {currentView === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <BalanceCard totalBalance={periodBalance} monthlyIncome={totalIncome} monthlyExpense={totalExpense} isVisible={valuesVisible} label="Saldo do Período" />
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 transition-all hover:scale-[1.01] hover:shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400"><Wallet size={20} /><span className="text-xs font-bold uppercase tracking-wider">Caixa Total</span></div>
                        <div className="text-3xl xl:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{valuesVisible ? `R$ ${totalCashBalance.toLocaleString()}` : '••••'}</div>
                      </div>
                      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 transition-all hover:scale-[1.01] hover:shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400"><CheckCircle size={20} /><span className="text-xs font-bold uppercase tracking-wider">Movimentações</span></div>
                        <div className="text-3xl xl:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{filteredTransactions.length}</div>
                      </div>
                      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-white/10 transition-all hover:scale-[1.01] hover:shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400"><FolderPlus size={20} /><span className="text-xs font-bold uppercase tracking-wider">Novos Projetos</span></div>
                        <div className="text-3xl xl:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{newProjectsCount}</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{projectLabel}</div>
                      </div>
                  </div>
                </div>
                <OverviewCharts transactions={filteredTransactions} isVisible={valuesVisible} />
                <TransactionList transactions={filteredTransactions} isVisible={valuesVisible} />
              </>
            )}

            {currentView === 'projects' && (
              <ProjectsView 
                projects={projects} clients={clients} transactions={transactions}
                onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProject}
                onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient}
                onDeleteProject={(id) => requestDelete(id, 'project')} onDeleteClient={(id) => requestDelete(id, 'client')}
                isVisible={valuesVisible}
              />
            )}

            {currentView === 'transactions' && (
              <TransactionsView transactions={filteredTransactions} isVisible={valuesVisible} onEdit={(tx) => { setEditingTransaction(tx); setIsTransactionModalOpen(true); }} onDelete={(id) => requestDelete(id, 'transaction')} />
            )}

            {currentView === 'business_settings' && (
              <BusinessSettings fixedCosts={fixedCosts} onAddCost={handleAddFixedCost} onRemoveCost={async (id) => requestDelete(id, 'cost')} onGenerateTransaction={(tx) => handleSaveTransaction(tx)} transactions={transactions} isVisible={valuesVisible} />
            )}

            {currentView === 'settings' && (
              <SettingsView settings={appSettings} onUpdateSettings={setAppSettings} onAddCategory={handleAddCategory} onRemoveCategory={handleRemoveCategory} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} currentAccountType={accountType} />
            )}

            {currentView === 'calendar' && <CalendarView transactions={filteredTransactions} isVisible={valuesVisible} timeFilter={timeFilter} />}
            
            {currentView === 'cashflow' && (
                <CashFlowView 
                    settings={appSettings} 
                    onUpdateSettings={setAppSettings} 
                    transactions={transactions} 
                    fixedCosts={fixedCosts}
                    businessConfig={businessConfig} 
                    accountType={accountType} 
                    isVisible={valuesVisible} 
                />
            )}
            
            {currentView === 'reports' && <ReportsView transactions={transactions} isVisible={valuesVisible} accountType={accountType} projects={projects} />}

          </main>
      </div>

      <TransactionModal 
        isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction} onDelete={(id) => requestDelete(id, 'transaction')}
        initialData={editingTransaction} categories={currentSettingsScope.categories} availableTags={currentSettingsScope.tags} mode={modalMode}
      />

      <ConfirmationModal 
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={executeDelete}
        title={pendingDelete?.type === 'project' ? "Apagar Projeto" : pendingDelete?.type === 'transaction' ? "Apagar Transação" : pendingDelete?.type === 'client' ? "Apagar Cliente" : "Apagar Item"}
        message={
            pendingDelete?.type === 'project' ? "Esta ação apagará o projeto e a transação financeira vinculada a ele permanentemente." :
            "Tem certeza que deseja apagar este item permanentemente?"
        }
      />

      {backgroundSyncing && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-full px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in z-50">
           <RefreshCw size={14} className="animate-spin text-blue-600 dark:text-blue-400" />
           <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Sincronizando...</span>
        </div>
      )}
    </div>
  );
};

export default App;