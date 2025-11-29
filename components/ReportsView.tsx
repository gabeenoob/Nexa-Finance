
import React, { useState } from 'react';
import { Transaction, AccountType, Project } from '../types';
import { 
  TrendingUp, Download, Briefcase, FileText, FileSpreadsheet, X
} from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
  isVisible: boolean;
  accountType: AccountType;
  projects?: Project[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions, isVisible, accountType, projects = [] }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // STRICTLY Filter transactions for current accountType within the Reports logic
  const relevantTransactions = transactions.filter(t => t.accountId === accountType);

  // --- DRE Calculation (Current Month) ---
  const getCurrentMonthDRE = () => {
    const txs = relevantTransactions.filter(t => 
      t.date.getMonth() === currentMonth && 
      t.date.getFullYear() === currentYear
    );

    const grossRevenue = txs.filter(t => t.type === 'income').reduce((a,b) => a+b.amount, 0);
    
    const taxes = txs.filter(t => t.type === 'expense' && (t.tags.some(tag => tag.toLowerCase().includes('imposto')) || t.category.toLowerCase().includes('fiscal'))).reduce((a,b) => a+b.amount, 0);
    
    const netRevenue = grossRevenue - taxes;

    const fixedCosts = txs.filter(t => t.type === 'expense' && t.category === 'Custos Fixos').reduce((a,b) => a+b.amount, 0);
    
    const variableCosts = txs.filter(t => 
        t.type === 'expense' && 
        t.category !== 'Custos Fixos' && 
        !t.tags.some(tag => tag.toLowerCase().includes('imposto')) && 
        !t.category.toLowerCase().includes('fiscal')
    ).reduce((a,b) => a+b.amount, 0);

    const netProfit = netRevenue - fixedCosts - variableCosts;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return { grossRevenue, taxes, netRevenue, fixedCosts, variableCosts, netProfit, profitMargin };
  };

  const dre = getCurrentMonthDRE();

  // --- Project Revenue ---
  // Only show projects if Business Account
  const projectStats = accountType === 'business' ? projects.map(p => {
      return { id: p.id, name: p.name, revenue: p.value };
  }).sort((a,b) => b.revenue - a.revenue) : [];

  // --- Export Functions ---
  const handleExportCSV = () => {
     const headers = "Data,Tipo,Descrição,Categoria,Valor\n";
     const rows = relevantTransactions.map(t => 
        `${t.date.toLocaleDateString()},${t.type},"${t.description}",${t.category},${t.amount}`
     ).join("\n");
     
     const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `relatorio_${accountType}_${currentYear}.csv`);
     document.body.appendChild(link);
     link.click();
     setIsExportModalOpen(false);
  };

  const handlePrint = () => {
      window.print();
      setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center print:hidden">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios Gerenciais</h2>
                <p className="text-slate-500 text-sm">Análise exclusiva da conta {accountType === 'business' ? 'Empresarial' : 'Pessoal'}.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 transition-colors font-bold text-sm"
                >
                    <Download size={16} /> Exportar
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
            
            {/* DRE - Demonstração do Resultado */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 break-inside-avoid">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500" />
                        DRE Gerencial (Este Mês)
                    </h3>
                    <span className="text-xs font-bold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded print:hidden">Automatizado</span>
                </div>

                <div className="space-y-1">
                    <DreRow label="1. Faturamento Bruto" value={dre.grossRevenue} isBold color="text-slate-700 dark:text-white" isVisible={isVisible} />
                    <DreRow label="(-) Impostos s/ Vendas" value={dre.taxes} color="text-red-500" isVisible={isVisible} />
                    <div className="border-b border-slate-100 dark:border-slate-700 my-2"></div>
                    <DreRow label="2. Receita Líquida" value={dre.netRevenue} isBold color="text-slate-700 dark:text-slate-200" isVisible={isVisible} />
                    <DreRow label="(-) Custos Variáveis" value={dre.variableCosts} color="text-red-400" isVisible={isVisible} />
                    <DreRow label="(-) Custos Fixos / Operacionais" value={dre.fixedCosts} color="text-red-400" isVisible={isVisible} />
                    <div className="border-b-2 border-slate-100 dark:border-slate-700 my-2"></div>
                    <div className="flex justify-between items-center py-2 bg-slate-50 dark:bg-slate-900/50 px-3 rounded-lg print:bg-transparent">
                        <span className="font-bold text-slate-800 dark:text-white text-lg">3. Lucro Líquido</span>
                        <div className="text-right">
                             <div className={`text-xl font-bold ${dre.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isVisible ? dre.netProfit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : '••••'}
                             </div>
                             <div className={`text-xs font-bold ${dre.profitMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {dre.profitMargin.toFixed(1)}% Margem
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profitability by Project - Only for Business */}
            {accountType === 'business' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 break-inside-avoid">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                        <Briefcase size={20} className="text-purple-500" />
                        Faturamento por Projeto
                    </h3>
                    
                    {projectStats.length > 0 ? (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {projectStats.map((proj, idx) => (
                                <div key={proj.id} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 text-xs">
                                            #{idx + 1}
                                        </div>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{proj.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase">Receita Total</p>
                                        <p className="font-bold text-emerald-600 text-lg">{isVisible ? `R$ ${proj.revenue.toLocaleString()}` : '••'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <p>Nenhum projeto cadastrado.</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Export Modal */}
        {isExportModalOpen && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Exportar Relatórios</h3>
                        <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-3">
                        <button onClick={handlePrint} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50">
                                <FileText size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-700 dark:text-white">Gerar PDF / Imprimir</p>
                                <p className="text-xs text-slate-500">Visualização de DRE e Gráficos</p>
                            </div>
                        </button>

                        <button onClick={handleExportCSV} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
                                <FileSpreadsheet size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-700 dark:text-white">Baixar Excel (CSV)</p>
                                <p className="text-xs text-slate-500">Dados brutos de transações</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const DreRow = ({ label, value, isBold = false, color = "text-slate-600", isVisible }: any) => (
    <div className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded transition-colors">
        <span className={`text-sm ${isBold ? 'font-bold' : ''} text-slate-600 dark:text-slate-300`}>{label}</span>
        <span className={`text-sm ${isBold ? 'font-bold' : ''} ${color}`}>
            {isVisible ? value.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '••••'}
        </span>
    </div>
);

export default ReportsView;
