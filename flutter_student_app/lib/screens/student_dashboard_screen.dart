import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../models/report_model.dart';
import '../services/offline_storage.dart';
import '../services/api_sync_service.dart';
import 'monthly_report_form_screen.dart';
import 'past_reports_screen.dart';
import 'login_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  final UserModel user;

  const StudentDashboardScreen({Key? key, required this.user}) : super(key: key);

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  MonthlyReportModel? _currentDraft;
  List<MonthlyReportModel> _pastReports = [];
  bool _isLoading = true;
  bool _isServerOnline = false;

  final int _currentMonth = 10;
  final int _currentYear = 2026;

  @override
  void initState() {
    super.initState();
    _loadData();
    _checkServer();
  }

  void _checkServer() async {
    final online = await FlutterApiSyncService.testConnection();
    if (mounted) setState(() => _isServerOnline = online);
  }

  void _loadData() async {
    setState(() => _isLoading = true);
    final draft = await FlutterOfflineStorage.getDraft(widget.user.id, _currentMonth, _currentYear);
    final past = await FlutterOfflineStorage.getCachedReports(widget.user.id);

    setState(() {
      _currentDraft = draft;
      _pastReports = past;
      _isLoading = false;
    });
  }

  void _handleLogout() async {
    await FlutterOfflineStorage.clearUser();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final latestReport = _pastReports.isNotEmpty ? _pastReports.first : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة المتابعة الشهرية'),
        actions: [
          IconButton(
            icon: Icon(
              _isServerOnline ? Icons.cloud_done : Icons.cloud_off,
              color: _isServerOnline ? const Color(0xFF0F766E) : const Color(0xFFE11D48),
            ),
            tooltip: _isServerOnline ? 'متصل بجهاز المسؤول' : 'وضع العمل دون إنترنت',
            onPressed: _checkServer,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'تسجيل الخروج',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                _loadData();
                _checkServer();
              },
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 600),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // بطاقة بيانات الطالب
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 28,
                                  backgroundColor: const Color(0xFF0F766E).withOpacity(0.12),
                                  child: const Icon(Icons.person, size: 32, color: Color(0xFF0F766E)),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        widget.user.fullName,
                                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'الرقم: ${widget.user.studentId} • ${widget.user.educationalStage}',
                                        style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // بطاقة حالة تقرير الشهر الحالي
                        Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: const BorderSide(color: Color(0xFF0F766E), width: 1.2),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'تقرير شهر $_currentMonth / $_currentYear',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _currentDraft != null
                                            ? const Color(0xFFFEF3C7)
                                            : const Color(0xFFE0F2FE),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        _currentDraft != null ? 'مسودة محفوظة محلياً' : 'تقرير جديد مطلوب',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: _currentDraft != null
                                              ? const Color(0xFFB45309)
                                              : const Color(0xFF0369A1),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  _currentDraft != null
                                      ? 'توجد مسودة غير مكتملة محفوظة تلقائياً على هذا الهاتف. يمكنك استكمال التعبئة والإرسال في أي وقت.'
                                      : 'ابدأ الآن بتسجيل إنجازاتك وقراءاتك العلمية وأنشطتك الدعوية لشهر $_currentMonth.',
                                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.5),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => MonthlyReportFormScreen(
                                          user: widget.user,
                                          month: _currentMonth,
                                          year: _currentYear,
                                          existingDraft: _currentDraft,
                                        ),
                                      ),
                                    ).then((_) => _loadData());
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F766E),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                                  ),
                                  icon: Icon(_currentDraft != null ? Icons.edit_note : Icons.add_circle_outline),
                                  label: Text(_currentDraft != null ? 'متابعة التقرير الحالي' : 'إنشاء تقرير شهري جديد'),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // بطاقة آخر درجة معتمدة (إن وجدت)
                        if (latestReport != null) ...[
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'آخر نتيجة معتمدة (شهر ${latestReport.month})',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0F766E).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Text(
                                          latestReport.gradeDescription,
                                          style: const TextStyle(
                                            color: Color(0xFF0F766E),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  Row(
                                    children: [
                                      Text(
                                        '${latestReport.totalScore}',
                                        style: const TextStyle(
                                          fontSize: 36,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF0F766E),
                                        ),
                                      ),
                                      const Text(
                                        ' / 100',
                                        style: TextStyle(fontSize: 18, color: Color(0xFF94A3B8)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  const Divider(),
                                  const SizedBox(height: 8),
                                  _buildScoreRow('الأداء العلمي', latestReport.scientificScore, 30),
                                  _buildScoreRow('جلسات المناقشة', latestReport.discussionScore, 20),
                                  _buildScoreRow('الأداء الدعوي', latestReport.dawahScore, 20),
                                  _buildScoreRow('الالتزام والانضباط', latestReport.disciplineScore, 10),
                                  _buildScoreRow('الأداء الأخلاقي (المشرف)', latestReport.moralScore, 10),
                                  _buildScoreRow('الأنشطة الثقافية', latestReport.culturalScore, 5),
                                  _buildScoreRow('الإنجازات الشهرية', latestReport.achievementsScore, 5),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // زر الانتقال لسجل التقارير السابقة
                        OutlinedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => PastReportsScreen(user: widget.user),
                              ),
                            );
                          },
                          icon: const Icon(Icons.history, color: Color(0xFF0F766E)),
                          label: const Text(
                            'عرض سجل التقارير السابقة ومخطط التطور',
                            style: TextStyle(color: Color(0xFF0F766E), fontWeight: FontWeight.bold),
                          ),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildScoreRow(String label, double score, int max) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
          Text('$score / $max', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
