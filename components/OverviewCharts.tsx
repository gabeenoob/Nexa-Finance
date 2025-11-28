
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Transaction } from '../types';

interface OverviewChartsProps {
  transactions: Transaction[];
  isVisible: boolean;
}

const OverviewCharts: React.FC<OverviewChartsProps> = ({ transactions, isVisible }) => {
  const [chartView, setChartView] = useState<'flow' | 'income_only' | 'expense_only'>('flow');
  const [pieView, setPieView] = useState<'expense' | 'income'>('expense');

  // Process data for Area Chart (Group by date)
  const chartDataMap = new Map();
  const sortedTx = [...transactions].sort((a,b) => a.date.getTime() - b.date.getTime());

  sortedTx.forEach(tx => {
    const dateStr = tx.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    if (!chartDataMap.has(dateStr)) {
      chartDataMap.set(dateStr, { name: dateStr, income: 0, expense: 0 });
    }
    const entry = chartDataMap.get(dateStr);
    if (tx.type === 'income') entry.income += tx.amount;
    if (tx.type === 'expense') entry.expense += tx.amount;
  });

  const areaData = Array.from(chartDataMap.values());

  // Process data for Pie Chart
  const categoryDataMap = new Map();
  transactions.filter(t => t.type === pieView).forEach(tx => {
      const current = categoryDataMap.get(tx.category) || 0;
      categoryDataMap.set(tx.category, current + tx.amount);
  });
  
  const pieData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({ name, value }));
  
  const COLORS_EXPENSE = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#64748b', '#06b6d4'];
  const COLORS_INCOME = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857', '#a7f3d0'];
  const COLORS = pieView === 'expense' ? COLORS_EXPENSE : COLORS_INCOME;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 border border-slate-100 dark:border-white/10 shadow-2xl rounded-2xl text-xs z-50">
          <p className="font-bold text-slate-700 dark:text-white mb-2 text-sm">{label}</p>
          {isVisible ? (
             <div className="space-y-1.5">
               {(chartView === 'flow' || chartView === 'income_only') && (
                 <p className="text-emerald-500 flex justify-between gap-6"><span>Entradas:</span> <span className="font-bold">R$ {payload[0]?.payload.income.toLocaleString()}</span></p>
               )}
               {(chartView === 'flow' || chartView === 'expense_only') && (
                 <p className="text-red-500 flex justify-between gap-6"><span>Saídas:</span> <span className="font-bold">R$ {payload[0]?.payload.expense.toLocaleString()}</span></p>
               )}
             </div>
          ) : (
            <p className="text-slate-400 italic">Valores ocultos</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Main Flow Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/10 transition-colors group">
        <div className="flex flex-wrap items-center justify-between mb-8 gap-2">
          <h3 className="text-slate-800 dark:text-white font-bold text-xl tracking-tight">Fluxo de Caixa</h3>
          <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-xl">
            <button onClick={() => setChartView('flow')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartView === 'flow' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>Geral</button>
            <button onClick={() => setChartView('income_only')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartView === 'income_only' ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>Entradas</button>
            <button onClick={() => setChartView('expense_only')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartView === 'expense_only' ? 'bg-white dark:bg-white/10 shadow-sm text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}>Saídas</button>
          </div>
        </div>
        
        <div className="h-[300px] w-full">
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                {(chartView === 'flow' || chartView === 'income_only') && (
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" animationDuration={1500} />
                )}
                {(chartView === 'flow' || chartView === 'expense_only') && (
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" animationDuration={1500} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-sm font-medium">Sem dados suficientes para o gráfico.</div>
          )}
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-white/10 transition-colors flex flex-col group">
        <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-800 dark:text-white font-bold text-xl tracking-tight">{pieView === 'expense' ? 'Despesas' : 'Receitas'}</h3>
             <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-lg">
                 <button onClick={() => setPieView('expense')} className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all ${pieView === 'expense' ? 'bg-white dark:bg-white/10 shadow-sm text-red-500 dark:text-red-400' : 'text-slate-400'}`}>Despesas</button>
                 <button onClick={() => setPieView('income')} className={`text-[10px] font-bold px-3 py-1 rounded-md transition-all ${pieView === 'income' ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-500 dark:text-emerald-400' : 'text-slate-400'}`}>Receitas</button>
             </div>
        </div>
        <div className="flex-1 min-h-[220px]">
           {pieData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                    animationDuration={1500}
                  >
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => isVisible ? `R$ ${value.toFixed(2)}` : '••••'} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
             </ResponsiveContainer>
           ) : (
             <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">Sem dados de categoria.</div>
           )}
        </div>
      </div>
    </div>
  );
};

export default OverviewCharts;
