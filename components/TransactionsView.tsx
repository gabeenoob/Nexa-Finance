

import React from 'react';
import { Transaction } from '../types';
import { ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, MapPin, Hash, Pencil, Trash2 } from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  isVisible: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, isVisible, onEdit, onDelete, canEdit }) => {
  const sorted = [...transactions].sort((a,b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Histórico Completo de Transações</h2>
        <span className="text-sm text-slate-400">{transactions.length} registros</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">
              <th className="p-4 rounded-tl-lg">Tipo</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Data/Hora</th>
              <th className="p-4">Tags</th>
              <th className="p-4 text-right">Valor</th>
              <th className="p-4 rounded-tr-lg text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sorted.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <td className="p-4">
                  {tx.type === 'income' && <span className="flex items-center gap-1 text-emerald-500 font-bold"><ArrowUpCircle size={16} /> Entrada</span>}
                  {tx.type === 'expense' && <span className="flex items-center gap-1 text-red-500 font-bold"><ArrowDownCircle size={16} /> Saída</span>}
                  {tx.type === 'transfer' && <span className="flex items-center gap-1 text-blue-500 font-bold"><ArrowRightLeft size={16} /> Transf.</span>}
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-700 dark:text-slate-200">{tx.description}</div>
                  {tx.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <MapPin size={12} /> {tx.location.address || 'Localização registrada'}
                    </div>
                  )}
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400">
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-bold">
                    {tx.category}
                  </span>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400">
                  <div className="font-medium">{tx.date.toLocaleDateString('pt-BR')}</div>
                  <div className="text-xs">{tx.date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {tx.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-0.5 text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        <Hash size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className={`p-4 text-right font-bold text-base ${
                  tx.type === 'income' ? 'text-emerald-600' : 
                  tx.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                }`}>
                  {isVisible ? `R$ ${tx.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '••••••'}
                </td>
                <td className="p-4">
                    {canEdit && (
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onEdit(tx)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Editar"
                          >
                              <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(tx.id); // Chama direto o pai (App.tsx), sem modal local
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Excluir"
                          >
                              <Trash2 size={16} />
                          </button>
                        </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
          <div className="p-8 text-center text-slate-400">Nenhuma transação encontrada para este filtro.</div>
      )}
    </div>
  );
};

export default TransactionsView;