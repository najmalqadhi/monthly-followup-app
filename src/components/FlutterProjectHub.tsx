import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Terminal,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface FlutterProjectHubProps {
  onClose: () => void;
}

export const FlutterProjectHub: React.FC<FlutterProjectHubProps> = ({ onClose }) => {
  const [activeFile, setActiveFile] = useState<string>('pubspec.yaml');
  const [copied, setCopied] = useState(false);

  // ملفات مشروع Flutter المتطابقة مع مجلد flutter_student_app
  const files: Record<string, { path: string; language: string; content: string }> = {
    'pubspec.yaml': {
      path: '/flutter_student_app/pubspec.yaml',
      language: 'yaml',
      content: `name: motabaa_monthly_student
description: "تطبيق المتابعة الشهرية للطلاب - تطبيق أندرويد احترافي مع دعم كامل للعمل بدون إنترنت والمزامنة المحلية"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  http: ^1.2.0
  shared_preferences: ^2.2.2
  intl: ^0.19.0
  uuid: ^4.3.3
  google_fonts: ^6.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
    },
    'AndroidManifest.xml': {
      path: '/flutter_student_app/android/app/src/main/AndroidManifest.xml',
      language: 'xml',
      content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.motabaa.monthly.student">
    
    <!-- صلاحيات الاتصال بالشبكة المحلية لمزامنة التقارير مع حاسوب المسؤول -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

    <application
        android:label="المتابعة الشهرية"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true"
        android:supportsRtl="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>`,
    },
    'main.dart': {
      path: '/flutter_student_app/lib/main.dart',
      language: 'dart',
      content: `import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/student_dashboard_screen.dart';
import 'services/offline_storage.dart';
import 'models/user_model.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final savedUser = await FlutterOfflineStorage.getUser();
  runApp(MotabaaStudentApp(initialUser: savedUser));
}

class MotabaaStudentApp extends StatelessWidget {
  final UserModel? initialUser;

  const MotabaaStudentApp({Key? key, this.initialUser}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'المتابعة الشهرية',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar', 'SA'),
      supportedLocales: const [Locale('ar', 'SA')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F766E),
          primary: const Color(0xFF0F766E),
          surface: Colors.white,
        ),
        textTheme: GoogleFonts.cairoTextTheme(Theme.of(context).textTheme),
      ),
      home: initialUser != null && initialUser!.status == 'active'
          ? StudentDashboardScreen(user: initialUser!)
          : const LoginScreen(),
    );
  }
}`,
    },
    'scoring_engine.dart': {
      path: '/flutter_student_app/lib/services/scoring_engine.dart',
      language: 'dart',
      content: `import 'dart:math';
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
    return {'score': score, 'attendedCount': bounded};
  }

  // 3. الأداء الدعوي (20 نقطة)
  static Map<String, dynamic> calculateDawah(List<DawahActivityModel> activities) {
    if (activities.isEmpty) return {'score': 0.0, 'totalBeneficiaries': 0};
    int totalPts = 0;
    int beneficiaries = 0;
    for (final act in activities) {
      beneficiaries += act.beneficiariesCount;
      if (act.role == 'مقدّم') totalPts += 5;
      else if (act.role == 'منظّم') totalPts += 3;
      else totalPts += 2;
    }
    return {'score': min(20.0, max(0.0, totalPts.toDouble())), 'totalBeneficiaries': beneficiaries};
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
}`,
    },
    'offline_storage.dart': {
      path: '/flutter_student_app/lib/services/offline_storage.dart',
      language: 'dart',
      content: `import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/report_model.dart';
import '../models/user_model.dart';

class FlutterOfflineStorage {
  static const String keyCurrentUser = 'flutter_motabaa_user';
  static const String keyDraftPrefix = 'flutter_motabaa_draft_';
  static const String keyServerUrl = 'flutter_motabaa_server_url';

  static Future<void> saveDraft(MonthlyReportModel report) async {
    final prefs = await SharedPreferences.getInstance();
    report.syncStatus = 'pending_sync';
    report.updatedAt = DateTime.now().toIso8601String();
    final key = '\$keyDraftPrefix\${report.studentId}_\${report.month}_\${report.year}';
    await prefs.setString(key, jsonEncode(report.toJson()));
  }

  static Future<MonthlyReportModel?> getDraft(String studentId, int month, int year) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '\$keyDraftPrefix\${studentId}_\${month}_\$year';
    final data = prefs.getString(key);
    if (data == null) return null;
    return MonthlyReportModel.fromJson(jsonDecode(data));
  }

  // شرط حذف النسخة المؤقتة: لا تحذف إلا بعد تأكيد الخادم
  static Future<void> removeDraftAfterSync(String studentId, int month, int year) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '\$keyDraftPrefix\${studentId}_\${month}_\$year';
    await prefs.remove(key);
  }
}`,
    },
    'api_sync_service.dart': {
      path: '/flutter_student_app/lib/services/api_sync_service.dart',
      language: 'dart',
      content: `import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/report_model.dart';
import 'offline_storage.dart';

class FlutterApiSyncService {
  static Future<Map<String, dynamic>> syncReport(MonthlyReportModel report) async {
    await FlutterOfflineStorage.saveDraft(report);

    try {
      final baseUrl = await FlutterOfflineStorage.getServerUrl();
      final response = await http.post(
        Uri.parse('\$baseUrl/api/reports/submit'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(report.toJson()),
      ).timeout(const Duration(seconds: 7));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        await FlutterOfflineStorage.removeDraftAfterSync(report.studentId, report.month, report.year);
        return {'success': true, 'message': 'تمت المزامنة بنجاح مع قاعدة البيانات المركزية'};
      }
      return {'success': false, 'message': data['message'] ?? 'فشل الخادم في الحفظ'};
    } catch (_) {
      return {'success': false, 'isOffline': true, 'message': 'تم حفظ المسودة محلياً في الهاتف بأمان'};
    }
  }
}`,
    },
    'README.md': {
      path: '/flutter_student_app/README.md',
      language: 'markdown',
      content: `# تطبيق المتابعة الشهرية - كود تطبيق أندرويد (Flutter)

هذا المجلد يحتوي على الكود المصدري الكامل والمتوافق للفتح والتشغيل والنسخ المباشر إلى Android Studio.

## خطوات الفتح في Android Studio:
1. افتح برنامج Android Studio.
2. اختر Open ثم حدد المجلد flutter_student_app.
3. انتظر اكتمال فحص pubspec.yaml واضغط Pub get.
4. للبناء مباشرة كملف APK وتثبيته على الهواتف:
   flutter build apk --release
   الملف ينتج في: build/app/outputs/flutter-apk/app-release.apk`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* الترويسة */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                مشروع تطبيق أندرويد (Flutter) وجاهزية Android Studio
              </h2>
              <p className="text-xs text-slate-500">
                ملفات المشروع مهيأة بالكامل على القرص في مجلد <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-teal-800">/flutter_student_app</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم النافذة: مستكشف الملفات ومحرر الكود */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 flex-1 overflow-hidden">
          {/* قائمة الملفات */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 overflow-y-auto space-y-1 text-xs">
            <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider block mb-2 px-1">
              ملفات المشروع (Flutter)
            </span>
            {Object.keys(files).map((fileName) => (
              <button
                key={fileName}
                onClick={() => setActiveFile(fileName)}
                className={`w-full text-right px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-between transition ${
                  activeFile === fileName
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span className="truncate">{fileName}</span>
                <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </button>
            ))}
          </div>

          {/* عارض الكود */}
          <div className="md:col-span-3 bg-slate-900 rounded-xl p-4 flex flex-col overflow-hidden text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="truncate">{files[activeFile].path}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans font-bold flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>
            </div>

            <pre className="flex-1 overflow-auto pt-3 text-[11px] leading-relaxed text-slate-100 whitespace-pre font-mono dir-ltr select-all">
              {files[activeFile].content}
            </pre>
          </div>
        </div>

        {/* الشريط السفلي: تعليمات بناء APK */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Terminal className="w-4 h-4 text-teal-700" />
            <span>
              أمر بناء ملف APK مباشرة دون Google Play: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-900">flutter build apk --release</code>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
