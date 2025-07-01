export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      catalog_items: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          name: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string
          id?: string
          name: string
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          name?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      extra_deliveries: {
        Row: {
          catalog_item_id: string
          delivered_at: string | null
          delivered_by: string | null
          id: string
          quantity: number
          reason: string | null
          room_id: string
        }
        Insert: {
          catalog_item_id: string
          delivered_at?: string | null
          delivered_by?: string | null
          id?: string
          quantity: number
          reason?: string | null
          room_id: string
        }
        Update: {
          catalog_item_id?: string
          delivered_at?: string | null
          delivered_by?: string | null
          id?: string
          quantity?: number
          reason?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_deliveries_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_deliveries_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_deliveries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          catalog_item_id: string
          created_at: string | null
          created_by: string | null
          from_status: string | null
          id: string
          movement_type: string
          notes: string | null
          quantity: number
          room_id: string | null
          to_status: string | null
        }
        Insert: {
          catalog_item_id: string
          created_at?: string | null
          created_by?: string | null
          from_status?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          quantity: number
          room_id?: string | null
          to_status?: string | null
        }
        Update: {
          catalog_item_id?: string
          created_at?: string | null
          created_by?: string | null
          from_status?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          room_id?: string | null
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_stock: {
        Row: {
          available_stock: number
          catalog_item_id: string
          dirty_stock: number
          id: string
          in_use_stock: number
          total_stock: number
          updated_at: string | null
        }
        Insert: {
          available_stock?: number
          catalog_item_id: string
          dirty_stock?: number
          id?: string
          in_use_stock?: number
          total_stock?: number
          updated_at?: string | null
        }
        Update: {
          available_stock?: number
          catalog_item_id?: string
          dirty_stock?: number
          id?: string
          in_use_stock?: number
          total_stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_stock_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: true
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      room_linen_config: {
        Row: {
          catalog_item_id: string
          created_at: string | null
          id: string
          quantity: number
          room_id: string
        }
        Insert: {
          catalog_item_id: string
          created_at?: string | null
          id?: string
          quantity?: number
          room_id: string
        }
        Update: {
          catalog_item_id?: string
          created_at?: string | null
          id?: string
          quantity?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_linen_config_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_linen_config_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["room_status"]
          type: Database["public"]["Enums"]["room_type"]
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          id: string
          name: string
          status?: Database["public"]["Enums"]["room_status"]
          type: Database["public"]["Enums"]["room_type"]
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["room_status"]
          type?: Database["public"]["Enums"]["room_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_room_clean: {
        Args: { p_room_id: string; p_user_id: string };
        Returns: void;
      };
    }
    Enums: {
      room_status: "ocupada" | "libre" | "mantenimiento"
      room_type: "matrimonial" | "individual" | "doble" | "suite"
      user_role: "supervisor" | "mucama"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      room_status: ["ocupada", "libre", "mantenimiento"],
      room_type: ["matrimonial", "individual", "doble", "suite"],
      user_role: ["supervisor", "mucama"],
    },
  },
} as const
