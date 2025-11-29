import React from 'react';
import { AppSettings, Transaction, AccountType, BusinessConfig, FixedCostTemplate } from '../types';
import { Target, AlertCircle, PieChart, Wallet, ShieldCheck, Hourglass, TrendingUp } from 'lucide-react';

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

  // --- Calculations ---
  
  // 1. Real Cash Balance
  const realTotalBalance = transactions
    .filter(t => t.accountId === 'business')
    .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  // 2. Fixed Costs
  const totalFixedCosts = fixedCosts.reduce((acc, curr) => acc + curr.defaultAmount, 0);
  
  // 3. Reserve
  const reserveRatio = currentScope.cashFlow.workingCapitalPercent || 100;
  const requiredReserve = totalFixedCosts * (reserveRatio / 100);

  // 4. Free Cash
  const freeCash = realTotalBalance - requiredReserve;

  // 5. Runway
  const runwayMonths = totalFixedCosts > 0 ? (realTotalBalance / totalFixedCosts) : 0;

  // --- Gauge Logic ---
  // Max value for gauge is roughly 2x the required reserve or the total balance if its huge
  const gaugeMax = Math.max(requiredReserve * 2, realTotalBalance * 1.2, 1);
  const gaugeValue = Math.max(0, realTotalBalance);
  
  // SVG Arc Calculation
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const strokeDashoffset = halfCircumference - (Math.min(gaugeValue, gaugeMax) / gaugeMax) * halfCircumference;

  // Health Color
  const healthColor = freeCash >= 0 ? '#10b981' : '#f59e0b'; // Emerald or Amber

  return (
    <div className="space-y-8 animate-in slide-up duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PieChart className="text-blue-600" /> Fluxo de Caixa Avançado
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Análise tecnológica da sua sustentabilidade financeira.
                </p>
            </div>
            {/* Status Badge */}
            <div className={`glass-panel flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold w-fit shadow-lg ${freeCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {freeCash >= 0 ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                {freeCash >= 0 ? 'Saúde Financeira Excelente' : 'Atenção: Reserva Baixa'}
            </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Futuristic Gauge Chart */}
            <div className="lg:col-span-2 relative bg-white dark:bg-slate-900/50 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden group">
                {/* Tech Background Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                    
                    <div className="flex-1 space-y-6">
                         <div className="flex items-center gap-2 mb-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Capital de Giro</h3>
                         </div>
                         <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                             Monitoramento em tempo real da sua capacidade de sobrevivência sem novas receitas.
                         </p>

                         <div className="grid grid-cols-2 gap-4 mt-6">
                             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                 <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Reserva Necessária</p>
                                 <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                                     {isVisible ? `R$ ${requiredReserve.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}
                                 </p>
                             </div>
                             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                 <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Reserva Atual</p>
                                 <p className={`text-lg font-black ${freeCash >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                     {isVisible ? `R$ ${realTotalBalance.toLocaleString('pt-BR', {compactDisplay: 'short'})}` : '••••'}
                                 </p>
                             </div>
                         </div>
                    </div>

                    {/* SVG Gauge */}
                    <div className="relative w-64 h-32 flex items-end justify-center">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                            {/* Background Arc */}
                            <path d="M 10,100 A 90,90 0 0,1 190,100" fill="none" stroke={accountType === 'business' ? '#334155' : '#e2e8f0'} strokeWidth="12" strokeLinecap="round" className="opacity-20" />
                            
                            {/* Foreground Value Arc */}
                            <path 
                                d="M 10,100 A 90,90 0 0,1 190,100" 
                                fill="none" 
                                stroke="url(#gradientGauge)" 
                                strokeWidth="12" 
                                strokeLinecap="round" 
                                strokeDasharray={halfCircumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                            />
                            
                            {/* Gradient Defs */}
                            <defs>
                                <linearGradient id="gradientGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="50%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        
                        {/* Center Text */}
                        <div className="absolute bottom-0 text-center mb-2">
                             <span className="text-3xl font-black text-slate-800 dark:text-white block">
                                 {Math.min((realTotalBalance / requiredReserve) * 100, 200).toFixed(0)}%
                             </span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase">Da Meta</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Runway Card (Vertical Glass) */}
            <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-8 shadow-2xl text-white flex flex-col justify-between overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none"></div>
                 
                 <div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                        <Hourglass className="text-blue-300" />
                    </div>
                    <h3 className="text-lg font-bold">Runway</h3>
                    <p className="text-slate-400 text-xs">Fôlego de caixa atual</p>
                 </div>

                 <div className="my-6">
                    <p className="text-5xl font-black tracking-tighter">
                        {runwayMonths.toFixed(1)} <span className="text-lg font-medium opacity-50">meses</span>
                    </p>
                 </div>

                 <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="absolute h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${Math.min(runwayMonths * 10, 100)}%` }}
                    ></div>
                 </div>
            </div>
        </div>

        {/* Breakdown Section: "Caixa Livre" Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dinheiro Comprometido</p>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white">Reserva Técnica</h4>
                     </div>
                     <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                        <Wallet size={24} />
                     </div>
                 </div>
                 
                 <div className="space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                         <span className="text-sm text-slate-500">Custos Fixos Mensais</span>
                         <span className="font-bold text-slate-700 dark:text-white">{isVisible ? `R$ ${totalFixedCosts.toLocaleString()}` : '••••'}</span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                         <span className="text-sm text-slate-500">Meta de Cobertura</span>
                         <span className="font-bold text-blue-500">{reserveRatio}% ({(reserveRatio/100).toFixed(1)}x)</span>
                     </div>
                     <div className="pt-2">
                         <p className="text-xs text-slate-400">
                             Valor que deve permanecer em caixa para garantir a segurança operacional da empresa.
                         </p>
                     </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Disponível para Uso</p>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white">Caixa Livre</h4>
                     </div>
                     <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                        <Target size={24} />
                     </div>
                 </div>

                 <div className="flex items-center justify-center h-32">
                     <p className={`text-4xl font-black ${freeCash >= 0 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                         {isVisible ? `R$ ${freeCash.toLocaleString()}` : '••••••••'}
                     </p>
                 </div>
                 
                 <div className="text-center">
                    {freeCash >= 0 ? (
                        <span className="inline-block px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            Liberado para Investimentos
                        </span>
                    ) : (
                        <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
                            Aguardando Acúmulo de Reserva
                        </span>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default CashFlowView;