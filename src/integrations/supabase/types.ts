export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      churches: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          name: string
          owner_id: string
          smtp_config: Json | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          theme_color: string | null
          trial_start_date: string | null
          updated_at: string
          subscription_end_date: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          owner_id: string
          smtp_config?: Json | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          theme_color?: string | null
          trial_start_date?: string | null
          updated_at?: string
          subscription_end_date?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          owner_id?: string
          smtp_config?: Json | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          theme_color?: string | null
          trial_start_date?: string | null
          updated_at?: string
          subscription_end_date?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          token: string
          email: string
          church_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_by: string | null
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          email: string
          church_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_by?: string | null
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          email?: string
          church_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_by?: string | null
          expires_at?: string
          used_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      member_availability: {
        Row: {
          available: boolean
          created_at: string
          date: string
          id: string
          member_id: string
          notes: string | null
        }
        Insert: {
          available: boolean
          created_at?: string
          date: string
          id?: string
          member_id: string
          notes?: string | null
        }
        Update: {
          available?: boolean
          created_at?: string
          date?: string
          id?: string
          member_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_availability_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          church_id: string
          created_at: string
          email: string
          function: string
          id: string
          ministry_id: string
          name: string
          observations: string | null
          updated_at: string
          user_id: string | null
          phone_number: string | null
        }
        Insert: {
          church_id: string
          created_at?: string
          email: string
          function: string
          id?: string
          ministry_id: string
          name: string
          observations?: string | null
          updated_at?: string
          user_id?: string | null
          phone_number?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string
          email?: string
          function?: string
          id?: string
          ministry_id?: string
          name?: string
          observations?: string | null
          updated_at?: string
          user_id?: string | null
          phone_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          church_id: string
          created_at: string
          description: string | null
          id: string
          leader_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministries_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_assignments: {
        Row: {
          created_at: string
          id: string
          member_id: string
          schedule_id: string
          response_token: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          schedule_id: string
          response_token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          schedule_id?: string
          response_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_notification_status: {
        Row: {
          created_at: string
          id: string
          member_id: string
          schedule_id: string
          sent_2h: boolean
          sent_2h_at: string | null
          sent_48h: boolean
          sent_48h_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          schedule_id: string
          sent_2h?: boolean
          sent_2h_at?: string | null
          sent_48h?: boolean
          sent_48h_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          schedule_id?: string
          sent_2h?: boolean
          sent_2h_at?: string | null
          sent_48h?: boolean
          sent_48h_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_notification_status_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_notification_status_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_responses: {
        Row: {
          id: string
          schedule_assignment_id: string
          response_status: string
          response_date: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          schedule_assignment_id: string
          response_status: string
          response_date?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          schedule_assignment_id?: string
          response_status?: string
          response_date?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_responses_schedule_assignment_id_fkey"
            columns: ["schedule_assignment_id"]
            isOneToOne: false
            referencedRelation: "schedule_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          church_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          event_time: string
          id: string
          name: string
          observations: string | null
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          event_time: string
          id?: string
          name: string
          observations?: string | null
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          event_time?: string
          id?: string
          name?: string
          observations?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          church_id: string
          created_at: string
          created_by: string
          email_sent: boolean | null
          event_date: string
          event_time: string
          id: string
          ministry_id: string
          observations: string | null
          title: string
          updated_at: string
          event_type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          church_id: string
          created_at?: string
          created_by: string
          email_sent?: boolean | null
          event_date: string
          event_time: string
          id?: string
          ministry_id: string
          observations?: string | null
          title: string
          updated_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          church_id?: string
          created_at?: string
          created_by?: string
          email_sent?: boolean | null
          event_date?: string
          event_time?: string
          id?: string
          ministry_id?: string
          observations?: string | null
          title?: string
          updated_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "schedules_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_orders: {
        Row: {
          amount: number
          church_id: string | null
          created_at: string
          id: string
          payment_provider_id: string | null
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          church_id?: string | null
          created_at?: string
          id?: string
          payment_provider_id?: string | null
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          church_id?: string | null
          created_at?: string
          id?: string
          payment_provider_id?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_orders_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      template_functions: {
        Row: {
          created_at: string
          function_name: string
          id: string
          is_leader: boolean
          required_count: number
          template_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          is_leader?: boolean
          required_count?: number
          template_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          is_leader?: boolean
          required_count?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_functions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          church_id: string | null
          created_at: string
          id: string
          ministry_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          id?: string
          ministry_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          id?: string
          ministry_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_key: string
          church_id: string
          created_at: string
          id: string
          instance_url: string
          phone_number: string | null
          status: string
          updated_at: string
          qr_code: string | null
        }
        Insert: {
          api_key: string
          church_id: string
          created_at?: string
          id?: string
          instance_url: string
          phone_number?: string | null
          status?: string
          updated_at?: string
          qr_code?: string | null
        }
        Update: {
          api_key?: string
          church_id?: string
          created_at?: string
          id?: string
          instance_url?: string
          phone_number?: string | null
          status?: string
          updated_at?: string
          qr_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }

    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_schedule_response: {
        Args: { p_assignment_id: string; p_status: string }
        Returns: string
      }
      get_user_church_id: { Args: { _user_id: string }; Returns: string }
      handle_new_user: { Args: Record<PropertyKey, never>; Returns: unknown }
      has_role: {
        Args: {
          _church_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      app_role: "church_admin" | "ministry_leader" | "member" | "platform_admin"
      subscription_plan: "free" | "basic" | "premium"
      event_type: "Culto de Pôr do Sol" | "Escola Sabatina" | "Culto Divino" | "Culto Jovem" | "Culto de Quarta" | "Classe Bíblica" | "JA (Sábado à tarde)" | "Pequenos Grupos" | "Vigília" | "Santa Ceia" | "Semana de Oração" | "Semana Jovem" | "Semana Santa" | "Culto Missionário" | "Batismo" | "Programa Especial" | "Ensaio de Louvor" | "Reunião Administrativa" | "Outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["church_admin", "ministry_leader", "member", "platform_admin"],
      subscription_plan: ["free", "basic", "premium"],
      event_type: ["Culto de Pôr do Sol", "Escola Sabatina", "Culto Divino", "Culto Jovem", "Culto de Quarta", "Classe Bíblica", "JA (Sábado à tarde)", "Pequenos Grupos", "Vigília", "Santa Ceia", "Semana de Oração", "Semana Jovem", "Semana Santa", "Culto Missionário", "Batismo", "Programa Especial", "Ensaio de Louvor", "Reunião Administrativa", "Outro"],
      // response_status: ["pending", "confirmed", "declined"], // REMOVIDO
    },
  },
} as const
