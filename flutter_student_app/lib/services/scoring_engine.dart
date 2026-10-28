import 'dart:math';
import '../models/report_model.dart';

class FlutterScoringEngine {
  // 1. الأداء العلمي (30 نقطة)
  static Map<String, double> calculateScientific(int totalPages, int pagesRead) {
    if (totalPages <= 0 || pagesRead <= 0) {
      return {'score': 0.0, 'percentage': 0.0};
    }
    final boundedRead = min(pagesRead, totalPages);
    final percentage = (boundedRead / totalPages) * 100.0;
    final score = min(30.0, max(0.0, (boundedRead / totalPages) * 30.0));
    return {
      'score': double.parse(score.toStringAsFixed(1)),
      'percentage': double.parse(percentage.toStringAsFixed(1)),
    };
  }

  // 2. جلسات المناقشة (20 نقطة)
  static Map<String, dynamic> calculateDiscussion(List<DiscussionSessionModel> sessions) {
    final attended = sessions.where((s) => s.attended).length;
    final bounded = min(4, max(0, attended));
    final score = (bounded / 4.0) * 20.0;
    return {
      'score': score,
      'attendedCount': bounded,
    };
  }

  // 3. الأداء الدعوي (20 نقطة)
  static Map<String, dynamic> calculateDawah(List<DawahActivityModel> activities) {
    if (activities.isEmpty) {
      return {'score': 0.0, 'totalBeneficiaries': 0};
    }
    int totalPts = 0;
    int beneficiaries = 0;

    for (final act in activities) {
      beneficiaries += act.beneficiariesCount;
      if (act.role == 'مقدّم') {
        totalPts += 5;
      } else if (act.role == 'منظّم') {
        totalPts += 3;
      } else {
        totalPts += 2; // مشارك
      }
    }
    final score = min(20.0, max(0.0, totalPts.toDouble()));
    return {
      'score': score,
      'totalBeneficiaries': beneficiaries,
    };
  }

  // 4. الالتزام والانضباط (10 نقاط)
  static double calculateDiscipline({
    required int tasksAssigned,
    required int tasksCompleted,
    required int unexcusedAbsences,
    required int delaysCount,
  }) {
    double taskScore = 4.0;
    if (tasksAssigned > 0) {
      final validDone = min(tasksCompleted, tasksAssigned);
      taskScore = (validDone / tasksAssigned) * 4.0;
    }
    final deduction = (unexcusedAbsences * 1.5) + (delaysCount * 0.5);
    final attendanceScore = max(0.0, 6.0 - deduction);

    final total = min(10.0, max(0.0, taskScore + attendanceScore));
    return double.parse(total.toStringAsFixed(1));
  }

  // 5. الأخلاقي والسلوكي (10 نقاط)
  static double calculateMoral(int r, int c, int resp, int g, int d) {
    int clamp2(int v) => min(2, max(0, v));
    final sum = clamp2(r) + clamp2(c) + clamp2(resp) + clamp2(g) + clamp2(d);
    return min(10.0, max(0.0, sum.toDouble()));
  }

  // 6. الأنشطة الثقافية (5 نقاط)
  static double calculateCultural(int count) {
    return min(5.0, max(0.0, count * 2.5));
  }

  // 7. الإنجازات (5 نقاط)
  static double calculateAchievements(int count) {
    return min(5.0, max(0.0, count * 2.5));
  }

  // التقدير الوصفي
  static String getGradeDescription(double totalScore) {
    final s = double.parse(totalScore.toStringAsFixed(1));
    if (s >= 90.0) return 'ممتاز';
    if (s >= 80.0) return 'جيد جداً';
    if (s >= 70.0) return 'جيد';
    if (s >= 60.0) return 'مقبول';
    return 'يحتاج إلى تحسين';
  }

  // الحساب الشامل للتقرير
  static void recalculate(MonthlyReportModel report) {
    final sci = calculateScientific(report.totalPages, report.pagesRead);
    report.scientificScore = sci['score']!;
    report.scientificPercentage = sci['percentage']!;

    final disc = calculateDiscussion(report.discussionSessions);
    report.discussionScore = disc['score'];
    report.attendedSessionsCount = disc['attendedCount'];

    final daw = calculateDawah(report.dawahActivities);
    report.dawahScore = daw['score'];
    report.totalBeneficiaries = daw['totalBeneficiaries'];

    report.disciplineScore = calculateDiscipline(
      tasksAssigned: report.tasksAssigned,
      tasksCompleted: report.tasksCompleted,
      unexcusedAbsences: report.unexcusedAbsences,
      delaysCount: report.delaysCount,
    );

    report.moralScore = calculateMoral(
      report.moralRespect,
      report.moralCooperation,
      report.moralResponsibility,
      report.moralGoodConduct,
      report.moralDiscipline,
    );

    report.culturalScore = calculateCultural(report.culturalActivities.length);
    report.achievementsScore = calculateAchievements(report.achievements.length);

    final rawTotal = report.scientificScore +
        report.discussionScore +
        report.dawahScore +
        report.disciplineScore +
        report.moralScore +
        report.culturalScore +
        report.achievementsScore;

    report.totalScore = min(100.0, max(0.0, double.parse(rawTotal.toStringAsFixed(1))));
    report.gradeDescription = getGradeDescription(report.totalScore);
  }
}
