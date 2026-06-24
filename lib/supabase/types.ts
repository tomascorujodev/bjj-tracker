// Tipos de la base de datos (manuales por ahora).
// Regenerar con la CLI cuando esté linkeada:
//   supabase gen types typescript --project-id <ref> > lib/supabase/types.ts

export type BeltColor = "blanco" | "azul" | "violeta" | "marron" | "negro";
export type UserRol = "admin" | "profesor" | "alumno";
export type UserEstado = "pendiente" | "activo" | "rechazado";

type AcademyRow = { id: string; nombre: string; qr_token: string; created_at: string };
type AcademyInsert = { id?: string; nombre: string; qr_token?: string; created_at?: string };

type StudentRow = {
  id: string;
  dni: string;
  nombre: string;
  foto_url: string | null;
  cinturon_actual: BeltColor;
  fecha_inicio: string;
  created_at: string;
};
type StudentInsert = {
  id?: string;
  dni: string;
  nombre: string;
  foto_url?: string | null;
  cinturon_actual?: BeltColor;
  fecha_inicio?: string;
  created_at?: string;
};

type BeltConfigRow = {
  id: string;
  cinturon_desde: BeltColor;
  cinturon_hasta: BeltColor;
  clases_requeridas: number;
};
type BeltConfigInsert = {
  id?: string;
  cinturon_desde: BeltColor;
  cinturon_hasta: BeltColor;
  clases_requeridas: number;
};

type ClassTypeRow = {
  id: string;
  nombre: string;
  activo: boolean;
  cuenta_para_progreso: boolean;
};
type ClassTypeInsert = {
  id?: string;
  nombre: string;
  activo?: boolean;
  cuenta_para_progreso?: boolean;
};

type AttendanceRow = {
  id: string;
  student_id: string;
  class_type_id: string;
  fecha: string;
  hora: string;
  registrado_por: string | null;
  created_at: string;
};
type AttendanceInsert = {
  id?: string;
  student_id: string;
  class_type_id: string;
  fecha?: string;
  hora?: string;
  registrado_por?: string | null;
  created_at?: string;
};

type UserRow = {
  id: string;
  rol: UserRol;
  estado: UserEstado;
  student_id: string | null;
  email: string;
  nombre: string | null;
  dni: string | null;
};
type UserInsert = {
  id: string;
  rol?: UserRol;
  estado?: UserEstado;
  student_id?: string | null;
  email: string;
  nombre?: string | null;
  dni?: string | null;
};

type EventRow = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  precio: number;
  cupo: number | null;
  created_at: string;
};
type EventInsert = {
  id?: string;
  titulo: string;
  descripcion?: string | null;
  fecha: string;
  precio?: number;
  cupo?: number | null;
  created_at?: string;
};

type EventEnrollmentRow = {
  id: string;
  event_id: string;
  student_id: string;
  pagado: boolean;
  pagado_at: string | null;
  created_at: string;
};
type EventEnrollmentInsert = {
  id?: string;
  event_id: string;
  student_id: string;
  pagado?: boolean;
  pagado_at?: string | null;
  created_at?: string;
};

type ClassScheduleRow = {
  id: string;
  class_type_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  created_at: string;
};
type ClassScheduleInsert = {
  id?: string;
  class_type_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo?: boolean;
  created_at?: string;
};

type StudentProgressRow = {
  student_id: string;
  nombre: string;
  cinturon_actual: BeltColor;
  cinturon_siguiente: BeltColor | null;
  clases_contadas: number;
  clases_requeridas: number | null;
  clases_faltantes: number;
};

export type CheckInResult = {
  student_id: string;
  nombre: string;
  foto_url: string | null;
  cinturon_actual: BeltColor;
  cinturon_siguiente: BeltColor | null;
  clases_contadas: number;
  clases_requeridas: number | null;
  clases_faltantes: number;
};

export type Database = {
  public: {
    Tables: {
      academies: {
        Row: AcademyRow;
        Insert: AcademyInsert;
        Update: Partial<AcademyInsert>;
        Relationships: [];
      };
      students: {
        Row: StudentRow;
        Insert: StudentInsert;
        Update: Partial<StudentInsert>;
        Relationships: [];
      };
      belt_config: {
        Row: BeltConfigRow;
        Insert: BeltConfigInsert;
        Update: Partial<BeltConfigInsert>;
        Relationships: [];
      };
      class_types: {
        Row: ClassTypeRow;
        Insert: ClassTypeInsert;
        Update: Partial<ClassTypeInsert>;
        Relationships: [];
      };
      attendance: {
        Row: AttendanceRow;
        Insert: AttendanceInsert;
        Update: Partial<AttendanceInsert>;
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_class_type_id_fkey";
            columns: ["class_type_id"];
            referencedRelation: "class_types";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: Partial<UserInsert>;
        Relationships: [
          {
            foreignKeyName: "users_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: Partial<EventInsert>;
        Relationships: [];
      };
      class_schedule: {
        Row: ClassScheduleRow;
        Insert: ClassScheduleInsert;
        Update: Partial<ClassScheduleInsert>;
        Relationships: [
          {
            foreignKeyName: "class_schedule_class_type_id_fkey";
            columns: ["class_type_id"];
            referencedRelation: "class_types";
            referencedColumns: ["id"];
          },
        ];
      };
      event_enrollments: {
        Row: EventEnrollmentRow;
        Insert: EventEnrollmentInsert;
        Update: Partial<EventEnrollmentInsert>;
        Relationships: [
          {
            foreignKeyName: "event_enrollments_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_enrollments_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_student_progress: {
        Row: StudentProgressRow;
        Relationships: [];
      };
    };
    Functions: {
      check_in: {
        Args: { p_qr_token: string; p_dni: string; p_class_type_id: string };
        Returns: CheckInResult;
      };
      academy_by_token: {
        Args: { p_qr_token: string };
        Returns: { id: string; nombre: string }[];
      };
      eligible_classes_now: {
        Args: { p_qr_token: string };
        Returns: { id: string; nombre: string; hora_inicio: string }[];
      };
      check_in_scan: {
        Args: { p_qr_token: string; p_class_type_id: string };
        Returns: CheckInResult;
      };
      list_pending_users: {
        Args: Record<never, never>;
        Returns: { id: string; email: string; nombre: string | null; dni: string | null }[];
      };
      approve_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      reject_user: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      enroll_event: {
        Args: { p_event_id: string };
        Returns: { already: boolean; pagado: boolean; titulo: string };
      };
      event_enrollment_counts: {
        Args: Record<never, never>;
        Returns: { event_id: string; inscriptos: number }[];
      };
    };
    Enums: {
      belt_color: BeltColor;
      user_rol: UserRol;
      user_estado: UserEstado;
    };
    CompositeTypes: Record<never, never>;
  };
};
