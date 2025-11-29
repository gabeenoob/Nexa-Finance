

import { supabase } from '../lib/supabase';
import { Transaction, Client, Project, Category, Tag, AccountType, FixedCostTemplate, Workspace, WorkspaceMember, Role } from '../types';

// --- UTILITÁRIOS DE LIMPEZA DE DADOS ---

const sanitizePayload = (payload: any) => {
  const cleaned: any = {};
  
  Object.keys(payload).forEach(key => {
    let value = payload[key];

    // Se for string vazia em campos de ID, vira null
    if ((key.endsWith('_id') || key === 'clientId' || key === 'projectId') && value === '') {
      value = null;
    }

    // Se for número vazio ou indefinido, vira 0
    if ((key === 'amount' || key === 'value') && (value === '' || value === undefined)) {
      value = 0;
    }

    // Mantém o valor se não for undefined (null é permitido e importante!)
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

const handleError = (error: any, context: string) => {
  console.error(`[API ERROR] ${context}:`, error);
  
  // Tratamento específico para tabelas ou colunas inexistentes (Banco desatualizado)
  if (
    error.message?.includes('schema cache') || 
    error.code === 'PGRST204' || // Coluna não encontrada
    error.code === 'PGRST205' || // Tabela não encontrada
    error.code === '42P01'       // Undefined table (Postgres)
  ) {
    return null; // Retorna null para sinalizar fallback
  }

  if (error.code === '42703') { 
    console.warn("Erro de coluna ignorado (fallback):", error.message);
    return null;
  }
  
  if (error.code === '42501') { 
    throw new Error('Permissão negada. Você não tem permissão para realizar esta ação neste espaço.');
  }
  if (error.code === '23503') {
    throw new Error('Não é possível apagar este item pois ele está vinculado a outros registros (Erro de Integridade).');
  }
  if (error.code === '22P02') {
    throw new Error('Dados inválidos (UUID incorreto).');
  }
  
  throw new Error(error.message || 'Erro desconhecido na API.');
};

// --- WORKSPACES SERVICE (NEW) ---

export const workspaceService = {
  // Lista todos os workspaces que o usuário é membro ou dono
  async listByUser(userId: string, email: string) {
    // Busca workspaces onde sou dono OU onde estou na lista de membros
    
    // 1. Workspaces que sou dono
    let owned: any[] = [];
    try {
        const { data, error: ownerError } = await supabase
            .from('workspaces')
            .select('*')
            .eq('owner_id', userId);

        if (ownerError) {
             const handled = handleError(ownerError, 'listOwnedWorkspaces');
             // Se handleError retornou null (erro de tabela), assumimos vazio
             owned = [];
        } else {
             owned = data || [];
        }
    } catch (e) {
        owned = [];
    }

    // 2. Workspaces que sou membro
    let memberOf: any[] = [];
    try {
        const { data, error: memberError } = await supabase
            .from('workspace_members')
            .select('workspace_id, role, workspaces(*)')
            .eq('email', email); 
        
        if (memberError) {
             const handled = handleError(memberError, 'listMemberWorkspaces');
             memberOf = [];
        } else {
             memberOf = data || [];
        }
    } catch (e) {
        memberOf = [];
    }

    // Combinar e dedublicar
    const workspaces: (Workspace & { role: Role })[] = [];
    const ids = new Set();

    // Adiciona Owned (Role = Owner)
    owned.forEach((w: any) => {
        if (!ids.has(w.id)) {
            workspaces.push({
                id: w.id,
                name: w.name,
                type: w.type || 'personal',
                ownerId: w.owner_id,
                role: 'owner'
            });
            ids.add(w.id);
        }
    });

    // Adiciona MemberOf
    memberOf.forEach((m: any) => {
        const w = m.workspaces;
        if (w && !ids.has(w.id)) {
            workspaces.push({
                id: w.id,
                name: w.name,
                type: w.type || 'business',
                ownerId: w.owner_id,
                role: m.role as Role
            });
            ids.add(w.id);
        }
    });

    return workspaces;
  },

  async create(userId: string, name: string, type: AccountType) {
    // Cria o workspace
    const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert([{ owner_id: userId, name, type }])
        .select()
        .single();
    
    if (error) {
        handleError(error, 'createWorkspace');
        throw new Error("Falha ao criar workspace (Legacy Mode?)");
    }

    // Semeia dados padrão para este novo workspace
    await seedDatabase(userId, workspace.id, type);

    return workspace as Workspace;
  },

  async getMembers(workspaceId: string) {
    if (workspaceId === 'legacy') return [];

    const { data, error } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);
    
    if (error) {
        handleError(error, 'getWorkspaceMembers');
        return [];
    }
    return (data || []) as WorkspaceMember[];
  },

  async inviteMember(workspaceId: string, email: string, role: Role) {
    if (workspaceId === 'legacy') throw new Error("Não é possível convidar membros no modo legado.");

    // Verifica se já existe
    const { data: existing } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('email', email)
        .single();
    
    if (existing) throw new Error('Este usuário já é membro do espaço.');

    const { data, error } = await supabase
        .from('workspace_members')
        .insert([{ workspace_id: workspaceId, email, role }])
        .select()
        .single();
    
    if (error) handleError(error, 'inviteMember');
    return data;
  },

  async removeMember(memberId: string) {
    const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
    if (error) handleError(error, 'removeMember');
  },

  async updateMemberRole(memberId: string, newRole: Role) {
    const { error } = await supabase.from('workspace_members').update({ role: newRole }).eq('id', memberId);
    if (error) handleError(error, 'updateMemberRole');
  }
};


// --- SEED DATABASE ---

export const seedDatabase = async (userId: string, workspaceId: string, type: AccountType) => {
  try {
    if (workspaceId === 'legacy') return; // Do not seed in legacy mode

    // Define categorias baseadas no tipo de workspace
    let defaultCategories = [];
    let defaultTags = [];

    const cleanWorkspaceId = workspaceId === 'legacy' ? undefined : workspaceId;

    if (type === 'personal') {
         defaultCategories = [
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Moradia', type: 'expense', scope: 'personal' },
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Alimentação', type: 'expense', scope: 'personal' },
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Lazer', type: 'expense', scope: 'personal' },
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Investimento', type: 'expense', scope: 'personal' },
        ];
        defaultTags = [
            { workspace_id: cleanWorkspaceId, user_id: userId, label: 'Urgente', color: 'red', scope: 'personal' },
            { workspace_id: cleanWorkspaceId, user_id: userId, label: 'Pago', color: 'green', scope: 'personal' }
        ];
    } else {
        defaultCategories = [
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Vendas', type: 'income', scope: 'business' },
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Projetos', type: 'income', scope: 'business' },
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Custos Fixos', type: 'expense', scope: 'business' },
            { workspace_id: cleanWorkspaceId, user_id: userId, name: 'Operacional', type: 'expense', scope: 'business' }
        ];
        defaultTags = [
            { workspace_id: cleanWorkspaceId, user_id: userId, label: 'Urgente', color: 'red', scope: 'business' },
            { workspace_id: cleanWorkspaceId, user_id: userId, label: 'Recorrente', color: 'blue', scope: 'business' },
            { workspace_id: cleanWorkspaceId, user_id: userId, label: 'Pago', color: 'green', scope: 'business' }
        ];
    }

    // Inserção direta (simplificada para novos workspaces)
    if (defaultCategories.length > 0) {
        await supabase.from('categories').insert(defaultCategories);
    }
    if (defaultTags.length > 0) {
        await supabase.from('tags').insert(defaultTags);
    }

  } catch (e) {
    console.warn("Erro ao semear banco:", e);
  }
};

// --- TRANSACTIONS ---
export const transactionService = {
  async fetchAll(userId: string, workspaceId: string) {
    let query = supabase.from('transactions').select('*');
    if (workspaceId === 'legacy') {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('workspace_id', workspaceId);
    }
    
    const { data, error } = await query;
    if (error) {
        handleError(error, 'fetchAllTransactions');
        return [];
    }
    
    return (data || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount || 0),
      description: t.description,
      date: new Date(t.date),
      category: t.category,
      tags: Array.isArray(t.tags) ? t.tags : [],
      accountId: t.account_id || 'personal',
      workspaceId: t.workspace_id,
      location: t.location,
      projectId: t.project_id
    })) as Transaction[];
  },

  async fetchByProjectId(projectId: string) {
    const { data, error } = await supabase.from('transactions').select('*').eq('project_id', projectId).maybeSingle();
    
    if (error) {
        // Silently fail if legacy or column missing
        return null;
    }
    
    if (!data) return null;

    return {
      id: data.id,
      type: data.type,
      amount: Number(data.amount || 0),
      description: data.description,
      date: new Date(data.date),
      category: data.category,
      tags: Array.isArray(data.tags) ? data.tags : [],
      accountId: data.account_id || 'personal',
      workspaceId: data.workspace_id,
      location: data.location,
      projectId: data.project_id
    } as Transaction;
  },

  async create(userId: string, tx: Omit<Transaction, 'id'>) {
    // IMPORTANT: If workspaceId is legacy, pass UNDEFINED so sanitizePayload removes it.
    // Passing null will cause error if column doesn't exist.
    const wsId = tx.workspaceId === 'legacy' ? undefined : tx.workspaceId;

    const payload = sanitizePayload({
      user_id: userId, 
      workspace_id: wsId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date.toISOString(),
      category: tx.category,
      tags: tx.tags,
      account_id: tx.accountId,
      location: tx.location,
      project_id: tx.projectId || null 
    });

    const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
    if (error) handleError(error, 'createTransaction');
    
    return { 
      ...tx, 
      id: data.id, 
      amount: Number(data.amount), 
      date: new Date(data.date),
      projectId: data.project_id
    } as Transaction;
  },

  async update(id: string, tx: Partial<Transaction>) {
    const rawPayload: any = {
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date?.toISOString(),
      category: tx.category,
      tags: tx.tags,
      account_id: tx.accountId,
    };

    if (tx.projectId !== undefined) {
      rawPayload.project_id = tx.projectId || null;
    }

    const payload = sanitizePayload(rawPayload);

    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select().single();
    if (error) handleError(error, 'updateTransaction');
    
    return { 
      ...tx, 
      id: data.id, 
      amount: Number(data.amount), 
      date: new Date(data.date),
      projectId: data.project_id 
    } as Transaction;
  },

  async delete(id: string) {
    const { error, count } = await supabase.from('transactions').delete({ count: 'exact' }).eq('id', id);
    if (error) {
        handleError(error, 'deleteTransaction');
        return false;
    }
    if (count === 0) throw new Error("Falha ao apagar: A transação não foi encontrada ou você não tem permissão.");
    return true; 
  }
};

