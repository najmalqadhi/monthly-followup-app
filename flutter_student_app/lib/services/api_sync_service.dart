import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/report_model.dart';
import '../models/user_model.dart';
import 'offline_storage.dart';

class FlutterApiSyncService {
  // فحص الاتصال بجهاز المسؤول
  static Future<bool> testConnection() async {
    try {
      final baseUrl = await FlutterOfflineStorage.getServerUrl();
      final uri = Uri.parse('$baseUrl/api/health');
      final response = await http.get(uri).timeout(const Duration(seconds: 3));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // تسجيل حساب جديد
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String username,
    required String password,
    required String educationalStage,
    String? email,
    String? phone,
  }) async {
    try {
      final baseUrl = await FlutterOfflineStorage.getServerUrl();
      final uri = Uri.parse('$baseUrl/api/register');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fullName': fullName,
          'username': username,
          'password': password,
          'educationalStage': educationalStage,
          'email': email,
          'phone': phone,
        }),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'message': data['message'], 'user': UserModel.fromJson(data['user'])};
      } else {
        return {'success': false, 'message': data['message'] ?? 'فشل إنشاء الحساب'};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'تعذر الاتصال بخادم المسؤول على الشبكة المحلية. تأكد من تشغيل الخادم وتطابق عنوان IP.',
      };
    }
  }

  // تسجيل الدخول
  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final baseUrl = await FlutterOfflineStorage.getServerUrl();
      final uri = Uri.parse('$baseUrl/api/login');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        final user = UserModel.fromJson(data['user']);
        await FlutterOfflineStorage.saveUser(user);
        return {'success': true, 'user': user};
      } else {
        return {'success': false, 'message': data['message'] ?? 'بيانات الدخول غير صحيحة أو الحساب بانتظار الموافقة'};
      }
    } catch (_) {
      // فحص إذا كان المستخدم مسجلاً محلياً مسبقاً
      final localUser = await FlutterOfflineStorage.getUser();
      if (localUser != null && localUser.username.toLowerCase() == username.toLowerCase().trim()) {
        return {
          'success': true,
          'user': localUser,
          'isOffline': true,
          'message': 'تم تسجيل الدخول في وضع العمل دون اتصال بالإنترنت',
        };
      }
      return {
        'success': false,
        'message': 'تعذر الاتصال بجهاز المسؤول ولا توجد جلسة دخول سابقة مخزنة على هذا الهاتف.',
      };
    }
  }

  // إرسال ومزامنة التقرير الشهري
  static Future<Map<String, dynamic>> syncReport(MonthlyReportModel report) async {
    // 1. حفظ نسخة مسودة محلية أولاً
    await FlutterOfflineStorage.saveDraft(report);

    try {
      final baseUrl = await FlutterOfflineStorage.getServerUrl();
      final uri = Uri.parse('$baseUrl/api/reports/submit');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(report.toJson()),
      ).timeout(const Duration(seconds: 7));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        report.syncStatus = 'synced';
        report.status = 'submitted';

        // 2. لا نحذف المسودة المؤقتة إلا بعد تأكيد الحفظ على الخادم المركزي
        await FlutterOfflineStorage.removeDraftAfterSync(report.studentId, report.month, report.year);
        await FlutterOfflineStorage.cacheSubmittedReport(report);

        return {'success': true, 'message': 'تمت المزامنة بنجاح مع قاعدة البيانات المركزية للمسؤول'};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'رفض الخادم استلام التقرير، تم الاحتفاظ بالمسودة محلياً بأمان.',
        };
      }
    } catch (e) {
      // فشل الاتصال: البيانات تظل محفوظة محلياً
      return {
        'success': false,
        'isOffline': true,
        'message': 'تم حفظ التقرير في مسودات الهاتف بأمان. ستتم المزامنة تلقائياً عند استعادة الاتصال بجهاز المسؤول.',
      };
    }
  }
}
