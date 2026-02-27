import { supabase } from './supabase'

export type Project = {
  id: string
  user_id: string
  name: string
  city: string | null
  notes: string | null
  status: string | null
  created_at: string
}

export type ProjectRun = {
  id: string
  project_id: string
  status: 'queued' | 'running' | 'done' | 'error'
  progress: number | null
  logs: string | null
  result_json: any | null
  created_at: string
}

// Ajusta aqui se tuas tabelas tiverem nomes diferentes
const TABLE_PROJECTS = 'projects'
const TABLE_RUNS = 'project_runs'

export async function getMyProjects(): Promise<Project[]> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from(TABLE_PROJECTS)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Project[]
}

export async function createProject(input: { name: string; city?: string; notes?: string }) {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Usuário não autenticado.')

  const payload = {
    user_id: user.id,
    name: input.name.trim(),
    city: input.city?.trim() ?? null,
    notes: input.notes?.trim() ?? null,
    status: 'draft'
  }

  const { data, error } = await supabase.from(TABLE_PROJECTS).insert(payload).select('*').single()
  if (error) throw error
  return data as Project
}

export async function startProjectRun(projectId: string) {
  const webhook = import.meta.env.VITE_N8N_RUN_WEBHOOK as string | undefined
  if (!webhook) throw new Error('ENV faltando: VITE_N8N_RUN_WEBHOOK')

  // Cria um run no banco pra acompanhar (opcional, mas ajuda MUITO)
  const { data: run, error: runErr } = await supabase
    .from(TABLE_RUNS)
    .insert({ project_id: projectId, status: 'queued', progress: 0 })
    .select('*')
    .single()

  if (runErr) throw runErr

  // Dispara no n8n com projectId + runId (pra ele atualizar o mesmo run)
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, runId: (run as any).id })
  })

  if (!res.ok) {
    // marca o run como error se o webhook falhar
    await supabase.from(TABLE_RUNS).update({ status: 'error', logs: `Webhook falhou: ${res.status}` }).eq('id', (run as any).id)
    throw new Error(`Webhook falhou: ${res.status}`)
  }

  return run as ProjectRun
}

export async function getLatestRun(projectId: string): Promise<ProjectRun | null> {
  const { data, error } = await supabase
    .from(TABLE_RUNS)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data?.[0] as ProjectRun) ?? null
}
