import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../models/report_model.dart';
import '../services/offline_storage.dart';

class PastReportsScreen extends StatefulWidget {
  final UserModel user;

  const PastReportsScreen({Key? key, required this.user}) : super(key: key);

  @override
  State<PastReportsScreen> createState() => _PastReportsScreenState();
}

class _PastReportsScreenState extends State<PastReportsScreen> {
  List<MonthlyReportModel> _reports = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  void _loadReports() async {
    final list = await FlutterOfflineStorage.getCachedReports(widget.user.id);
    setState(() {
      _reports = list;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('سجل التقارير السابقة ومخطط التطور')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _reports.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'لا توجد تقارير سابقة معتمدة حتى الآن.\nتظهر التقارير هنا بعد تسليمها واعتمادها من المشرف.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Color(0xFF64748B), height: 1.6),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _reports.length,
                  itemBuilder: (ctx, idx) {
                    final rep = _reports[idx];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'تقرير شهر ${rep.month} / ${rep.year}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF0F766E).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${rep.totalScore} / 100 • ${rep.gradeDescription}',
                                    style: const TextStyle(
                                      color: Color(0xFF0F766E),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'الكتاب: ${rep.bookName.isNotEmpty ? rep.bookName : "لم يحدد"} (${rep.scientificPercentage}% إنجاز)',
                              style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'حضور الجلسات: ${rep.attendedSessionsCount} من 4 • الأنشطة الدعوية: ${rep.dawahActivities.length}',
                              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
