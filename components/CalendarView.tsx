
import React from 'react';
import { Transaction } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  transactions: Transaction[];
  isVisible: boolean;
  timeFilter: 'week' | 'month' | 'year';
}

const CalendarView: React.FC<CalendarViewProps> = ({ transactions, isVisible, timeFilter }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getTransactionsForDay = (d: Date) => {
    return transactions.filter(t => 
      t.date.getDate() === d.getDate() && 
      t.date.getMonth() === d.getMonth() && 
      t.date.getFullYear() === d.getFullYear()
    );
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Helper to format currency
  const formatMoney = (val: number) => isVisible ? `R$ ${val.toLocaleString('pt-BR', { compactDisplay: 'short', notation: 'compact' })}` : '•••';

  // --- WEEK VIEW ---
  if (timeFilter === 'week') {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
    const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
             Semana de {weekDays[0].getDate()} à {weekDays[6].getDate()} de {monthNames[weekDays[6].getMonth()]}
          </h2>
          <div className="flex gap-2">
              <button onClick={prevWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronLeft size={20}/></button>
              <button onClick={nextWeek} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
           {weekDays.map((day, i) => {
              const txs = getTransactionsForDay(day);
              const income = txs.filter(t => t.type === 'income').reduce((a,b) => a+b.amount, 0);
              const expense = txs.filter(t => t.type === 'expense').reduce((a,b) => a+b.amount, 0);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div key={i} className={`flex flex-col h-[300px] border rounded-2xl p-3 transition-colors ${isToday ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                   <div className="text-center mb-3">
                     <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][i]}</div>
                     <div className={`text-xl font-black mt-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-white'}`}>{day.getDate()}</div>
                   </div>
                   
                   <div className="flex justify-between text-[10px] font-bold mb-2 px-1">
                      <span className="text-emerald-500">{formatMoney(income)}</span>
                      <span className="text-red-500">{formatMoney(expense)}</span>
                   </div>

                   <div className="flex-1 relative bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden flex flex-col justify-end">
                      <div className="w-full bg-emerald-400/40" style={{ height: `${Math.min((income / 2000) * 100, 50)}%` }}></div>
                      <div className="w-full bg-red-400/40" style={{ height: `${Math.min((expense / 2000) * 100, 50)}%` }}></div>
                   </div>

                   <div className="mt-3 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar px-1">
                      {txs.map(t => (
                        <div key={t.id} className="text-[9px] truncate text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-100 dark:border-slate-700 shadow-sm">
                          {t.description}
                        </div>
                      ))}
                   </div>
                </div>
              )
           })}
        </div>
      </div>
    );
  }

  // --- YEAR VIEW ---
  if (timeFilter === 'year') {
    const nextYear = () => { const d = new Date(currentDate); d.setFullYear(d.getFullYear() + 1); setCurrentDate(d); };
    const prevYear = () => { const d = new Date(currentDate); d.setFullYear(d.getFullYear() - 1); setCurrentDate(d); };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Ano de {year}</h2>
                <div className="flex gap-2">
                    <button onClick={prevYear} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronLeft size={20}/></button>
                    <button onClick={nextYear} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronRight size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {monthNames.map((mName, idx) => {
                    const txsInMonth = transactions.filter(t => t.date.getMonth() === idx && t.date.getFullYear() === year);
                    const income = txsInMonth.filter(t => t.type === 'income').reduce((a,b) => a + b.amount, 0);
                    const expense = txsInMonth.filter(t => t.type === 'expense').reduce((a,b) => a + b.amount, 0);
                    const balance = income - expense;

                    return (
                        <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-default">
                            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-3">{mName}</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Entrada</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(income)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Saída</span>
                                    <span className="font-bold text-red-500">{formatMoney(expense)}</span>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-700 my-2 pt-2 flex justify-between text-sm">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Saldo</span>
                                    <span className={`font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{formatMoney(balance)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  }

  // --- MONTH VIEW ---
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize">{monthNames[month]} {year}</h2>
        <div className="flex gap-2 text-slate-500">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronLeft size={20}/></button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2 lg:gap-3">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{d}</div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px]"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = new Date(year, month, i + 1);
          const dayTxs = getTransactionsForDay(day);
          const dailyTotal = dayTxs.reduce((acc, t) => t.type === 'income' ? acc + t.amount : t.type === 'expense' ? acc - t.amount : acc, 0);
          const isToday = new Date().toDateString() === day.toDateString();
          
          return (
            <div key={i} className={`
              min-h-[110px] border border-slate-100 dark:border-slate-700 rounded-2xl p-2 relative hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex flex-col justify-between group
              ${isToday ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-900/10' : ''}
            `}>
              <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-500 text-white shadow-md' : 'text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>{i+1}</span>
                  {dayTxs.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${dailyTotal >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {isVisible ? `R$ ${dailyTotal.toLocaleString(undefined, {compactDisplay: 'short'})}` : '•'}
                      </span>
                  )}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {dayTxs.slice(0, 2).map((tx, idx) => (
                  <div key={idx} className={`text-[9px] truncate px-2 py-1 rounded-full font-medium shadow-sm border border-transparent ${
                    tx.type === 'income' ? 'bg-white text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' :
                    tx.type === 'expense' ? 'bg-white text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800' :
                    'bg-white text-blue-600 border-blue-100'
                  }`}>
                     {tx.description}
                  </div>
                ))}
                {dayTxs.length > 2 && (
                   <div className="text-[9px] text-slate-400 text-center font-bold">+ {dayTxs.length - 2} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
