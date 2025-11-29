
import { supabase } from '../lib/supabase';
import { Transaction, Client, Project, Category, Tag, AccountType, FixedCostTemplate } from '../types';

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
  
  if (error.message?.includes('schema cache') || error.code === 'PGRST204') {
    throw new Error('ERRO DE CACHE: O banco mudou. Execute "NOTIFY pgrst, \'reload config\';" no SQL Editor.');
  }
  if (error.code === '42703') { 
    console.warn("Erro de coluna ignorado (fallback):", error.message);
    return;
  }
  if (error.code === '42501') { 
    throw new Error('Permissão negada. Verifique se você é o dono deste registro.');
  }
  if (error.code === '23503') {
    throw new Error('Não é possível apagar este item pois ele está vinculado a outros registros (Erro de Integridade).');
  }
  if (error.code === '22P02') {
    throw new Error('Dados inválidos (UUID incorreto).');
  }

  throw new Error(error.message || 'Erro desconhecido na API.');
};

// --- SERVIÇOS ---

export const seedDatabase = async (userId: string) => {
  try {
    // 1. Definir Padrões Exatos
    const defaultCategories = [
        { user_id: userId, name: 'Moradia', type: 'expense', scope: 'personal' },
        { user_id: userId, name: 'Alimentação', type: 'expense', scope: 'personal' },
        { user_id: userId, name: 'Lazer', type: 'expense', scope: 'personal' },
        { user_id: userId, name: 'Investimento', type: 'expense', scope: 'personal' },
        
        { user_id: userId, name: 'Vendas', type: 'income', scope: 'business' },
        { user_id: userId, name: 'Projetos', type: 'income', scope: 'business' },
        { user_id: userId, name: 'Custos Fixos', type: 'expense', scope: 'business' },
        { user_id: userId, name: 'Operacional', type: 'expense', scope: 'business' }
    ];

    const defaultTags = [
        { user_id: userId, label: 'Urgente', color: 'red', scope: 'business' },
        { user_id: userId, label: 'Recorrente', color: 'blue', scope: 'business' },
        { user_id: userId, label: 'Pago', color: 'green', scope: 'business' }
    ];

    // 2. Buscar existentes para evitar duplicatas (Idempotência)
    const { data: existingCats } = await supabase.from('categories').select('name, scope').eq('user_id', userId);
    const { data: existingTags } = await supabase.from('tags').select('label, scope').eq('user_id', userId);

    const existingCatSet = new Set(existingCats?.map(c => `${c.scope}:${c.name}`));
    const existingTagSet = new Set(existingTags?.map(t => `${t.scope}:${t.label}`));

    // 3. Filtrar apenas os que faltam
    const catsToInsert = defaultCategories.filter(c => !existingCatSet.has(`${c.scope}:${c.name}`));
    const tagsToInsert = defaultTags.filter(t => !existingTagSet.has(`${t.scope}:${t.label}`));

    // 4. Inserir em lote seguro
    if (catsToInsert.length > 0) {
        await supabase.from('categories').insert(catsToInsert);
    }
    if (tagsToInsert.length > 0) {
        await supabase.from('tags').insert(tagsToInsert);
    }

  } catch (e) {
    console.warn("Erro ao semear banco:", e);
  }
};

// --- TRANSACTIONS ---
export const transactionService = {
  async fetchAll(userId: string) {
    const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId);
    if (error) handleError(error, 'fetchAllTransactions');
    
    return (data || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount || 0),
      description: t.description,
      date: new Date(t.date),
      category: t.category,
      tags: Array.isArray(t.tags) ? t.tags : [],
      accountId: t.account_id || 'personal',
      location: t.location,
      projectId: t.project_id
    })) as Transaction[];
  },

  // Busca específica para garantir sincronia - USANDO maybeSingle para evitar erros 406
  async fetchByProjectId(projectId: string) {
    const { data, error } = await supabase.from('transactions').select('*').eq('project_id', projectId).maybeSingle();
    
    // maybeSingle retorna null sem erro se não achar, mas retorna erro se tiver mais de um (o que não deve acontecer)
    if (error) {
        console.warn("Erro ao buscar transação por projeto:", error);
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
      location: data.location,
      projectId: data.project_id
    } as Transaction;
  },

  async create(userId: string, tx: Omit<Transaction, 'id'>) {
    const payload = sanitizePayload({
      user_id: userId,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date.toISOString(),
      category: tx.category,
      tags: tx.tags,
      account_id: tx.accountId,
      location: tx.location,
      // Create: Force null if undefined
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
    // Update: Only include foreign key if it's explicitly defined in the update object
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
    if (error) return handleError(error, 'deleteTransaction');
    if (count === 0) throw new Error("Falha ao apagar: A transação não foi encontrada ou você não tem permissão.");
    return true; 
  }
};

// --- CLIENTS ---
export const clientService = {
  async fetchAll(userId: string) {
    const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId);
    if (error) handleError(error, 'fetchAllClients');
    return (data || []) as Client[];
  },

  async create(userId: string, client: Omit<Client, 'id'>) {
    const payload = sanitizePayload({ ...client, user_id: userId });
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
  async fetchAll(userId: string) {
    const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
    if (error) handleError(error, 'fetchAllProjects');
    
    return (data || []).map((p: any) => ({
      ...p,
      clientId: p.client_id,
      startDate: new Date(p.start_date),
      deadline: p.deadline ? new Date(p.deadline) : undefined,
      value: Number(p.value),
      // Cost removed
    })) as Project[];
  },

  async create(userId: string, project: Omit<Project, 'id'>) {
    const payload = sanitizePayload({
      user_id: userId,
      name: project.name,
      client_id: project.clientId || null,
      value: project.value,
      // Cost removed from payload
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
      // Cost removed from update payload
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
  async fetchAll(userId: string) {
    const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId);
    if (error) handleError(error, 'fetchAllCategories');
    
    const rawList = (data || []) as (Category & { scope: string })[];
    
    // Deduplicação Visual (Client-Side Fix para dados já duplicados no banco)
    const seen = new Set();
    const uniqueList = rawList.filter(item => {
        const key = `${item.scope}:${item.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return uniqueList;
  },
  async create(userId: string, cat: Category, scope: AccountType) {
    const payload = sanitizePayload({ user_id: userId, name: cat.name, type: cat.type, scope });
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
  async fetchAll(userId: string) {
    const { data, error } = await supabase.from('tags').select('*').eq('user_id', userId);
    if (error) handleError(error, 'fetchAllTags');

    const rawList = (data || []) as (Tag & { scope: string })[];

    // Deduplicação Visual
    const seen = new Set();
    const uniqueList = rawList.filter(item => {
        const key = `${item.scope}:${item.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    
    return uniqueList;
  },
  async create(userId: string, tag: Tag, scope: AccountType) {
    const payload = sanitizePayload({ user_id: userId, label: tag.label, color: tag.color, scope });
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
  async fetchAll(userId: string) {
    const { data, error } = await supabase.from('fixed_costs').select('*').eq('user_id', userId);
    if (error) { console.warn(error); return []; }
    return (data || []).map((d: any) => ({
      id: d.id, 
      name: d.name, 
      defaultAmount: Number(d.value), 
      dayOfMonth: d.due_day || 1
    }));
  },
  async create(userId: string, cost: FixedCostTemplate) {
    const payload = sanitizePayload({ user_id: userId, name: cost.name, value: cost.defaultAmount, due_day: cost.dayOfMonth });
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
