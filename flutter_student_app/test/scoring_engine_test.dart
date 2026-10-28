import 'package:flutter_test/flutter_test.dart';
import '../lib/services/scoring_engine.dart';
import '../lib/models/report_model.dart';

void main() {
  group('اختبارات محرك درجات المتابعة الشهرية (Flutter)', () {
    test('اختبار الأداء العلمي: 150 من 300 صفحة يجب أن يعطي 15 نقطة و 50%', () {
      final res = FlutterScoringEngine.calculateScientific(300, 150);
      expect(res['score'], 15.0);
      expect(res['percentage'], 50.0);
    });

    test('اختبار حماية تجاوز إجمالي الصفحات', () {
      final res = FlutterScoringEngine.calculateScientific(100, 150);
      expect(res['score'], 30.0); // سقف 30
      expect(res['percentage'], 100.0);
    });

    test('جلسات المناقشة: 4 جلسات تعطي 20 نقطة', () {
      final sessions = [
        DiscussionSessionModel(sessionNumber: 1, attended: true),
        DiscussionSessionModel(sessionNumber: 2, attended: true),
        DiscussionSessionModel(sessionNumber: 3, attended: true),
        DiscussionSessionModel(sessionNumber: 4, attended: true),
      ];
      final res = FlutterScoringEngine.calculateDiscussion(sessions);
      expect(res['score'], 20.0);
      expect(res['attendedCount'], 4);
    });

    test('الأداء الدعوي: حماية سقف الـ 20 نقطة حتى مع وجود 10 خطب', () {
      final activities = List.generate(
        10,
        (i) => DawahActivityModel(
          id: '$i',
          type: 'خطبة',
          date: '2026-10-01',
          title: 'خطبة $i',
          role: 'مقدّم',
          targetGroup: 'مسجد',
          beneficiariesCount: 50,
        ),
      );
      final res = FlutterScoringEngine.calculateDawah(activities);
      expect(res['score'], 20.0);
    });

    test('التقديرات الوصفية الخمسة', () {
      expect(FlutterScoringEngine.getGradeDescription(95.0), 'ممتاز');
      expect(FlutterScoringEngine.getGradeDescription(85.0), 'جيد جداً');
      expect(FlutterScoringEngine.getGradeDescription(75.0), 'جيد');
      expect(FlutterScoringEngine.getGradeDescription(65.0), 'مقبول');
      expect(FlutterScoringEngine.getGradeDescription(50.0), 'يحتاج إلى تحسين');
    });
  });
}
