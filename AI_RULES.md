# Regras do Editor AI e Diretrizes do Projeto (EscalaFé)

Este documento descreve a pilha técnica e as regras específicas para desenvolver e modificar o aplicativo EscalaMinisterial.

## 1. Visão Geral da Pilha de Tecnologia

1.  **Frontend:** React com TypeScript.
2.  **Build Tool:** Vite.
3.  **Roteamento:** React Router DOM (Rotas principais definidas em `src/App.tsx`).
4.  **Estilização:** Tailwind CSS, utilizando um sistema de design personalizado baseado em HSL, conforme definido em `src/index.css`. Todos os designs devem ser responsivos.
5.  **Biblioteca de UI:** shadcn/ui (construída sobre Radix UI).
6.  **Busca de Dados/Estado:** TanStack React Query.
7.  **Backend/Autenticação:** Supabase (`@supabase/supabase-js`) através da integração cliente em `src/integrations/supabase/client.ts`.
8.  **Gerenciamento de Formulários:** React Hook Form, validado usando Zod.
9.  **Notificações:** Sonner (para toasts não-bloqueadores).
10. **Ícones:** Lucide React.

## 2. Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Ferramenta Recomendada | Notas |
| :--- | :--- | :--- |
| **Componentes de UI** | shadcn/ui (de `src/components/ui/`) | Use componentes pré-construídos. Se for necessária customização, crie um novo componente em `src/components/` e aplique a estilização via Tailwind. |
| **Estilização** | Tailwind CSS | **Obrigatório.** Use classes utilitárias e siga rigorosamente as variáveis de cor personalizadas definidas em `src/index.css`. |
| **Roteamento** | React Router DOM | Todas as rotas principais devem ser registradas em `src/App.tsx`. |
| **Autenticação** | `useAuth` hook (`src/hooks/useAuth.tsx`) | Use este hook para todas as ações de sessão e autenticação (cadastro, login, logout). |
| **Interação com Banco de Dados** | Supabase Client | Use o cliente `supabase` exportado de `src/integrations/supabase/client.ts` para todas as operações de backend (CRUD). |
| **Gerenciamento de Formulários** | React Hook Form + Zod | Use React Hook Form para gerenciamento de estado e Zod para validação de esquemas. |
| **Notificações ao Usuário** | Sonner (`toast` de 'sonner') | Use Sonner para feedback geral e não-bloqueador ao usuário. |
| **Ícones** | Lucide React | Use para todos os ícones visuais. |

## 3. Estrutura de Código e Boas Práticas

*   **Organização de Arquivos:** Componentes devem ser colocados em `src/components/` e páginas em `src/pages/`.
*   **Tamanho do Componente:** Priorize componentes pequenos e focados. Crie um novo arquivo para cada novo componente ou hook.
*   **Responsividade:** Toda nova interface de usuário deve ser projetada para ser totalmente responsiva.