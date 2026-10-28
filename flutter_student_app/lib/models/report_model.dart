class DawahActivityModel {
  final String id;
  final String type;
  final String date;
  final String title;
  final String role; // 'مشارك' | 'مقدّم' | 'منظّم'
  final String targetGroup;
  final int beneficiariesCount;

  DawahActivityModel({
    required this.id,
    required this.type,
    required this.date,
    required this.title,
    required this.role,
    required this.targetGroup,
    required this.beneficiariesCount,
  });

  factory DawahActivityModel.fromJson(Map<String, dynamic> json) {
    return DawahActivityModel(
      id: json['id'] ?? '',
      type: json['type'] ?? 'خطبة',
      date: json['date'] ?? '',
      title: json['title'] ?? '',
      role: json['role'] ?? 'مشارك',
      targetGroup: json['targetGroup'] ?? '',
      beneficiariesCount: json['beneficiariesCount'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'date': date,
      'title': title,
      'role': role,
      'targetGroup': targetGroup,
      'beneficiariesCount': beneficiariesCount,
    };
  }
}

class DiscussionSessionModel {
  final int sessionNumber;
  bool attended;

  DiscussionSessionModel({
    required this.sessionNumber,
    required this.attended,
  });

  factory DiscussionSessionModel.fromJson(Map<String, dynamic> json) {
    return DiscussionSessionModel(
      sessionNumber: json['sessionNumber'] ?? 1,
      attended: json['attended'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sessionNumber': sessionNumber,
      'attended': attended,
    };
  }
}

class CulturalActivityModel {
  final String id;
  final String title;
  final String type;
  final String date;
  final String role;
  final String? description;

  CulturalActivityModel({
    required this.id,
    required this.title,
    required this.type,
    required this.date,
    required this.role,
    this.description,
  });

  factory CulturalActivityModel.fromJson(Map<String, dynamic> json) {
    return CulturalActivityModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      type: json['type'] ?? '',
      date: json['date'] ?? '',
      role: json['role'] ?? '',
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'type': type,
      'date': date,
      'role': role,
      'description': description,
    };
  }
}

class MonthlyAchievementModel {
  final String id;
  final String title;
  final String date;
  final String description;
  final String? category;

  MonthlyAchievementModel({
    required this.id,
    required this.title,
    required this.date,
    required this.description,
    this.category,
  });

  factory MonthlyAchievementModel.fromJson(Map<String, dynamic> json) {
    return MonthlyAchievementModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      date: json['date'] ?? '',
      description: json['description'] ?? '',
      category: json['category'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'date': date,
      'description': description,
      'category': category,
    };
  }
}

class MonthlyReportModel {
  String id;
  String studentId;
  String studentName;
  String studentCode;
  String educationalStage;
  int month;
  int year;
  String academicYear;
  String createdAt;
  String updatedAt;
  String status; // 'draft' | 'submitted' | 'locked'
  bool editAllowed;
  String syncStatus; // 'synced' | 'pending_sync'

  // المحور 1: الأداء العلمي (30)
  String bookName;
  int totalPages;
  int pagesRead;
  double scientificScore;
  double scientificPercentage;

  // المحور 2: جلسات المناقشة (20)
  List<DiscussionSessionModel> discussionSessions;
  int attendedSessionsCount;
  double discussionScore;

  // المحور 3: الأداء الدعوي (20)
  List<DawahActivityModel> dawahActivities;
  double dawahScore;
  int totalBeneficiaries;

  // المحور 4: الالتزام والانضباط (10)
  int tasksAssigned;
  int tasksCompleted;
  int unexcusedAbsences;
  int delaysCount;
  double disciplineScore;

  // المحور 5: الأداء الأخلاقي (10) - خاص بالمسؤول
  int moralRespect;
  int moralCooperation;
  int moralResponsibility;
  int moralGoodConduct;
  int moralDiscipline;
  String? moralNotes;
  double moralScore;

  // المحور 6: الأنشطة الثقافية (5)
  List<CulturalActivityModel> culturalActivities;
  double culturalScore;

  // المحور 7: الإنجازات الشهرية (5)
  List<MonthlyAchievementModel> achievements;
  double achievementsScore;

  // المحور 8: التحديات
  String challengeDescription;
  String challengeImpact;
  String challengeHandling;
  String challengeRequiredSupport;

  // المحور 9: خطة الشهر القادم
  String planGoals;
  String planTasks;
  String planImprovement;
  String planRequiredResources;

  // المحور 10: الإنجاز العام
  String generalSummary;
  String? generalNotes;

  // المجموع والتقدير
  double totalScore;
  String gradeDescription;

  MonthlyReportModel({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.studentCode,
    required this.educationalStage,
    required this.month,
    required this.year,
    required this.academicYear,
    required this.createdAt,
    required this.updatedAt,
    this.status = 'draft',
    this.editAllowed = true,
    this.syncStatus = 'synced',
    this.bookName = '',
    this.totalPages = 0,
    this.pagesRead = 0,
    this.scientificScore = 0.0,
    this.scientificPercentage = 0.0,
    required this.discussionSessions,
    this.attendedSessionsCount = 0,
    this.discussionScore = 0.0,
    required this.dawahActivities,
    this.dawahScore = 0.0,
    this.totalBeneficiaries = 0,
    this.tasksAssigned = 4,
    this.tasksCompleted = 4,
    this.unexcusedAbsences = 0,
    this.delaysCount = 0,
    this.disciplineScore = 10.0,
    this.moralRespect = 2,
    this.moralCooperation = 2,
    this.moralResponsibility = 2,
    this.moralGoodConduct = 2,
    this.moralDiscipline = 2,
    this.moralNotes,
    this.moralScore = 10.0,
    required this.culturalActivities,
    this.culturalScore = 0.0,
    required this.achievements,
    this.achievementsScore = 0.0,
    this.challengeDescription = '',
    this.challengeImpact = '',
    this.challengeHandling = '',
    this.challengeRequiredSupport = '',
    this.planGoals = '',
    this.planTasks = '',
    this.planImprovement = '',
    this.planRequiredResources = '',
    this.generalSummary = '',
    this.generalNotes,
    this.totalScore = 0.0,
    this.gradeDescription = 'يحتاج إلى تحسين',
  });

  factory MonthlyReportModel.fromJson(Map<String, dynamic> json) {
    return MonthlyReportModel(
      id: json['id'] ?? '',
      studentId: json['studentId'] ?? '',
      studentName: json['studentName'] ?? '',
      studentCode: json['studentCode'] ?? '',
      educationalStage: json['educationalStage'] ?? '',
      month: json['month'] ?? 1,
      year: json['year'] ?? 2026,
      academicYear: json['academicYear'] ?? '1447-1448',
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
      status: json['status'] ?? 'draft',
      editAllowed: json['editAllowed'] ?? true,
      syncStatus: json['syncStatus'] ?? 'synced',
      bookName: json['scientificPerformance']?['bookName'] ?? '',
      totalPages: json['scientificPerformance']?['totalPages'] ?? 0,
      pagesRead: json['scientificPerformance']?['pagesRead'] ?? 0,
      scientificScore: (json['scientificPerformance']?['score'] ?? 0).toDouble(),
      scientificPercentage: (json['scientificPerformance']?['completionPercentage'] ?? 0).toDouble(),
      discussionSessions: (json['discussionSessions']?['sessions'] as List<dynamic>?)
              ?.map((e) => DiscussionSessionModel.fromJson(e))
              .toList() ??
          [],
      attendedSessionsCount: json['discussionSessions']?['attendedCount'] ?? 0,
      discussionScore: (json['discussionSessions']?['score'] ?? 0).toDouble(),
      dawahActivities: (json['dawahPerformance']?['activities'] as List<dynamic>?)
              ?.map((e) => DawahActivityModel.fromJson(e))
              .toList() ??
          [],
      dawahScore: (json['dawahPerformance']?['score'] ?? 0).toDouble(),
      totalBeneficiaries: json['dawahPerformance']?['totalBeneficiaries'] ?? 0,
      tasksAssigned: json['discipline']?['tasksAssigned'] ?? 4,
      tasksCompleted: json['discipline']?['tasksCompleted'] ?? 4,
      unexcusedAbsences: json['discipline']?['unexcusedAbsences'] ?? 0,
      delaysCount: json['discipline']?['delaysCount'] ?? 0,
      disciplineScore: (json['discipline']?['score'] ?? 10).toDouble(),
      moralRespect: json['moralEvaluation']?['respect'] ?? 2,
      moralCooperation: json['moralEvaluation']?['cooperation'] ?? 2,
      moralResponsibility: json['moralEvaluation']?['responsibility'] ?? 2,
      moralGoodConduct: json['moralEvaluation']?['goodConduct'] ?? 2,
      moralDiscipline: json['moralEvaluation']?['behavioralDiscipline'] ?? 2,
      moralNotes: json['moralEvaluation']?['notes'],
      moralScore: (json['moralEvaluation']?['score'] ?? 10).toDouble(),
      culturalActivities: (json['culturalActivities']?['activities'] as List<dynamic>?)
              ?.map((e) => CulturalActivityModel.fromJson(e))
              .toList() ??
          [],
      culturalScore: (json['culturalActivities']?['score'] ?? 0).toDouble(),
      achievements: (json['monthlyAchievements']?['achievements'] as List<dynamic>?)
              ?.map((e) => MonthlyAchievementModel.fromJson(e))
              .toList() ??
          [],
      achievementsScore: (json['monthlyAchievements']?['score'] ?? 0).toDouble(),
      challengeDescription: json['challenges']?['description'] ?? '',
      challengeImpact: json['challenges']?['impact'] ?? '',
      challengeHandling: json['challenges']?['handling'] ?? '',
      challengeRequiredSupport: json['challenges']?['requiredSupport'] ?? '',
      planGoals: json['nextMonthPlan']?['goals'] ?? '',
      planTasks: json['nextMonthPlan']?['tasks'] ?? '',
      planImprovement: json['nextMonthPlan']?['improvementPlan'] ?? '',
      planRequiredResources: json['nextMonthPlan']?['requiredResources'] ?? '',
      generalSummary: json['generalSummary']?['summary'] ?? '',
      generalNotes: json['generalSummary']?['notes'],
      totalScore: (json['totalScore'] ?? 0).toDouble(),
      gradeDescription: json['gradeDescription'] ?? 'يحتاج إلى تحسين',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studentId': studentId,
      'studentName': studentName,
      'studentCode': studentCode,
      'educationalStage': educationalStage,
      'month': month,
      'year': year,
      'academicYear': academicYear,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'status': status,
      'editAllowed': editAllowed,
      'syncStatus': syncStatus,
      'scientificPerformance': {
        'bookName': bookName,
        'totalPages': totalPages,
        'pagesRead': pagesRead,
        'completionPercentage': scientificPercentage,
        'score': scientificScore,
      },
      'discussionSessions': {
        'sessions': discussionSessions.map((e) => e.toJson()).toList(),
        'attendedCount': attendedSessionsCount,
        'score': discussionScore,
      },
      'dawahPerformance': {
        'activities': dawahActivities.map((e) => e.toJson()).toList(),
        'totalActivities': dawahActivities.length,
        'totalBeneficiaries': totalBeneficiaries,
        'score': dawahScore,
      },
      'discipline': {
        'tasksAssigned': tasksAssigned,
        'tasksCompleted': tasksCompleted,
        'unexcusedAbsences': unexcusedAbsences,
        'delaysCount': delaysCount,
        'score': disciplineScore,
      },
      'moralEvaluation': {
        'respect': moralRespect,
        'cooperation': moralCooperation,
        'responsibility': moralResponsibility,
        'goodConduct': moralGoodConduct,
        'behavioralDiscipline': moralDiscipline,
        'notes': moralNotes,
        'score': moralScore,
      },
      'culturalActivities': {
        'activities': culturalActivities.map((e) => e.toJson()).toList(),
        'score': culturalScore,
      },
      'monthlyAchievements': {
        'achievements': achievements.map((e) => e.toJson()).toList(),
        'score': achievementsScore,
      },
      'challenges': {
        'description': challengeDescription,
        'impact': challengeImpact,
        'handling': challengeHandling,
        'requiredSupport': challengeRequiredSupport,
      },
      'nextMonthPlan': {
        'goals': planGoals,
        'tasks': planTasks,
        'improvementPlan': planImprovement,
        'requiredResources': planRequiredResources,
      },
      'generalSummary': {
        'summary': generalSummary,
        'notes': generalNotes,
      },
      'totalScore': totalScore,
      'gradeDescription': gradeDescription,
    };
  }
}
