
import React from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface BalanceCardProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  isVisible: boolean;
  label?: string;
  trendPercentage?: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  totalBalance, 
  monthlyIncome, 
  monthlyExpense, 
  isVisible, 
  label = "Saldo Geral",
  trendPercentage = 0
}) => {
  const isPositiveTrend = trendPercentage >= 0;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 dark:from-white/10 dark:to-white/5 dark:backdrop-blur-xl dark:border dark:border-white/10 p-6 rounded-3xl shadow-xl shadow-slate-900/20 dark:shadow-black/20 text-white dark:text-white relative overflow-hidden group flex flex-col justify-between transition-all hover:scale-[1.01]">
      {/* Decorative Blur matching CashFlow view */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400">
            <Wallet className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
          </div>
          
          {/* Trend Indicator */}
          {isVisible && (
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border ${
               isPositiveTrend 
                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 dark:text-emerald-400' 
                 : 'bg-rose-500/10 border-rose-500/20 text-rose-400 dark:text-rose-400'
            }`}>
              {isPositiveTrend ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trendPercentage).toFixed(1)}% vs. Mês Anterior
            </div>
          )}
        </div>

        <div className="text-[2.5rem] leading-none font-black mb-8 tracking-tight flex items-center gap-2 drop-shadow-sm text-white dark:text-white">
          {isVisible 
            ? `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
            : 'R$ ••••••'}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 border-t border-white/10 dark:border-white/10 pt-4 mt-auto">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 dark:text-emerald-400 text-[10px] font-bold uppercase mb-1 tracking-wider opacity-90">
              <TrendingUp size={12} /> Entradas
            </div>
            <div className="font-bold text-lg text-white dark:text-white">
               {isVisible ? `R$ ${monthlyIncome.toLocaleString('pt-BR', { compactDisplay: 'short', notation: 'compact' })}` : '••••'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-rose-400 dark:text-rose-400 text-[10px] font-bold uppercase mb-1 tracking-wider opacity-90">
              <TrendingDown size={12} /> Saídas
            </div>
            <div className="font-bold text-lg text-white dark:text-white">
               {isVisible ? `R$ ${monthlyExpense.toLocaleString('pt-BR', { compactDisplay: 'short', notation: 'compact' })}` : '••••'}
            </div>
          </div>
        </div>
    </div>
  );
};

export default BalanceCard;
