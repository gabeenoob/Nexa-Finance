

import React, { useState, useEffect } from 'react';
import { WorkspaceMember, Role } from '../types';
import { X, UserPlus, Shield, Trash2, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { workspaceService } from '../services/api';

interface WorkspaceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
  workspaceName: string;
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ 
  isOpen, onClose, workspaceId, currentUserId, isAdmin, workspaceName 
}) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workspaceId) {
      loadMembers();
    }
  }, [isOpen, workspaceId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.getMembers(workspaceId);
      // Ensure data is array, default to empty if null/undefined
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError('Erro ao carregar membros.');
      setMembers([]); // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setError(null);
    setSuccess(null);
    try {
      await workspaceService.inviteMember(workspaceId, inviteEmail, inviteRole);
      setSuccess(`Convite enviado para ${inviteEmail}`);
      setInviteEmail('');
      loadMembers();
    } catch (err: any) {
      setError(err.message || 'Falha ao convidar.');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;
    try {
      await workspaceService.removeMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
      try {
          await workspaceService.updateMemberRole(memberId, newRole);
          setMembers(prev => prev.map(m => m.id === memberId ? {...m, role: newRole} : m));
      } catch (err) {
          console.error(err);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar Membros</h2>
                <p className="text-sm text-slate-500">Espaço: <span className="font-bold">{workspaceName}</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Invite Form */}
            {isAdmin && workspaceId !== 'legacy' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700 mb-8">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                        <UserPlus size={16} className="text-blue-500" /> Convidar Novo Membro
                    </h3>
                    
                    {error && (
                        <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-bold rounded-lg flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                    {success && (
                         <div className="mb-3 p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xs font-bold rounded-lg flex items-center gap-2">
                            <CheckCircle size={14} /> {success}
                        </div>
                    )}

                    <form onSubmit={handleInvite} className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="email" 
                                required
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="Email do usuário..."
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select 
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as Role)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="viewer">Visualizador</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
                            Convidar
                        </button>
                    </form>
                </div>
            )}
            
            {workspaceId === 'legacy' && (
                <div className="p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={16} />
                    Funcionalidade de membros indisponível no Modo Legado.
                </div>
            )}

            {/* Member List */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Membros Ativos ({members.length})</h3>
                <div className="space-y-3">
                    {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${member.role === 'owner' ? 'bg-indigo-500' : member.role === 'admin' ? 'bg-blue-500' : 'bg-slate-400'}`}>
                                    {member.role.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{member.email}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Shield size={10} className={member.role === 'owner' ? 'text-indigo-500' : member.role === 'admin' ? 'text-blue-500' : 'text-slate-400'} />
                                        <span className="text-xs text-slate-500 capitalize">
                                            {member.role === 'owner' ? 'Dono do Espaço' : member.role === 'admin' ? 'Administrador' : 'Visualizador'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions (Only Admin/Owner can edit, Owner cannot be edited) */}
                            {isAdmin && member.role !== 'owner' && member.userId !== currentUserId && (
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                                        className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none"
                                    >
                                        <option value="viewer">Visualizador</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button 
                                        onClick={() => handleRemove(member.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remover acesso"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                             {member.userId === currentUserId && (
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded">Você</span>
                            )}
                        </div>
                    ))}
                    {members.length === 0 && !loading && (
                        <p className="text-slate-400 text-sm italic">Nenhum membro encontrado.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
