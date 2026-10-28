export type UserRole = 'student' | 'admin' | 'supervisor';

export type AccountStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface User {
  id: string;
  studentId: string; // e.g. STU-2026-001
  fullName: string;
  username: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  educationalStage: string; // e.g. المرحلة الثانوية، المرحلة الجامعية، مرحلة التأهيل
  supervisorName?: string;
  createdAt: string;
  passwordHash?: string;
  phone?: string;
}

export type DawahActivityType = 
  | 'خطبة'
  | 'محاضرة'
  | 'ندوة'
  | 'درس دعوي'
  | 'موعظة'
  | 'نشاط دعوي آخر';

export type DawahRole = 'مشارك' | 'مقدّم' | 'منظّم';

export interface DawahActivity {
  id: string;
  type: DawahActivityType;
  date: string;
  title: string;
  role: DawahRole;
  targetGroup: string;
  beneficiariesCount: number;
}

export interface DiscussionSession {
  sessionNumber: 1 | 2 | 3 | 4;
  attended: boolean;
}

export interface CulturalActivity {
  id: string;
  title: string;
  type: string;
  date: string;
  role: string;
  description?: string;
}

export interface MonthlyAchievement {
  id: string;
  title: string;
  date: string;
  description: string;
  category?: string;
}

export interface MoralEvaluation {
  respect: number; // 0 to 2
  cooperation: number; // 0 to 2
  responsibility: number; // 0 to 2
  goodConduct: number; // 0 to 2
  behavioralDiscipline: number; // 0 to 2
  notes?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
}

export interface MonthlyReport {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  educationalStage: string;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  academicYear: string; // e.g. "1447-1448" أو "2025-2026"
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'submitted' | 'locked';
  editAllowed: boolean;
  syncStatus: 'synced' | 'pending_sync' | 'conflict';

  // المحور 1: الأداء العلمي (30)
  scientificPerformance: {
    bookName: string;
    totalPages: number;
    pagesRead: number;
    completionPercentage: number;
    score: number; // 0 - 30
  };

  // المحور 2: جلسات المناقشة (20)
  discussionSessions: {
    sessions: DiscussionSession[];
    attendedCount: number;
    score: number; // 0 - 20
  };

  // المحور 3: الأداء الدعوي (20)
  dawahPerformance: {
    activities: DawahActivity[];
    totalActivities: number;
    totalBeneficiaries: number;
    score: number; // 0 - 20
  };

  // المحور 4: الالتزام والانضباط (10)
  discipline: {
    punctualityRate: number; // 0 - 100%
    attendedMeetings: number;
    unexcusedAbsences: number;
    delaysCount: number;
    tasksAssigned: number;
    tasksCompleted: number;
    score: number; // 0 - 10
  };

  // المحور 5: الأداء الأخلاقي والسلوكي (10) - خاص بالمسؤول
  moralEvaluation: MoralEvaluation & {
    score: number; // 0 - 10
  };

  // المحور 6: الأنشطة الثقافية والاجتماعية (5)
  culturalActivities: {
    activities: CulturalActivity[];
    supervisorBonus?: number;
    score: number; // 0 - 5
  };

  // المحور 7: الإنجازات الشهرية (5)
  monthlyAchievements: {
    achievements: MonthlyAchievement[];
    score: number; // 0 - 5
  };

  // المحور 8: التحديات والصعوبات (وصفي)
  challenges: {
    description: string;
    impact: string;
    handling: string;
    requiredSupport?: string;
  };

  // المحور 9: خطة الشهر القادم (وصفي)
  nextMonthPlan: {
    goals: string;
    tasks: string;
    improvementPlan: string;
    requiredResources?: string;
  };

  // المحور 10: الإنجاز العام والملاحظات (وصفي)
  generalSummary: {
    summary: string;
    notes?: string;
  };

  // المجموع النهائي
  totalScore: number; // 0 - 100
  gradeDescription: GradeDescription;
}

export type GradeDescription = 
  | 'ممتاز'
  | 'جيد جداً'
  | 'جيد'
  | 'مقبول'
  | 'يحتاج إلى تحسين';

export interface SystemSettings {
  organizationName: string;
  organizationSubtitle: string;
  logoUrl?: string;
  currentAcademicYear: string;
  currentMonth: number;
  currentYear: number;
  remindersEnabled: boolean;
  reminderDaysBeforeEnd: number;
  localServerPort: number;
  localServerHost: string;
  lastBackupDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetUserId?: string; // empty means all or admin
  type: 'info' | 'warning' | 'success' | 'alert';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
}
