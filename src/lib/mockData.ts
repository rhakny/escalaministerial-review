import { Database } from "../integrations/supabase/types";

type Tables = Database['public']['Tables'];

export const MOCK_CHURCHES: Tables['churches']['Row'][] = [
  {
    id: "church-1",
    name: "Igreja Central de Demonstração",
    email: "contato@igrejademo.com",
    address: "Rua do Mock, 123",
    owner_id: "user-1",
    subscription_plan: "premium",
    subscription_end_date: "2030-01-01T00:00:00Z",
    theme_color: "#1e40af",
    trial_start_date: "2024-01-01T00:00:00Z",
    smtp_config: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_MINISTRIES: Tables['ministries']['Row'][] = [
  {
    id: "min-1",
    church_id: "church-1",
    name: "Música / Louvor",
    description: "Ministério responsável pela música e louvor nos cultos.",
    leader_id: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "min-2",
    church_id: "church-1",
    name: "Sonoplastia / Vídeo",
    description: "Equipe técnica de som e imagem.",
    leader_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_MEMBERS: Tables['members']['Row'][] = [
  {
    id: "mem-1",
    church_id: "church-1",
    ministry_id: "min-1",
    name: "João Silva",
    email: "joao@example.com",
    function: "Pianista",
    phone_number: "11999999999",
    observations: "Prefere tocar aos sábados pela manhã.",
    user_id: "user-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-2",
    church_id: "church-1",
    ministry_id: "min-1",
    name: "Maria Oliveira",
    email: "maria@example.com",
    function: "Vocalista",
    phone_number: "11888888888",
    observations: null,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-3",
    church_id: "church-1",
    ministry_id: "min-2",
    name: "Carlos Santos",
    email: "carlos@example.com",
    function: "Técnico de Som",
    phone_number: "11777777777",
    observations: null,
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_SCHEDULE_TEMPLATES: Tables['schedule_templates']['Row'][] = [
  {
    id: "temp-1",
    church_id: "church-1",
    name: "Culto Divino",
    event_type: "Culto Divino",
    event_time: "09:00",
    observations: "Template padrão para culto de sábado.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_SCHEDULES: Tables['schedules']['Row'][] = [
  {
    id: "sch-1",
    church_id: "church-1",
    ministry_id: "min-1",
    title: "Culto de Sábado",
    event_date: new Date().toISOString().split('T')[0],
    event_time: "09:00",
    event_type: "Culto Divino",
    observations: "Escala de música para o próximo sábado.",
    created_by: "user-1",
    email_sent: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_SCHEDULE_ASSIGNMENTS: Tables['schedule_assignments']['Row'][] = [
  {
    id: "as-1",
    schedule_id: "sch-1",
    member_id: "mem-1",
    response_token: "token-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "as-2",
    schedule_id: "sch-1",
    member_id: "mem-2",
    response_token: "token-2",
    created_at: new Date().toISOString(),
  },
];

export const MOCK_SCHEDULE_RESPONSES: Tables['schedule_responses']['Row'][] = [
  {
    id: "res-1",
    schedule_assignment_id: "as-1",
    response_status: "confirmed",
    response_date: new Date().toISOString(),
    notes: "Tudo certo!",
  },
];

export const MOCK_USER = {
  id: "user-1",
  email: "admin@demo.com",
  user_metadata: {
    full_name: "Administrador Demo",
  },
};

export const MOCK_PROFILES: Tables['profiles']['Row'][] = [
  {
    id: "user-1",
    email: "admin@demo.com",
    full_name: "Administrador Demo",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_USER_ROLES: Tables['user_roles']['Row'][] = [
  {
    id: "role-1",
    user_id: "user-1",
    church_id: "church-1",
    ministry_id: null,
    role: "church_admin",
    created_at: new Date().toISOString(),
  },
];
