import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Shield, User, Trash2 } from 'lucide-react';
import { Workspace, WorkspaceMember, Role } from '../types';
import { workspaceService } from '../services/api';

interface WorkspaceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  currentUserRole: Role;
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ isOpen, onClose, workspace, currentUserRole }) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('viewer');

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  useEffect(() => {
    if (isOpen && workspace) {
      loadMembers();
    }
  }, [isOpen, workspace]);

  const loadMembers = async () => {
    if(!workspace) return;
    setLoading(true);
    try {
      const list = await workspaceService.getMembers(workspace.id);
      setMembers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!workspace || !inviteEmail) return;
    try {
        await workspaceService.inviteMember(workspace.id, inviteEmail, inviteRole);
        setInviteEmail('');
        loadMembers(); // Reload list
    } catch (e) {
        alert("Erro ao convidar usuário.");
    }
  };

  const handleRemove = async (memberId: string) => {
    if(confirm("Remover este membro?")) {
        await workspaceService.removeMember(memberId);
        loadMembers();
    }
  }

  const handleRoleChange = async (memberId: string, newRole: Role) => {
      await workspaceService.updateRole(memberId, newRole);
      loadMembers();
  }

  if (!isOpen || !workspace) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Users size={20} className="text-blue-500" />
             Gerenciar Membros
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="mb-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">{workspace.name}</h3>
                <p className="text-sm text-slate-500">Gerencie quem tem acesso a este espaço.</p>
            </div>

            {canManageMembers && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-8">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Convidar por Email</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                type="email" 
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                                className="w-full pl-9 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                            />
                        </div>
                        <select 
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as Role)}
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-bold"
                        >
                            <option value="viewer">Visualizador</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <button 
                            onClick={handleInvite}
                            className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-blue-700"
                        >
                            Convidar
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {loading ? <p className="text-center text-slate-500">Carregando...</p> : members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <User size={14} className="text-slate-500 dark:text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{member.email}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{member.role === 'owner' ? 'Dono do Espaço' : member.role === 'admin' ? 'Administrador' : 'Visualizador'}</p>
                            </div>
                        </div>

                        {canManageMembers && member.role !== 'owner' && (
                            <div className="flex items-center gap-2">
                                <select 
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                                    className="text-xs bg-slate-100 dark:bg-slate-800 border-none rounded py-1 pl-2 pr-6 cursor-pointer"
                                >
                                    <option value="viewer">Visualizador</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button 
                                    onClick={() => handleRemove(member.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                        {member.role === 'owner' && (
                            <div title="Dono">
                                <Shield size={16} className="text-purple-500" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;