import React from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, MapPin } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  isVisible: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isVisible }) => {
  // Sort by date descending
  const sorted = [...transactions].sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  if (sorted.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center text-slate-400">
        Nenhuma transação registrada.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-slate-700 dark:text-white font-bold text-lg">Últimas Transações</h3>
      </div>
      <div>
        {sorted.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                tx.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                tx.type === 'expense' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
              }`}>
                {tx.type === 'income' ? <ArrowUpRight size={20} /> : tx.type === 'expense' ? <ArrowDownLeft size={20} /> : <ArrowRightLeft size={20} />}
              </div>
              
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{tx.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{tx.category}</span>
                  <span>•</span>
                  <span>{tx.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {tx.date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  {tx.location && (
                    <span className="flex items-center gap-0.5 text-blue-400">
                       <MapPin size={10} />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={`font-bold ${
              tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
              tx.type === 'expense' ? 'text-red-500 dark:text-red-400' : 
              'text-slate-600 dark:text-slate-300'
            }`}>
              {isVisible ? (
                <>
                  {tx.type === 'expense' ? '-' : '+'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </>
              ) : '••••••'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
