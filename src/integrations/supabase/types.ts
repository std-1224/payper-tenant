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
      apps_registry: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_core: boolean
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          key: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          key?: string
          name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      global_admins: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["global_admin_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["global_admin_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["global_admin_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          is_active: boolean | null
          qr_code: string
          restrictions: Json | null
          table_number: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          qr_code: string
          restrictions?: Json | null
          table_number: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          qr_code?: string
          restrictions?: Json | null
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_bars"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          ingredient_name: string
          percentage: number
          recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          ingredient_name: string
          percentage?: number
          recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          ingredient_name?: string
          percentage?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          email: string
          id: string
          last_action_at: string | null
          name: string
          permissions: Json | null
          role: string
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_action_at?: string | null
          name: string
          permissions?: Json | null
          role: string
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_action_at?: string | null
          name?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          bar_id: string
          id: string
          min_quantity: number
          product_id: string | null
          product_name: string
          quantity: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          bar_id: string
          id?: string
          min_quantity?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          bar_id?: string
          id?: string
          min_quantity?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_bars"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          bar_id: string | null
          created_at: string
          id: string
          is_resolved: boolean | null
          message: string
          resolved_at: string | null
          severity: string
          type: string
          venue_id: string | null
        }
        Insert: {
          bar_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message: string
          resolved_at?: string | null
          severity?: string
          type: string
          venue_id?: string | null
        }
        Update: {
          bar_id?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          message?: string
          resolved_at?: string | null
          severity?: string
          type?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_alerts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_primary: boolean
          name: string
          notes: string | null
          phone: string | null
          role_label: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          role_label?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          role_label?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_locations: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          status: string
          tenant_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          tenant_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_modules: {
        Row: {
          activated_at: string | null
          app_id: string
          config: Json | null
          created_by: string | null
          deactivated_at: string | null
          enabled: boolean
          id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          app_id: string
          config?: Json | null
          created_by?: string | null
          deactivated_at?: string | null
          enabled?: boolean
          id?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          app_id?: string
          config?: Json | null
          created_by?: string | null
          deactivated_at?: string | null
          enabled?: boolean
          id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          last_login_at: string | null
          role: Database["public"]["Enums"]["tenant_user_role"]
          status: Database["public"]["Enums"]["tenant_user_status"]
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          role: Database["public"]["Enums"]["tenant_user_role"]
          status?: Database["public"]["Enums"]["tenant_user_status"]
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["tenant_user_role"]
          status?: Database["public"]["Enums"]["tenant_user_status"]
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          default_currency: string
          id: string
          legal_name: string | null
          name: string
          notes_internal: string | null
          onboarding_step: number
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          timezone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          default_currency?: string
          id?: string
          legal_name?: string | null
          name: string
          notes_internal?: string | null
          onboarding_step?: number
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          default_currency?: string
          id?: string
          legal_name?: string | null
          name?: string
          notes_internal?: string | null
          onboarding_step?: number
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      venue_bars: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_bars_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_cashflow: {
        Row: {
          amount: number
          bar_id: string | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          type: string
          venue_id: string
        }
        Insert: {
          amount: number
          bar_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          type: string
          venue_id: string
        }
        Update: {
          amount?: number
          bar_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          type?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_cashflow_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_cashflow_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_orders: {
        Row: {
          bar_id: string
          completed_at: string | null
          created_at: string
          id: string
          items: Json | null
          prep_time_minutes: number | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
          venue_id: string
        }
        Insert: {
          bar_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          items?: Json | null
          prep_time_minutes?: number | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          venue_id: string
        }
        Update: {
          bar_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          items?: Json | null
          prep_time_minutes?: number | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_orders_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "venue_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_orders_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_users: {
        Row: {
          balance: number
          created_at: string
          email: string | null
          has_nfc: boolean | null
          id: string
          name: string
          nfc_card_id: string | null
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email?: string | null
          has_nfc?: boolean | null
          id?: string
          name: string
          nfc_card_id?: string | null
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string | null
          has_nfc?: boolean | null
          id?: string
          name?: string
          nfc_card_id?: string | null
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_users_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          created_at: string
          id: string
          is_offline: boolean | null
          last_sync: string | null
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_offline?: boolean | null
          last_sync?: string | null
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_offline?: boolean | null
          last_sync?: string | null
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_global_role: { Args: never; Returns: string }
      insert_audit_log: {
        Args: {
          p_action: string
          p_after_data?: Json
          p_before_data?: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: string
      }
      is_global_admin: { Args: never; Returns: boolean }
      is_member_of_tenant: { Args: { _tenant_id: string }; Returns: boolean }
      is_tenant_admin: { Args: { _tenant_id: string }; Returns: boolean }
      user_tenant_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      global_admin_role:
        | "super_admin"
        | "support_admin"
        | "sales_admin"
        | "read_only"
      tenant_status: "trial" | "active" | "suspended" | "cancelled" | "free"
      tenant_user_role:
        | "tenant_owner"
        | "tenant_admin"
        | "tenant_ops"
        | "tenant_finance"
        | "tenant_viewer"
      tenant_user_status: "invited" | "active" | "disabled"
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
      global_admin_role: [
        "super_admin",
        "support_admin",
        "sales_admin",
        "read_only",
      ],
      tenant_status: ["trial", "active", "suspended", "cancelled", "free"],
      tenant_user_role: [
        "tenant_owner",
        "tenant_admin",
        "tenant_ops",
        "tenant_finance",
        "tenant_viewer",
      ],
      tenant_user_status: ["invited", "active", "disabled"],
    },
  },
} as const
