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
      clients: {
        Row: {
          client_email: string
          client_slug: string
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          name: string
          niche: string
        }
        Insert: {
          client_email?: string
          client_slug: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          niche: string
        }
        Update: {
          client_email?: string
          client_slug?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          niche?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clients_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string
          created_at: string
          full_name: string
          id: string
          job_title: string
          role: string
        }
        Insert: {
          avatar_color?: string
          created_at?: string
          full_name: string
          id: string
          job_title?: string
          role?: string
        }
        Update: {
          avatar_color?: string
          created_at?: string
          full_name?: string
          id?: string
          job_title?: string
          role?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_id: string
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean
          name: string
        }
        Insert: {
          client_id: string
          color: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
        }
        Update: {
          client_id?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projects_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      invitations: {
        Row: {
          id: string
          token: string
          created_by: string
          role: string
          email: string | null
          expires_at: string
          used_at: string | null
          used_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          created_by: string
          role?: string
          email?: string | null
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          created_by?: string
          role?: string
          email?: string | null
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      admin_project_access: {
        Row: {
          admin_id: string
          project_id: string
          granted_by: string
          granted_at: string
        }
        Insert: {
          admin_id: string
          project_id: string
          granted_by: string
          granted_at?: string
        }
        Update: {
          admin_id?: string
          project_id?: string
          granted_by?: string
          granted_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          notes: string | null
          priority: string
          project_id: string
          responsible: string
          status: string
          subtasks: Json
          tags: string[]
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id: string
          responsible?: string
          status?: string
          subtasks?: Json
          tags?: string[]
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string
          responsible?: string
          status?: string
          subtasks?: Json
          tags?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
