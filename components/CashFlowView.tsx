
import React from 'react';
import { AppSettings, Transaction, AccountType, BusinessConfig, FixedCostTemplate } from '../types';
import { Target, AlertCircle, PieChart, Info, Wallet, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Hourglass } from 'lucide-react';

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
  
  // 2. Total Fixed Costs (Monthly Base)
  const totalFixedCosts = fixedCosts.reduce((acc, curr) => acc + curr.defaultAmount, 0);
  
  // 3. AUTOMATIC Working Capital Calculation (Calculation Redesign)
  // New Logic: User sets a percentage of fixed costs they want to keep as reserve.
  // 100% = 1 month of coverage. 600% = 6 months.
  const reserveRatio = currentScope.cashFlow.workingCapitalPercent || 100; // Default to 1 month (100%)
  const requiredReserve = totalFixedCosts * (reserveRatio / 100);

  // 4. Free Cash Calculation
  const freeCash = realTotalBalance - requiredReserve;

  // 5. Runway Calculation (Months of Survival)
  const runwayMonths = totalFixedCosts > 0 ? (realTotalBalance / totalFixedCosts) : 0;

  // Progress Bar Widths
  const reserveProgress = realTotalBalance > 0 ? Math.min((requiredReserve / realTotalBalance) * 100, 100) : 0;
  const freeProgress = realTotalBalance > 0 ? Math.max(0, 100 - reserveProgress) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PieChart className="text-blue-600" /> Gestão de Capital de Giro
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Análise de sustentabilidade financeira baseada nos seus custos fixos.
                </p>
            </div>
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold w-fit ${freeCash >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                {freeCash >= 0 ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                {freeCash >= 0 ? 'Reserva Garantida' : 'Abaixo da Reserva Ideal'}
            </div>
        </div>

        {/* Hero Card: Real Balance with Glassmorphism */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white/10 dark:to-white/5 dark:backdrop-blur-xl dark:border dark:border-white/10 rounded-3xl p-8 shadow-xl shadow-slate-900/20 dark:shadow-black/20 text-white flex flex-col md:flex-row items-center justify-between gap-8 group">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -ml-10 -mb-10 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left flex-1">
                <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2 md:justify-start justify-center">
                    <Wallet size={16} /> Saldo Real Disponível
                </p>
                <div className="text-5xl md:text-6xl font-black tracking-tight flex items-baseline justify-center md:justify-start gap-1 drop-shadow-sm">
                    {isVisible ? (
                        <>
                            <span className="text-2xl md:text-3xl opacity-50">R$</span>
                            {realTotalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </>
                    ) : '••••••••'}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                    <Hourglass size={14} className="text-blue-300" />
                    <span>Fôlego Financeiro (Runway): <span className="text-white text-sm">{runwayMonths.toFixed(1)} meses</span></span>
                </div>
            </div>

            {/* Mini breakdown cards inside hero */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                 <div className="bg-slate-950/30 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 flex-1 border border-white/5 min-w-[220px]">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 box-shadow-glow"></div>
                        <p className="text-xs font-bold uppercase opacity-80">Reserva Necessária</p>
                     </div>
                     <p className="text-2xl font-bold text-amber-300">{isVisible ? `R$ ${requiredReserve.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}</p>
                     <p className="text-[10px] opacity-60 mt-1">{reserveRatio}% dos Custos Fixos</p>
                 </div>
                 
                 <div className="bg-slate-950/30 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 flex-1 border border-white/5 min-w-[220px]">
                     <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${freeCash >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                        <p className="text-xs font-bold uppercase opacity-80">Caixa Livre</p>
                     </div>
                     <p className={`text-2xl font-bold ${freeCash >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{isVisible ? `R$ ${freeCash.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}</p>
                     <p className="text-[10px] opacity-60 mt-1">Disponível para Investir/Retirar</p>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Visual Bar Chart Section */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col justify-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                    <Target className="text-blue-500" size={20}/> Composição do Saldo
                </h3>

                {/* Modern Progress Bar */}
                <div className="relative mb-4">
                    <div className="h-16 w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl overflow-hidden flex shadow-inner relative">
                        {/* Reserve Bar */}
                        <div 
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-[10px] font-bold text-amber-950 transition-all duration-1000 relative group border-r border-white/20"
                            style={{ width: `${reserveProgress}%` }}
                        >
                            <span className="opacity-80 group-hover:opacity-100 transition-opacity">RESERVA</span>
                        </div>
                        
                        {/* Free Cash Bar */}
                        <div 
                            className={`h-full flex items-center justify-center text-[10px] font-bold transition-all duration-1000 relative group ${freeCash >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950' : 'bg-transparent'}`}
                            style={{ width: `${freeProgress}%` }}
                        >
                            {freeCash >= 0 && <span className="opacity-80 group-hover:opacity-100 transition-opacity">LIVRE</span>}
                        </div>
                    </div>

                    {/* Indicators below bar */}
                    <div className="flex justify-between mt-3 text-xs font-bold text-slate-400 px-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100% Saldo</span>
                    </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 text-sm text-slate-600 dark:text-slate-400">
                    {freeCash >= 0 ? (
                        <p>Você atingiu sua meta de reserva! <strong className="text-emerald-600 dark:text-emerald-400">R$ {isVisible ? freeCash.toLocaleString() : '...'}</strong> estão livres para reinvestimento ou distribuição de lucros sem comprometer a segurança da empresa.</p>
                    ) : (
                        <p>Seu saldo atual cobre apenas <strong className="text-amber-600 dark:text-amber-400">{(runwayMonths * 30).toFixed(0)} dias</strong> de operação. Recomendamos acumular mais caixa antes de realizar novos investimentos.</p>
                    )}
                </div>
            </div>

            {/* Metrics & Explanation Side */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col">
                <div className="mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Base de Cálculo</h3>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">Custos Fixos Mensais</span>
                            <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">Base</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{isVisible ? `R$ ${totalFixedCosts.toLocaleString()}` : '••••'}</p>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                         <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Meta de Cobertura</h4>
                         <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{reserveRatio}% ({Math.ceil(reserveRatio/100)} meses)</span>
                    </div>
                    
                    {/* Visual representation of months covered */}
                    <div className="flex gap-1 mb-4">
                        {[1,2,3,4,5,6].map(m => (
                            <div key={m} className={`h-2 flex-1 rounded-full ${m <= Math.ceil(reserveRatio/100) ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
                        ))}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Sua meta de Capital de Giro é definida nas configurações da empresa. Atualmente configurada para cobrir <strong>{(reserveRatio/100).toFixed(1)}x</strong> seus custos fixos mensais.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CashFlowView;
