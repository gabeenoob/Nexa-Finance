

import React, { useState } from 'react';
import { Project, Client, Transaction } from '../types';
import { 
  Users, FolderKanban, Plus, Trash2, Edit2, Phone, Mail, FileText, Calendar, Wallet, X, CheckCircle2
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  transactions: Transaction[]; 
  
  onCreateProject: (p: Omit<Project, 'id'>) => Promise<Project | undefined>; 
  onUpdateProject: (id: string, p: Partial<Project>) => Promise<void>;
  onCreateClient: (c: Omit<Client, 'id'>) => Promise<void>;
  onUpdateClient: (id: string, c: Partial<Client>) => Promise<void>;

  onDeleteProject: (id: string) => void;
  onDeleteClient: (id: string) => void;
  isVisible: boolean;
  canEdit: boolean;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  projects, 
  clients, 
  transactions,
  onCreateProject,
  onUpdateProject,
  onCreateClient,
  onUpdateClient,
  onDeleteProject,
  onDeleteClient,
  isVisible,
  canEdit
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'clients'>('projects');
  
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', phone: '', document: '', email: '' });
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ 
    name: '', clientId: '', value: '', description: '', startDate: '', deadline: '' 
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleOpenClientModal = (client?: Client) => {
    if (!canEdit) return;
    if (client) {
      setEditingClient(client);
      setClientForm({ name: client.name, phone: client.phone, document: client.document, email: client.email || '' });
    } else {
      setEditingClient(null);
      setClientForm({ name: '', phone: '', document: '', email: '' });
    }
    setIsClientModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!clientForm.name) return;
    if (editingClient) {
      await onUpdateClient(editingClient.id, clientForm);
    } else {
      await onCreateClient(clientForm);
    }
    setIsClientModalOpen(false);
  };

  const handleOpenProjectModal = (project?: Project) => {
    if (!canEdit) return;
    if (project) {
      setEditingProject(project);
      const dateString = project.startDate.toLocaleDateString('en-CA'); 
      const deadlineString = project.deadline ? project.deadline.toLocaleDateString('en-CA') : '';
      setProjectForm({ 
        name: project.name, 
        clientId: project.clientId, 
        value: project.value.toString(), 
        description: project.description || '',
        startDate: dateString,
        deadline: deadlineString
      });
    } else {
      setEditingProject(null);
      setProjectForm({ 
        name: '', clientId: '', value: '', description: '', startDate: new Date().toLocaleDateString('en-CA'), deadline: ''
      });
    }
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.name || !projectForm.clientId) return;
    
    const projectVal = parseFloat(projectForm.value) || 0;
    
    const [year, month, day] = projectForm.startDate.split('-').map(Number);
    const paymentDate = new Date(year, month - 1, day, 12, 0, 0); 

    let deadlineDate: Date | undefined;
    if (projectForm.deadline) {
        const [dYear, dMonth, dDay] = projectForm.deadline.split('-').map(Number);
        deadlineDate = new Date(dYear, dMonth - 1, dDay, 12, 0, 0);
    }

    const projectData = {
        name: projectForm.name,
        clientId: projectForm.clientId,
        value: projectVal,
        description: projectForm.description,
        startDate: paymentDate,
        deadline: deadlineDate
    };

    if (editingProject) {
        await onUpdateProject(editingProject.id, projectData);
    } else {
        await onCreateProject(projectData);
    }
    setIsProjectModalOpen(false);
  };

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Cliente Removido';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
         <div className="flex gap-1">
            <button 
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'projects' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
            >
                <FolderKanban size={18} /> Projetos
            </button>
            <button 
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'clients' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
            >
                <Users size={18} /> Clientes
            </button>
         </div>
         
         {canEdit && (
            <button 
                onClick={() => activeTab === 'projects' ? handleOpenProjectModal() : handleOpenClientModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
                <Plus size={18} /> {activeTab === 'projects' ? 'Novo Projeto' : 'Novo Cliente'}
            </button>
         )}
      </div>

      {/* --- PROJECTS TAB --- */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(project => {
                return (
                    <div key={project.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-0 overflow-hidden group hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                             <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1 flex-1 pr-2" title={project.name}>{project.name}</h3>
                                {canEdit && (
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => handleOpenProjectModal(project)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDeleteProject(project.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                             </div>
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                                <Users size={12} className="text-slate-400" /> 
                                {getClientName(project.clientId)}
                             </p>
                        </div>

                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor do Contrato</p>
                                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <Wallet size={20} className="text-emerald-500/50" />
                                        {isVisible ? `R$ ${project.value.toLocaleString('pt-BR', { compactDisplay: 'short', notation: 'compact' })}` : '••••'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-1.5 rounded-md">
                                    <Calendar size={12} /> {project.startDate.toLocaleDateString('pt-BR')}
                                </div>
                                {project.deadline && (
                                    <div className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded-md border border-red-100 dark:border-red-900/30">
                                        Prazo: {project.deadline.toLocaleDateString('pt-BR')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {canEdit && (
                <button 
                    onClick={() => handleOpenProjectModal()}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all min-h-[250px] group"
                >
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                        <Plus size={32} />
                    </div>
                    <span className="font-bold group-hover:scale-105 transition-transform">Novo Projeto</span>
                </button>
            )}
        </div>
      )}

      {/* --- CLIENTS TAB --- */}
      {activeTab === 'clients' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <table className="w-full text-left">
                 <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 font-bold uppercase">
                     <tr>
                         <th className="p-4">Nome</th>
                         <th className="p-4">Contato</th>
                         <th className="p-4">Documento</th>
                         {canEdit && <th className="p-4 text-center">Ações</th>}
                     </tr>
                 </thead>
                 <tbody className="text-sm">
                     {clients.map(client => (
                         <tr key={client.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                             <td className="p-4 font-bold text-slate-700 dark:text-white">{client.name}</td>
                             <td className="p-4">
                                 <div className="flex flex-col gap-1 text-slate-500">
                                     <span className="flex items-center gap-1"><Phone size={12}/> {client.phone}</span>
                                     {client.email && <span className="flex items-center gap-1"><Mail size={12}/> {client.email}</span>}
                                 </div>
                             </td>
                             <td className="p-4 text-slate-500 flex items-center gap-2">
                                 <FileText size={14} /> {client.document}
                             </td>
                             {canEdit && (
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpenClientModal(client)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16} /></button>
                                        <button onClick={() => onDeleteClient(client.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                             )}
                         </tr>
                     ))}
                     {clients.length === 0 && (
                         <tr><td colSpan={canEdit ? 4 : 3} className="p-12 text-center text-slate-400">Nenhum cliente cadastrado.</td></tr>
                     )}
                 </tbody>
             </table>
          </div>
      )}

      {/* Modals are conditionally rendered based on canEdit check inside handler functions or here */}
      {isClientModalOpen && canEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
               <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                    <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
               </div>
               
               <div className="p-6 space-y-4">
                   <div className="group relative">
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome Completo</label>
                       <input value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Ex: Empresa Ltda" />
                   </div>
                   {/* Rest of inputs... */}
                   <div className="group relative">
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Telefone</label>
                       <input value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="(00) 00000-0000" />
                   </div>
                   <div className="group relative">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Documento (CPF/CNPJ)</label>
                       <input value={clientForm.document} onChange={e => setClientForm({...clientForm, document: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="000.000.000-00" />
                   </div>
                   <div className="group relative">
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                       <input value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="contato@empresa.com" />
                   </div>
               </div>

               <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-3">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancelar</button>
                   <button onClick={handleSaveClient} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all">Salvar Cliente</button>
               </div>
           </div>
        </div>
      )}

      {isProjectModalOpen && canEdit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               {/* Header */}
               <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                   <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                   </h2>
                   <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                   </button>
               </div>
               
               {/* Content - Scrollable */}
               <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome do Projeto</label>
                       <input 
                           value={projectForm.name} 
                           onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                           className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-400"
                           placeholder="Ex: E-commerce Loja X" 
                           autoFocus={!editingProject}
                       />
                   </div>
                   
                   <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Valor do Contrato</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input 
                                type="number" 
                                value={projectForm.value} 
                                onChange={e => setProjectForm({...projectForm, value: e.target.value})} 
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-500 rounded-xl pl-12 pr-4 py-4 text-2xl font-bold text-slate-800 dark:text-white outline-none transition-all placeholder:text-slate-300"
                                placeholder="0.00" 
                            />
                        </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cliente Vinculado</label>
                       <div className="relative">
                           <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                           <select 
                               value={projectForm.clientId} 
                               onChange={e => setProjectForm({...projectForm, clientId: e.target.value})} 
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium cursor-pointer"
                           >
                               <option value="" disabled>Selecione um cliente...</option>
                               {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                           </select>
                       </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data Início</label>
                            <input 
                                type="date" 
                                value={projectForm.startDate} 
                                onChange={e => setProjectForm({...projectForm, startDate: e.target.value})} 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                       </div>
                       <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Prazo (Opcional)</label>
                            <input 
                                type="date" 
                                value={projectForm.deadline} 
                                onChange={e => setProjectForm({...projectForm, deadline: e.target.value})} 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            />
                       </div>
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Descrição</label>
                       <textarea 
                            value={projectForm.description} 
                            onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                            rows={3} 
                            placeholder="Detalhes adicionais do escopo..." 
                        />
                   </div>
               </div>
               
               <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3">
                   <button 
                        onClick={() => setIsProjectModalOpen(false)} 
                        className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl transition-all"
                   >
                        Cancelar
                   </button>
                   <button 
                        onClick={handleSaveProject} 
                        className="flex-[2] bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                   >
                       <CheckCircle2 size={18} />
                       {editingProject ? 'Salvar Alterações' : 'Confirmar Projeto'}
                   </button>
               </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsView;