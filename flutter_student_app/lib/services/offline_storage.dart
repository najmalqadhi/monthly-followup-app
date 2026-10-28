import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/report_model.dart';
import '../models/user_model.dart';

class FlutterOfflineStorage {
  static const String keyCurrentUser = 'flutter_motabaa_user';
  static const String keyReportsPrefix = 'flutter_motabaa_report_';
  static const String keyDraftPrefix = 'flutter_motabaa_draft_';
  static const String keyServerUrl = 'flutter_motabaa_server_url';

  // حفظ واسترجاع المستخدم المسجل محلياً
  static Future<void> saveUser(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(keyCurrentUser, jsonEncode(user.toJson()));
  }

  static Future<UserModel?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(keyCurrentUser);
    if (data == null) return null;
    try {
      return UserModel.fromJson(jsonDecode(data));
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(keyCurrentUser);
  }

  // عنوان الخادم المحلي (جهاز المسؤول)
  static Future<String> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(keyServerUrl) ?? 'http://192.168.1.105:3000';
  }

  static Future<void> setServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(keyServerUrl, url.trim());
  }

  // حفظ مسودة التقرير محلياً (Autosave)
  static Future<void> saveDraft(MonthlyReportModel report) async {
    final prefs = await SharedPreferences.getInstance();
    report.syncStatus = 'pending_sync';
    report.updatedAt = DateTime.now().toIso8601String();
    final key = '$keyDraftPrefix${report.studentId}_${report.month}_${report.year}';
    await prefs.setString(key, jsonEncode(report.toJson()));
  }

  // استرجاع المسودة المحلية
  static Future<MonthlyReportModel?> getDraft(String studentId, int month, int year) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$keyDraftPrefix${studentId}_${month}_$year';
    final data = prefs.getString(key);
    if (data == null) return null;
    try {
      return MonthlyReportModel.fromJson(jsonDecode(data));
    } catch (_) {
      return null;
    }
  }

  // حذف المسودة فقط بعد تأكيد الحفظ بنجاح على خادم المسؤول
  static Future<void> removeDraftAfterSync(String studentId, int month, int year) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$keyDraftPrefix${studentId}_${month}_$year';
    await prefs.remove(key);
  }

  // حفظ نسخة التقرير المؤكد محلياً لعرضه دون إنترنت
  static Future<void> cacheSubmittedReport(MonthlyReportModel report) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '$keyReportsPrefix${report.id}';
    await prefs.setString(key, jsonEncode(report.toJson()));
  }

  // استرجاع كافة التقارير السابقة المخزنة محلياً
  static Future<List<MonthlyReportModel>> getCachedReports(String studentId) async {
    final prefs = await SharedPreferences.getInstance();
    final keys = prefs.getKeys().where((k) => k.startsWith(keyReportsPrefix));
    final List<MonthlyReportModel> list = [];

    for (final k in keys) {
      final str = prefs.getString(k);
      if (str != null) {
        try {
          final rep = MonthlyReportModel.fromJson(jsonDecode(str));
          if (rep.studentId == studentId) {
            list.add(rep);
          }
        } catch (_) {}
      }
    }

    list.sort((a, b) {
      if (a.year != b.year) return b.year.compareTo(a.year);
      return b.month.compareTo(a.month);
    });

    return list;
  }
}
