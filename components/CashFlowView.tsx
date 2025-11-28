
import React from 'react';
import { AppSettings, Transaction, AccountType, BusinessConfig, FixedCostTemplate } from '../types';
import { Target, AlertCircle, PieChart, Info, Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CashFlowViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  transactions: Transaction[];
  businessConfig: BusinessConfig; 
  fixedCosts: FixedCostTemplate[]; // Added direct prop for reactivity
  accountType: AccountType;
  isVisible: boolean;
}

const CashFlowView: React.FC<CashFlowViewProps> = ({ settings, transactions, fixedCosts, accountType, isVisible }) => {
  const currentScope = settings.business; 
  
  if (accountType !== 'business') return null;

  // --- Real-time Calculations ---
  
  // 1. Calculate Real Cash Balance (Sum of all business transactions)
  const calculateRealBalance = () => {
      return transactions
        .filter(t => t.accountId === 'business')
        .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  };

  const realTotalBalance = calculateRealBalance();
  
  // 2. Total Fixed Costs (Target Base) - Calculated from passed prop for instant update
  const totalFixedCosts = fixedCosts.reduce((acc, curr) => acc + curr.defaultAmount, 0);
  
  // 3. AUTOMATIC Working Capital Calculation
  const wcPercentage = currentScope.cashFlow.workingCapitalPercent || 50;
  const workingCapital = totalFixedCosts * (wcPercentage / 100);

  // 4. Calculate "Free Cash" (Real Balance - Working Capital)
  const freeCash = realTotalBalance - workingCapital;

  // Percentage for progress bars
  const wcProgress = realTotalBalance > 0 ? Math.min((workingCapital / realTotalBalance) * 100, 100) : 0;
  const freeProgress = realTotalBalance > 0 ? Math.max(0, 100 - wcProgress) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PieChart className="text-blue-600" /> Fluxo de Caixa Inteligente
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Análise automática baseada nos seus Custos Fixos ({wcPercentage}% de alocação).
                </p>
            </div>
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold w-fit ${freeCash >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <Info size={16} />
                {freeCash >= 0 ? 'Saúde Financeira Positiva' : 'Atenção: Caixa Livre Negativo'}
            </div>
        </div>

        {/* Hero Card: Real Balance - MATCHING BALANCECARD DESIGN */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white/10 dark:to-white/5 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-slate-900/20 dark:shadow-black/20 text-white flex flex-col md:flex-row items-center justify-between gap-8 group">
            {/* Decorative Blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 dark:bg-blue-500/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2 md:justify-start justify-center">
                    <Wallet size={16} /> Saldo Real em Conta
                </p>
                <div className="text-5xl md:text-6xl font-black tracking-tight flex items-baseline justify-center md:justify-start gap-1 drop-shadow-sm">
                    {isVisible ? (
                        <>
                            <span className="text-2xl md:text-3xl opacity-50">R$</span>
                            {realTotalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </>
                    ) : '••••••••'}
                </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                 <div className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 flex-1 border border-white/10 dark:border-white/5 min-w-[200px]">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <p className="text-xs font-bold uppercase opacity-80">Capital de Giro</p>
                     </div>
                     <p className="text-2xl font-bold text-amber-300">{isVisible ? `R$ ${workingCapital.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}</p>
                     <p className="text-[10px] opacity-60 mt-1">Reservado para operações</p>
                 </div>
                 
                 <div className="bg-white/10 dark:bg-slate-900/20 backdrop-blur-md rounded-2xl p-5 flex-1 border border-white/10 dark:border-white/5 min-w-[200px]">
                     <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${freeCash >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                        <p className="text-xs font-bold uppercase opacity-80">Caixa Livre</p>
                     </div>
                     <p className={`text-2xl font-bold ${freeCash >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{isVisible ? `R$ ${freeCash.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}</p>
                     <p className="text-[10px] opacity-60 mt-1">Disponível para reinvestir</p>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Visual Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Target className="text-blue-500" size={20}/> Distribuição do Saldo
                </h3>

                <div className="space-y-8">
                    {/* Visual Bar */}
                    <div className="relative h-12 w-full bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden flex shadow-inner">
                        <div 
                            className="h-full bg-amber-400/90 flex items-center justify-center text-[10px] font-bold text-amber-900 transition-all duration-1000"
                            style={{ width: `${wcProgress}%` }}
                        >
                            {wcProgress > 15 && 'GIRO'}
                        </div>
                        <div 
                            className={`h-full flex items-center justify-center text-[10px] font-bold transition-all duration-1000 ${freeCash >= 0 ? 'bg-emerald-500/90 text-emerald-50' : 'bg-red-500/90 text-red-50'}`}
                            style={{ width: `${freeProgress}%` }}
                        >
                            {freeProgress > 15 && 'LIVRE'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-white">Capital de Giro Necessário</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Baseado em {wcPercentage}% dos Custos Fixos</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-amber-600 dark:text-amber-400 text-lg">{isVisible ? `R$ ${workingCapital.toLocaleString()}` : '••••'}</p>
                            </div>
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-xl border ${freeCash >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${freeCash >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                    <ArrowRight size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-white">Caixa Livre Real</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">O que sobra após reservas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-lg ${freeCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{isVisible ? `R$ ${freeCash.toLocaleString()}` : '••••'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation & Config */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col justify-center">
                <div className="mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Entenda o Cálculo</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        O sistema soma todos os seus <strong>Custos Fixos</strong> cadastrados e calcula <strong>{wcPercentage}%</strong> desse valor para definir sua meta de Capital de Giro. 
                        Isso garante que você sempre tenha reserva para cobrir suas obrigações essenciais.
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
                    <span className="text-xs font-bold text-slate-400 uppercase">Base de Cálculo Atual</span>
                    <div className="flex justify-between items-end mt-2">
                        <div>
                            <p className="text-sm text-slate-500">Total Custos Fixos</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{isVisible ? `R$ ${totalFixedCosts.toLocaleString()}` : '••••'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                                {wcPercentage}% Alocação
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                    <AlertCircle className="shrink-0" size={20} />
                    <p>O cálculo é atualizado instantaneamente ao adicionar ou remover custos fixos.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CashFlowView;
