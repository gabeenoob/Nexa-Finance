import React from 'react';
import { AppSettings, Transaction, AccountType, BusinessConfig, FixedCostTemplate } from '../types';
import { Target, AlertCircle, PieChart, Info, Wallet, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Hourglass, Zap } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';

interface CashFlowViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  transactions: Transaction[];
  businessConfig: BusinessConfig; 
  fixedCosts: FixedCostTemplate[]; 
  accountType: AccountType;
  isVisible: boolean;
}

const CashFlowView: React.FC<CashFlowViewProps> = ({ settings, transactions, fixedCosts, accountType, isVisible }) => {
  const currentScope = settings.business; 
  
  if (accountType !== 'business') return null;

  // --- Real-time Calculations ---
  
  const calculateRealBalance = () => {
      return transactions
        .filter(t => t.accountId === 'business')
        .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  };

  const realTotalBalance = calculateRealBalance();
  const totalFixedCosts = fixedCosts.reduce((acc, curr) => acc + curr.defaultAmount, 0);
  
  const reserveRatio = currentScope.cashFlow.workingCapitalPercent || 100; // Default to 1 month (100%)
  const requiredReserve = totalFixedCosts * (reserveRatio / 100);

  const freeCash = realTotalBalance - requiredReserve;
  const runwayMonths = totalFixedCosts > 0 ? (realTotalBalance / totalFixedCosts) : 0;

  // --- Gauge Data ---
  // Using a semi-circle chart to represent coverage
  // Total Value = Required Reserve. 
  // If RealBalance > Required, we are at 100%.
  
  const coveragePercent = Math.min(Math.max((realTotalBalance / requiredReserve) * 100, 0), 100);
  const isHealthy = freeCash >= 0;

  // Custom Gauge Component using SVG for maximum minimalism
  const GaugeChart = () => {
    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (coveragePercent / 100) * (circumference / 2); // Divide by 2 for semi-circle effect logic adjustment (custom mapping)
    
    // For a simple semi-circle gauge 
    // Arc length = PI * R. 
    // Max offset (empty) = PI * R
    // Min offset (full) = 0
    
    const arcLength = Math.PI * normalizedRadius;
    const progressOffset = arcLength - ((coveragePercent / 100) * arcLength);

    return (
        <div className="relative flex items-center justify-center h-[200px]">
            <svg height={radius * 2} width={radius * 2} className="rotate-[180deg]">
                 {/* Background Arc */}
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={`${arcLength} ${arcLength}`}
                    strokeDashoffset="0"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-slate-100 dark:text-slate-700 transition-all duration-1000"
                    strokeLinecap="round"
                />
                {/* Progress Arc */}
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={`${arcLength} ${arcLength}`}
                    strokeDashoffset={progressOffset}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={`${isHealthy ? 'text-emerald-500' : 'text-amber-500'} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center rotate-180 transform-gpu">
                <span className={`text-4xl font-black ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {Math.round(coveragePercent)}%
                </span>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Cobertura</p>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-up">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stagger-1 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
                        <Zap size={24} fill="currentColor" /> 
                    </div>
                    Capital de Giro & Runway
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                    Análise de saúde financeira e capacidade de sobrevivência sem novas receitas.
                </p>
            </div>
            
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md transition-all ${isHealthy ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'}`}>
                {isHealthy ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase opacity-70">Status Atual</span>
                    <span className="font-bold text-sm">{isHealthy ? 'Reserva Garantida' : 'Abaixo do Ideal'}</span>
                </div>
            </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-2 animate-fade-up">
            
            {/* Main Gauge Card */}
            <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20"></div>
                
                <h3 className="font-bold text-lg text-slate-700 dark:text-white mb-6 flex items-center gap-2 z-10">
                    <Target size={18} className="text-blue-500"/> Meta de Reserva
                </h3>

                <GaugeChart />

                <div className="mt-[-40px] text-center z-10">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Meta: <span className="text-slate-800 dark:text-white font-bold">{reserveRatio}%</span> dos Custos Fixos
                    </p>
                </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Required Reserve Card */}
                <div className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                             <Wallet size={24} />
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Necessário (Reserva)</p>
                             <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                                {isVisible ? `R$ ${requiredReserve.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}
                             </h4>
                        </div>
                    </div>
                    <div className="mt-8">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{width: '100%'}}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Valor bloqueado para segurança operacional.</p>
                    </div>
                </div>

                {/* Free Cash Card */}
                <div className="glass-card rounded-3xl p-6 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-2xl ${isHealthy ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/20 text-red-500'}`}>
                             <TrendingUp size={24} />
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Caixa Livre (Investimento)</p>
                             <h4 className={`text-2xl font-black mt-1 ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                {isVisible ? `R$ ${freeCash.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}
                             </h4>
                        </div>
                    </div>
                    <div className="mt-8">
                         {isHealthy ? (
                             <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg w-fit">
                                <Zap size={14} /> Pronto para crescer
                             </div>
                         ) : (
                             <div className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg w-fit">
                                <AlertCircle size={14} /> Déficit de Reserva
                             </div>
                         )}
                        <p className="text-xs text-slate-500 mt-2">Capital disponível acima da meta.</p>
                    </div>
                </div>

                {/* Runway Card (Full Width in Inner Grid) */}
                <div className="md:col-span-2 glass-card rounded-3xl p-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/10 dark:bg-slate-200/50 rounded-2xl backdrop-blur-md">
                                <Hourglass size={32} className="text-blue-300 dark:text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Runway (Fôlego)</h3>
                                <p className="text-slate-300 dark:text-slate-600 text-sm font-medium">Tempo de vida sem novas receitas</p>
                            </div>
                        </div>

                        <div className="text-center md:text-right">
                             <div className="text-5xl font-black tracking-tighter tabular-nums">
                                {runwayMonths.toFixed(1)} <span className="text-lg font-bold text-slate-400 dark:text-slate-500">meses</span>
                             </div>
                             <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">Baseado nos Custos Fixos</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Informational Footer */}
        <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex gap-4 items-start stagger-3 animate-fade-up">
            <Info className="shrink-0 text-blue-500 mt-0.5" size={20} />
            <div>
                <p className="mb-2 font-bold text-slate-800 dark:text-white">Como funciona o cálculo?</p>
                <p>
                    O sistema utiliza seus <strong>Custos Fixos Mensais</strong> (R$ {isVisible ? totalFixedCosts.toLocaleString() : '...'}) como base.
                    A meta de reserva é definida em <strong>{reserveRatio}%</strong> deste valor. 
                    Todo capital acumulado que excede esta reserva é considerado <strong>Caixa Livre</strong> para distribuição de lucros ou reinvestimento seguro.
                </p>
            </div>
        </div>

    </div>
  );
};

export default CashFlowView;