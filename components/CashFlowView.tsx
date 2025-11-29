import React from 'react';
import { AppSettings, Transaction, AccountType, BusinessConfig, FixedCostTemplate } from '../types';
import { Target, AlertCircle, PieChart, Info, Wallet, ShieldCheck, Hourglass, Activity, Zap } from 'lucide-react';

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
  
  // User sets % of fixed costs to keep as reserve (100% = 1 month)
  const reserveRatio = currentScope.cashFlow.workingCapitalPercent || 100;
  const requiredReserve = totalFixedCosts * (reserveRatio / 100);
  const freeCash = realTotalBalance - requiredReserve;
  const runwayMonths = totalFixedCosts > 0 ? (realTotalBalance / totalFixedCosts) : 0;
  
  // Gauge Calculation (0 to 12 months cap)
  const maxRunway = 12; 
  const gaugePercent = Math.min(runwayMonths, maxRunway) / maxRunway;
  const gaugeAngle = gaugePercent * 180; // 0 to 180 degrees

  return (
    <div className="space-y-8 animate-enter">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                    <Activity className="text-blue-600" size={28} /> Capital de Giro
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                    Monitoramento em tempo real da saúde e sustentabilidade financeira.
                </p>
            </div>
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-bold w-fit shadow-sm backdrop-blur-md ${freeCash >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}`}>
                {freeCash >= 0 ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                {freeCash >= 0 ? 'Saúde Financeira Positiva' : 'Atenção: Reserva Comprometida'}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Gauge Card */}
            <div className="lg:col-span-2 relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-white/5 p-8 flex flex-col justify-between group">
                {/* Background Tech GFX */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    
                    {/* The Gauge */}
                    <div className="relative w-64 h-32 flex items-end justify-center shrink-0">
                         {/* Background Arc */}
                         <div className="absolute w-64 h-64 rounded-full border-[16px] border-slate-100 dark:border-slate-800" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}></div>
                         
                         {/* Foreground Active Arc (SVG for smooth gradient) */}
                         <svg className="absolute w-64 h-64 -rotate-90 top-0 left-0 overflow-visible" viewBox="0 0 100 100">
                             <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" />
                                    <stop offset="50%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                             </defs>
                             {/* Calculated Stroke Dasharray for Semicircle */}
                             <circle 
                                cx="50" cy="50" r="42" 
                                fill="none" 
                                stroke="url(#gaugeGradient)" 
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${gaugePercent * 132} 264`} 
                                className="transition-all duration-1000 ease-out"
                             />
                         </svg>

                         {/* Value Text in Center */}
                         <div className="absolute bottom-0 text-center mb-[-5px]">
                             <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                                {runwayMonths.toFixed(1)}
                             </span>
                             <span className="text-xs font-bold text-slate-400 block uppercase tracking-widest mt-1">Meses de Caixa</span>
                         </div>
                    </div>

                    {/* Context Text */}
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Capacidade de Sobrevivência</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                           Com os custos atuais de <strong className="text-slate-700 dark:text-slate-300">R$ {isVisible ? totalFixedCosts.toLocaleString('pt-BR', {compactDisplay: 'short'}) : '•••'}/mês</strong>, sua empresa possui fôlego financeiro para operar por {runwayMonths.toFixed(1)} meses sem novas receitas.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                             <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                <Hourglass size={14} className="text-blue-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Runway: {runwayMonths.toFixed(1)}x</span>
                             </div>
                             <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-2">
                                <Target size={14} className="text-purple-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Meta: {(reserveRatio/100).toFixed(1)}x</span>
                             </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Metrics Column */}
            <div className="space-y-6 flex flex-col">
                {/* Total Balance Card */}
                <div className="bg-slate-900 dark:bg-white/5 text-white p-6 rounded-3xl shadow-lg shadow-slate-900/20 dark:shadow-none border border-slate-800 dark:border-white/10 relative overflow-hidden tech-card flex-1">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <Wallet size={16} /> Saldo Real
                        </div>
                        <div className="text-3xl font-black tracking-tight mb-1">
                            {isVisible ? `R$ ${realTotalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '••••••••'}
                        </div>
                        <div className="text-slate-500 text-xs font-medium">Disponível em todas as contas</div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mb-8"></div>
                </div>

                {/* Free Cash Metric */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden tech-card flex-1">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <Zap size={16} className={freeCash >= 0 ? "text-emerald-500" : "text-amber-500"} /> 
                            {freeCash >= 0 ? "Livre para Uso" : "Déficit de Reserva"}
                        </div>
                     </div>
                     <div className={`text-3xl font-black tracking-tight ${freeCash >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                        {isVisible ? `R$ ${Math.abs(freeCash).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '••••••••'}
                     </div>
                     <p className="text-xs text-slate-400 mt-2">
                         {freeCash >= 0 ? "Pode ser reinvestido ou distribuído." : "Valor necessário para atingir a meta de segurança."}
                     </p>
                </div>
            </div>
        </div>

        {/* Breakdown Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                <PieChart className="text-slate-400" size={20}/> Detalhamento do Capital de Giro
             </h3>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 {/* Visual Bar */}
                 <div className="space-y-4">
                     <div className="flex justify-between text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                         <span>0%</span>
                         <span>Reserva Necessária ({reserveRatio}%)</span>
                         <span>Total</span>
                     </div>
                     <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                         <div className="h-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] relative group cursor-help" style={{ width: `${Math.min((requiredReserve / realTotalBalance) * 100, 100)}%` }}>
                             <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none">Reserva: R$ {requiredReserve.toLocaleString()}</div>
                         </div>
                         <div className={`h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] relative group cursor-help transition-all`} style={{ width: `${Math.max(0, 100 - ((requiredReserve / realTotalBalance) * 100))}%` }}>
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity pointer-events-none">Livre: R$ {freeCash.toLocaleString()}</div>
                         </div>
                     </div>
                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                         O gráfico acima representa quanto do seu saldo total está comprometido com a segurança operacional (Reserva) e quanto está realmente livre.
                     </p>
                 </div>

                 {/* Explanation List */}
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-4 border border-slate-100 dark:border-white/5">
                     <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Reserva de Segurança</span>
                         </div>
                         <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400">{isVisible ? `R$ ${requiredReserve.toLocaleString()}` : '•••'}</span>
                     </div>
                     <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                     <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Capital Livre</span>
                         </div>
                         <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{isVisible ? `R$ ${Math.max(0, freeCash).toLocaleString()}` : '•••'}</span>
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default CashFlowView;