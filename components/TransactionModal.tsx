import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import { Transaction, Category, Tag } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'accountId' | 'workspaceId'>, id?: string) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  categories: Category[];
  availableTags: Tag[];
  mode?: 'default' | 'cash'; // 'cash' mode simplifies the UI
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  initialData, 
  categories, 
  availableTags,
  mode = 'default'
}) => {
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing Mode
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setDescription(initialData.description);
        setDate(initialData.date.toISOString().split('T')[0]);
        setTime(initialData.date.toTimeString().split(' ')[0].slice(0, 5));
        setCategory(initialData.category);
        setSelectedTags(initialData.tags);
      } else {
        // New Mode
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toTimeString().split(' ')[0].slice(0, 5));
        setSelectedTags([]);
        setAmount('');
        
        if (mode === 'cash') {
          setCategory('Caixa');
          setDescription('Movimentação de Caixa');
        } else {
          setDescription('');
          if (categories.length > 0) setCategory(categories[0].name);
        }
      }
    }
  }, [isOpen, initialData, categories, mode]);

  if (!isOpen) return null;

  const handleSelectTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
        setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
        setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const finalDate = new Date(`${date}T${time}`);

    onSave({
      type,
      amount: parseFloat(amount),
      description,
      date: finalDate,
      category: mode === 'cash' ? 'Caixa' : (category || 'Geral'),
      tags: selectedTags,
      location: undefined, // Removed location
      source: 'Caixa Principal', 
      destination: type === 'transfer' ? 'Conta Secundária' : undefined
    }, initialData?.id);
  };

  const handleDelete = () => {
    if (initialData && onDelete) {
       // Directly call onDelete. The parent (App.tsx) handles the confirmation modal.
       onDelete(initialData.id);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {mode === 'cash' ? 'Ajustar Saldo em Caixa' : initialData ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <div className="flex items-center gap-2">
            {initialData && onDelete && (
              <button 
                type="button"
                onClick={handleDelete}
                className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-full transition-colors"
                title="Excluir Transação"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-950/50">
          <button 
            onClick={() => setType('income')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
          >
            <ArrowUpCircle size={16} /> Entrada
          </button>
          <button 
            onClick={() => setType('expense')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
          >
            <ArrowDownCircle size={16} /> Saída
          </button>
          {mode !== 'cash' && (
             <button 
               onClick={() => setType('transfer')}
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${type === 'transfer' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
             >
               <ArrowRightLeft size={16} /> Transf.
             </button>
          )}
        </div>

        {/* Form Scrollable Area */}
        <form id="transaction-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
              <input 
                type="number" 
                step="0.01"
                autoFocus={!initialData}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl pl-12 pr-4 py-4 text-2xl font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-300"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Description */}
          {mode !== 'cash' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição</label>
              <input 
                type="text" 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ex: Almoço com cliente..."
              />
            </div>
          )}

          {/* Date & Time */}
          {mode !== 'cash' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                      type="date" 
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Hora</label>
                <input 
                    type="time" 
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Category & Tags - Hidden in Cash Mode */}
          {mode !== 'cash' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="" disabled>Selecione</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {/* Fallback if list is empty */}
                    {categories.length === 0 && <option value="Geral">Geral</option>}
                  </select>
               </div>
               
               {/* Tag Cloud - No Input anymore, just selection */}
               <div>
                 <div className="flex items-center gap-2 mb-2">
                   <Hash size={14} className="text-slate-400" />
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tags</label>
                 </div>
                 
                 {availableTags.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {availableTags.map(tag => {
                        const isSelected = selectedTags.includes(tag.label);
                        return (
                          <button 
                            key={tag.id}
                            type="button" 
                            onClick={() => handleSelectTag(tag.label)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                              isSelected 
                                ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                             {tag.label}
                          </button>
                        );
                     })}
                   </div>
                 ) : (
                   <p className="text-xs text-slate-400 italic">Nenhuma tag criada nas configurações.</p>
                 )}
               </div>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3">
           <button 
            type="button"
            onClick={onClose}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl transition-all"
          >
             Cancelar
           </button>
           <button 
            type="submit" 
            form="transaction-form"
            className="flex-[2] bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
          >
             {initialData ? 'Salvar Alterações' : 'Confirmar Registro'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;