// --- CLIENTS ---
export const clientService = {
  async fetchAll(userId: string, workspaceId: string) {
    let query = supabase.from('clients').select('*');
    if (workspaceId === 'legacy') {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query;
    if (error) {
        handleError(error, 'fetchAllClients');
        return [];
    }
    return (data || []) as Client[];
  },

  async create(userId: string, workspaceId: string, client: Omit<Client, 'id'>) {
    const wsId = workspaceId === 'legacy' ? undefined : workspaceId;
    const payload = sanitizePayload({ 
        ...client, 
        user_id: userId, 
        workspace_id: wsId 
    });
    const { data, error } = await supabase.from('clients').insert([payload]).select().single();
    if (error) handleError(error, 'createClient');
    return data as Client;
  },

  async update(id: string, client: Partial<Client>) {
    const payload = sanitizePayload(client);
    const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select().single();
    if (error) handleError(error, 'updateClient');
    return data as Client;
  },

  async delete(id: string) {
    const { error, count } = await supabase.from('clients').delete({ count: 'exact' }).eq('id', id);
    if (error) return handleError(error, 'deleteClient');
    if (count === 0) throw new Error("Cliente não encontrado para exclusão.");
    return true;
  }
};

// --- PROJECTS ---
export const projectService = {
  async fetchAll(userId: string, workspaceId: string) {
    let query = supabase.from('projects').select('*');
    if (workspaceId === 'legacy') {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query;
    if (error) {
        handleError(error, 'fetchAllProjects');
        return [];
    }
    
    return (data || []).map((p: any) => ({
      ...p,
      clientId: p.client_id,
      startDate: new Date(p.start_date),
      deadline: p.deadline ? new Date(p.deadline) : undefined,
      value: Number(p.value),
    })) as Project[];
  },

  async create(userId: string, workspaceId: string, project: Omit<Project, 'id'>) {
    const wsId = workspaceId === 'legacy' ? undefined : workspaceId;
    const payload = sanitizePayload({
      user_id: userId,
      workspace_id: wsId,
      name: project.name,
      client_id: project.clientId || null,
      value: project.value,
      description: project.description,
      start_date: project.startDate.toISOString(),
      deadline: project.deadline?.toISOString() || null
    });

    const { data, error } = await supabase.from('projects').insert([payload]).select().single();
    if (error) handleError(error, 'createProject');

    return {
      ...data,
      clientId: data.client_id,
      startDate: new Date(data.start_date),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      value: Number(data.value),
    } as Project;
  },

  async update(id: string, project: Partial<Project>) {
    const rawPayload: any = {
      name: project.name,
      value: project.value,
      description: project.description,
      start_date: project.startDate?.toISOString(),
      deadline: project.deadline?.toISOString() || null
    };

    if (project.clientId !== undefined) {
      rawPayload.client_id = project.clientId || null;
    }

    const payload = sanitizePayload(rawPayload);

    const { data, error } = await supabase.from('projects').update(payload).eq('id', id).select().single();
    if (error) handleError(error, 'updateProject');
    
    return {
      ...data,
      clientId: data.client_id,
      startDate: new Date(data.start_date),
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      value: Number(data.value),
    } as Project;
  },

  async delete(id: string) {
    const { error, count } = await supabase.from('projects').delete({ count: 'exact' }).eq('id', id);
    if (error) return handleError(error, 'deleteProject');
    if (count === 0) throw new Error("Projeto não encontrado ou bloqueado.");
    return true;
  }
};

// --- CATEGORIES & TAGS & COSTS ---
export const categoryService = {
  async fetchAll(userId: string, workspaceId: string) {
    let query = supabase.from('categories').select('*');
    if (workspaceId === 'legacy') {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query;
    if (error) {
        handleError(error, 'fetchAllCategories');
        return [];
    }
    
    return (data || []) as (Category & { scope: string })[];
  },
  async create(userId: string, workspaceId: string, cat: Category, scope: AccountType) {
    const wsId = workspaceId === 'legacy' ? undefined : workspaceId;
    const payload = sanitizePayload({ 
        user_id: userId, 
        workspace_id: wsId, 
        name: cat.name, 
        type: cat.type, 
        scope 
    });
    const { data, error } = await supabase.from('categories').insert([payload]).select().single();
    if (error) handleError(error, 'createCategory');
    return data;
  },
  async delete(id: string) {
    const { error, count } = await supabase.from('categories').delete({ count: 'exact' }).eq('id', id);
    if (error) return handleError(error, 'deleteCategory');
    if (count === 0) throw new Error("Erro ao apagar categoria.");
    return true;
  }
};

export const tagService = {
  async fetchAll(userId: string, workspaceId: string) {
    let query = supabase.from('tags').select('*');
    if (workspaceId === 'legacy') {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query;
    if (error) {
        handleError(error, 'fetchAllTags');
        return [];
    }

    return (data || []) as (Tag & { scope: string })[];
  },
  async create(userId: string, workspaceId: string, tag: Tag, scope: AccountType) {
    const wsId = workspaceId === 'legacy' ? undefined : workspaceId;
    const payload = sanitizePayload({ 
        user_id: userId, 
        workspace_id: wsId, 
        label: tag.label, 
        color: tag.color, 
        scope 
    });
    const { data, error } = await supabase.from('tags').insert([payload]).select().single();
    if (error) handleError(error, 'createTag');
    return data;
  },
  async delete(id: string) {
    const { error, count } = await supabase.from('tags').delete({ count: 'exact' }).eq('id', id);
    if (error) return handleError(error, 'deleteTag');
    if (count === 0) throw new Error("Erro ao apagar tag.");
    return true;
  }
};

export const fixedCostService = {
  async fetchAll(userId: string, workspaceId: string) {
    let query = supabase.from('fixed_costs').select('*');
    if (workspaceId === 'legacy') {
        query = query.eq('user_id', userId);
    } else {
        query = query.eq('workspace_id', workspaceId);
    }
    const { data, error } = await query;
    if (error) { console.warn("Fixed costs error/missing", error); return []; }
    return (data || []).map((d: any) => ({
      id: d.id, 
      name: d.name, 
      defaultAmount: Number(d.value), 
      dayOfMonth: d.due_day || 1
    }));
  },
  async create(userId: string, workspaceId: string, cost: FixedCostTemplate) {
    const wsId = workspaceId === 'legacy' ? undefined : workspaceId;
    const payload = sanitizePayload({ 
        user_id: userId, 
        workspace_id: wsId, 
        name: cost.name, 
        value: cost.defaultAmount, 
        due_day: cost.dayOfMonth 
    });
    const { data, error } = await supabase.from('fixed_costs').insert([payload]).select().single();
    if (error) handleError(error, 'createFixedCost');
    return { id: data.id, name: data.name, defaultAmount: Number(data.value), dayOfMonth: data.due_day };
  },
  async delete(id: string) {
    const { error, count } = await supabase.from('fixed_costs').delete({ count: 'exact' }).eq('id', id);
    if (error) return handleError(error, 'deleteFixedCost');
    if (count === 0) throw new Error("Custo fixo não encontrado.");
    return true;
  }
};
