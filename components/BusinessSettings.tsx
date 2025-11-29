import React, { useState } from 'react';
import { 
  Trash2, Plus, Building2, CheckCircle2, DollarSign, Clock, TrendingDown, Target, Edit3
} from 'lucide-react';
import { FixedCostTemplate, Transaction } from '../types';

interface BusinessSettingsProps {
  fixedCosts: FixedCostTemplate[];
  onAddCost: (cost: FixedCostTemplate) => Promise<void>;
  onRemoveCost: (id: string) => Promise<void>;
  onGenerateTransaction: (tx: Omit<Transaction, 'id' | 'accountId' | 'workspaceId'>) => void;
  transactions: Transaction[]; 
  isVisible: boolean;
  canEdit: boolean;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({ 
  fixedCosts, 
  onAddCost, 
  onRemoveCost, 
  onGenerateTransaction, 
  transactions, 
  isVisible,
  canEdit
}) => {
  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');
  const [newCostDay, setNewCostDay] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Editing state
  const [activeCostId, setActiveCostId] = useState<string | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCostTemplate = async () => {
    if (!newCostName || !newCostAmount || !canEdit) return;
    setIsAdding(true);
    try {
      const newCost: FixedCostTemplate = {
        id: 'temp', // API will assign ID
        name: newCostName,
        defaultAmount: parseFloat(newCostAmount),
        dayOfMonth: parseInt(newCostDay) || 1,
        isTax: false
      };
      
      await onAddCost(newCost);
      
      setNewCostName('');
      setNewCostAmount('');
      setNewCostDay('');
    } catch (error) {
      console.error("Failed to add cost", error);
    } finally {
      setIsAdding(false);
    }
  };

  const removeCostTemplate = async (id: string) => {
    if(!canEdit) return;
    await onRemoveCost(id);
  };

  const findThisMonthTransaction = (costName: string) => {
    const now = new Date();
    return transactions.find(t => 
      t.category === 'Custos Fixos' && 
      t.description.startsWith(costName) && 
      t.date.getMonth() === now.getMonth() && 
      t.date.getFullYear() === now.getFullYear() &&
      t.type === 'expense'
    );
  };

  const initAction = (cost: FixedCostTemplate) => {
    if(!canEdit) return;
    const existingTx = findThisMonthTransaction(cost.name);
    setActiveCostId(cost.id);
    setTransactionAmount(existingTx ? existingTx.amount.toString() : cost.defaultAmount.toString());
  }

  const confirmAction = (cost: FixedCostTemplate) => {
    if(!canEdit) return;
    const now = new Date();
    const finalAmount = parseFloat(transactionAmount);
    
    onGenerateTransaction({
      type: 'expense',
      amount: finalAmount,
      description: `${cost.name} - ${now.toLocaleDateString('pt-BR', {month: 'long'})}`,
      date: now, 
      category: 'Custos Fixos',
      tags: ['recorrente'],
      source: 'Conta PJ'
    });

    setSuccessMsg(`Registro de "${cost.name}" atualizado!`);
    setTimeout(() => setSuccessMsg(null), 3000);
    setActiveCostId(null);
  };

  const getNextDueDate = (day: number) => {
      const now = new Date();
      if (now.getDate() > day) return `Próx. mês (Dia ${day})`;
      return `Dia ${day}`;
  };

  const totalEstimated = fixedCosts.reduce((acc, curr) => acc + curr.defaultAmount, 0);
  
  const now = new Date();
  const paidFixedCosts = transactions
      .filter(t => 
          t.category === 'Custos Fixos' && 
          t.type === 'expense' && 
          t.date.getMonth() === now.getMonth() && 
          t.date.getFullYear() === now.getFullYear()
      )
      .reduce((acc, t) => acc + t.amount, 0);

  const pendingAmount = Math.max(0, totalEstimated - paidFixedCosts);
  const percentPaid = totalEstimated > 0 ? (paidFixedCosts / totalEstimated) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Fiscal e Custos Fixos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Controle de obrigações mensais recorrentes (Ex: Aluguel, Pro Labore, Sistemas).</p>
      </div>

      {successMsg && (
        <div className="bg-green-100 dark:bg-emerald-500/20 text-green-700 dark:text-emerald-300 border border-green-200 dark:border-emerald-500/30 p-4 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top-2 backdrop-blur-md">
          <CheckCircle2 size={20} />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/10 transition-all hover:scale-[1.02]">
             <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">
                 <Building2 size={16} /> Previsto (Mês)
             </div>
             <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                 {isVisible ? `R$ ${totalEstimated.toLocaleString()}` : '••••'}
             </div>
         </div>
         <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/10 transition-all hover:scale-[1.02]">
             <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                 <CheckCircle2 size={16} /> Pago (Mês)
             </div>
             <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                 {isVisible ? `R$ ${paidFixedCosts.toLocaleString()}` : '••••'}
             </div>
         </div>
         <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/10 transition-all hover:scale-[1.02]">
             <div className="flex items-center gap-2 mb-3 text-amber-500 font-bold text-xs uppercase tracking-wider">
                 <TrendingDown size={16} /> Restante
             </div>
             <div className="text-3xl font-black text-amber-500 tracking-tight">
                 {isVisible ? `R$ ${pendingAmount.toLocaleString()}` : '••••'}
             </div>
         </div>
      </div>

      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-8 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/10 flex flex-col">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-white/10 gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-white/10 rounded-2xl text-slate-600 dark:text-white">
                  <Target size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white">Gerenciar Obrigações</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                        <div className="w-48 h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" style={{width: `${Math.min(percentPaid, 100)}%`}}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{percentPaid.toFixed(0)}% pago</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 mb-8">
            {fixedCosts.map(cost => {
              const existingTx = findThisMonthTransaction(cost.name);
              const isPaid = !!existingTx;
              const isEditing = activeCostId === cost.id;

              return (
                <div key={cost.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 gap-4 group ${isPaid ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-slate-50/50 dark:bg-white/5 border-transparent dark:border-white/5 hover:border-slate-200 dark:hover:border-white/20'}`}>
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col min-w-[80px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vencimento</span>
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold mt-0.5">
                            <Clock size={14} className="text-slate-400" /> {getNextDueDate(cost.dayOfMonth)}
                        </div>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
                    <div>
                      <p className={`font-bold text-lg ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-white'}`}>{cost.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Valor Base: {isVisible ? `R$ ${cost.defaultAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '••••'}</p>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-3 self-end sm:self-center">
                        {isEditing ? (
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-white/20 shadow-xl animate-in fade-in zoom-in ring-2 ring-blue-500/20">
                                <span className="pl-3 text-xs font-bold text-slate-400">R$</span>
                                <input 
                                    type="number" 
                                    value={transactionAmount}
                                    onChange={(e) => setTransactionAmount(e.target.value)}
                                    className="w-28 bg-transparent text-sm font-bold focus:outline-none text-slate-800 dark:text-white"
                                    autoFocus
                                />
                                <button onClick={() => confirmAction(cost)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                    <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => setActiveCostId(null)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            isPaid ? (
                                <button 
                                    onClick={() => initAction(cost)}
                                    className="px-4 py-2.5 bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-all group"
                                    title="Editar pagamento"
                                >
                                    <CheckCircle2 size={16} /> 
                                    Pago 
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-emerald-200 dark:bg-emerald-900 px-1.5 rounded text-[10px]">Editar</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={() => initAction(cost)}
                                    className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 dark:shadow-white/10"
                                >
                                    <DollarSign size={14} /> Pagar Agora
                                </button>
                            )
                        )}
                        
                        <button onClick={() => removeCostTemplate(cost.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
                        <Trash2 size={18} />
                        </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {canEdit && (
            <div className="pt-8 border-t border-slate-100 dark:border-white/10">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Adicionar Novo Custo</p>
                <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    placeholder="Nome (ex: Pro Labore)" 
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="flex-[2] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-slate-400"
                />
                <input 
                    placeholder="Valor (R$)" 
                    type="number"
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-slate-400"
                />
                <input 
                    placeholder="Dia" 
                    type="number"
                    max={31}
                    min={1}
                    value={newCostDay}
                    onChange={(e) => setNewCostDay(e.target.value)}
                    className="w-24 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-slate-400"
                />
                <button 
                    onClick={handleAddCostTemplate}
                    disabled={isAdding}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                    {isAdding ? '...' : <><Plus size={18} className="mr-2" /> Adicionar</>}
                </button>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default BusinessSettings;