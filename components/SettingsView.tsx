

import React, { useState } from 'react';
import { AppSettings, AccountType } from '../types';
import { Plus, Trash2, Tag as TagIcon, Layers, User, Briefcase, AlertCircle, Settings, Image } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onAddCategory: (name: string) => Promise<void>;
  onRemoveCategory: (id: string) => Promise<void>;
  onAddTag: (label: string) => Promise<void>;
  onRemoveTag: (id: string) => Promise<void>;
  currentAccountType: AccountType;
  canEdit: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onUpdateSettings, 
  onAddCategory,
  onRemoveCategory,
  onAddTag,
  onRemoveTag,
  currentAccountType,
  canEdit
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'tags'>('general');
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  const getCurrentScope = () => currentAccountType === 'business' ? settings.business : settings.personal;

  const handleUpdateName = (value: string) => {
    if(!canEdit) return;
    const updatedScope = { ...getCurrentScope(), name: value };
    onUpdateSettings({
      ...settings,
      [currentAccountType]: updatedScope
    });
  };

  const handleUpdateAvatar = (url: string) => {
    if(!canEdit) return;
    const updatedScope = { ...getCurrentScope(), avatarUrl: url };
    onUpdateSettings({
      ...settings,
      [currentAccountType]: updatedScope
    });
  };

  const handleUpdateWorkingCapitalPercent = (value: number) => {
      if(!canEdit) return;
      const updatedScope = { ...getCurrentScope() };
      updatedScope.cashFlow.workingCapitalPercent = value;
      onUpdateSettings({
          ...settings,
          [currentAccountType]: updatedScope
      });
  }

  const handleAddCat = async () => {
    if (!newCategory.trim() || !canEdit) return;
    await onAddCategory(newCategory);
    setNewCategory('');
  };

  const handleAddTg = async () => {
    if (!newTag.trim() || !canEdit) return;
    await onAddTag(newTag);
    setNewTag('');
  };

  const currentData = getCurrentScope();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[600px] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-700 p-4 space-y-2">
        <div className="mb-6 px-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Configurações</h2>
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${currentAccountType === 'business' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {currentAccountType === 'business' ? <Briefcase size={12} /> : <User size={12} />}
                {currentAccountType === 'business' ? 'Empresarial' : 'Pessoal'}
            </div>
            {!canEdit && <p className="text-xs text-red-500 font-bold mt-2">Apenas Leitura</p>}
        </div>
        
        <button 
          onClick={() => setActiveTab('general')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Settings size={18} /> Geral
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Layers size={18} /> Categorias
        </button>
        <button 
          onClick={() => setActiveTab('tags')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'tags' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <TagIcon size={18} /> Tags
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        
        {activeTab === 'general' && (
          <div className="max-w-xl space-y-8">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Perfil e Identidade</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                        {currentAccountType === 'business' ? 'Nome da Empresa' : 'Nome Pessoal'}
                    </label>
                    <input 
                        type="text"
                        value={currentData.name}
                        onChange={(e) => handleUpdateName(e.target.value)}
                        disabled={!canEdit}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  {currentAccountType === 'business' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                          Logo da Empresa (URL)
                      </label>
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Image className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                          <input 
                              type="text"
                              value={currentData.avatarUrl || ''}
                              onChange={(e) => handleUpdateAvatar(e.target.value)}
                              disabled={!canEdit}
                              placeholder="https://sua-empresa.com/logo.png"
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </div>
                        {currentData.avatarUrl && (
                          <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white shrink-0">
                             <img src={currentData.avatarUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
            </div>

            {currentAccountType === 'business' && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Regra de Capital de Giro</h3>
                    <p className="text-sm text-slate-500 mb-6">Defina qual porcentagem dos seus Custos Fixos deve ser reservada automaticamente como Capital de Giro.</p>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 dark:text-white">Alocação Automática</span>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm">
                                {currentData.cashFlow.workingCapitalPercent || 50}%
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            step="5"
                            value={currentData.cashFlow.workingCapitalPercent || 50}
                            disabled={!canEdit}
                            onChange={(e) => handleUpdateWorkingCapitalPercent(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                        />
                    </div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-xl space-y-6">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white">Categorias</h3>
             
             {canEdit && (
                <div className="flex gap-2">
                <input 
                    type="text"
                    placeholder="Nova categoria..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleAddCat} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                </button>
                </div>
             )}

             <div className="space-y-2">
               {currentData.categories.map(cat => (
                 <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700">
                   <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                   {canEdit && (
                    <button onClick={() => onRemoveCategory(cat.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                    </button>
                   )}
                 </div>
               ))}
               {currentData.categories.length === 0 && (
                 <p className="text-slate-400 italic text-sm">Nenhuma categoria cadastrada.</p>
               )}
             </div>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="max-w-xl space-y-6">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tags</h3>
             
             {canEdit && (
                <div className="flex gap-2">
                <input 
                    type="text"
                    placeholder="Nova tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleAddTg} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    <Plus size={20} />
                </button>
                </div>
             )}

             <div className="flex flex-wrap gap-2">
               {currentData.tags.map(tag => (
                 <div key={tag.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold group border border-blue-100 dark:border-blue-800">
                   <span>#{tag.label}</span>
                   {canEdit && (
                    <button onClick={() => onRemoveTag(tag.id)} className="hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                    </button>
                   )}
                 </div>
               ))}
               {currentData.tags.length === 0 && (
                 <p className="text-slate-400 italic text-sm">Nenhuma tag cadastrada.</p>
               )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;