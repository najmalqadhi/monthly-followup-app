import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/user_model.dart';
import '../models/report_model.dart';
import '../services/scoring_engine.dart';
import '../services/offline_storage.dart';
import '../services/api_sync_service.dart';

class MonthlyReportFormScreen extends StatefulWidget {
  final UserModel user;
  final int month;
  final int year;
  final MonthlyReportModel? existingDraft;

  const MonthlyReportFormScreen({
    Key? key,
    required this.user,
    required this.month,
    required this.year,
    this.existingDraft,
  }) : super(key: key);

  @override
  State<MonthlyReportFormScreen> createState() => _MonthlyReportFormScreenState();
}

class _MonthlyReportFormScreenState extends State<MonthlyReportFormScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late MonthlyReportModel _report;

  // المحور 1
  final _bookNameController = TextEditingController();
  final _totalPagesController = TextEditingController();
  final _pagesReadController = TextEditingController();

  // المحور 4
  final _unexcusedAbsencesController = TextEditingController();
  final _delaysController = TextEditingController();

  // المحاور الوصفية
  final _challengeDescController = TextEditingController();
  final _challengeHandlingController = TextEditingController();
  final _planGoalsController = TextEditingController();
  final _planTasksController = TextEditingController();
  final _generalSummaryController = TextEditingController();

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);

    if (widget.existingDraft != null) {
      _report = widget.existingDraft!;
    } else {
      _report = MonthlyReportModel(
        id: const Uuid().v4(),
        studentId: widget.user.id,
        studentName: widget.user.fullName,
        studentCode: widget.user.studentId,
        educationalStage: widget.user.educationalStage,
        month: widget.month,
        year: widget.year,
        academicYear: '1447-1448',
        createdAt: DateTime.now().toIso8601String(),
        updatedAt: DateTime.now().toIso8601String(),
        discussionSessions: [
          DiscussionSessionModel(sessionNumber: 1, attended: false),
          DiscussionSessionModel(sessionNumber: 2, attended: false),
          DiscussionSessionModel(sessionNumber: 3, attended: false),
          DiscussionSessionModel(sessionNumber: 4, attended: false),
        ],
        dawahActivities: [],
        culturalActivities: [],
        achievements: [],
      );
    }

    _bookNameController.text = _report.bookName;
    _totalPagesController.text = _report.totalPages > 0 ? _report.totalPages.toString() : '';
    _pagesReadController.text = _report.pagesRead > 0 ? _report.pagesRead.toString() : '';
    _unexcusedAbsencesController.text = _report.unexcusedAbsences.toString();
    _delaysController.text = _report.delaysCount.toString();
    _challengeDescController.text = _report.challengeDescription;
    _challengeHandlingController.text = _report.challengeHandling;
    _planGoalsController.text = _report.planGoals;
    _planTasksController.text = _report.planTasks;
    _generalSummaryController.text = _report.generalSummary;

    _recalculate();
  }

  void _recalculate() {
    _report.bookName = _bookNameController.text.trim();
    _report.totalPages = int.tryParse(_totalPagesController.text) ?? 0;
    _report.pagesRead = int.tryParse(_pagesReadController.text) ?? 0;
    _report.unexcusedAbsences = int.tryParse(_unexcusedAbsencesController.text) ?? 0;
    _report.delaysCount = int.tryParse(_delaysController.text) ?? 0;
    _report.challengeDescription = _challengeDescController.text.trim();
    _report.challengeHandling = _challengeHandlingController.text.trim();
    _report.planGoals = _planGoalsController.text.trim();
    _report.planTasks = _planTasksController.text.trim();
    _report.generalSummary = _generalSummaryController.text.trim();

    FlutterScoringEngine.recalculate(_report);
    setState(() {});
  }

  void _saveDraft() async {
    _recalculate();
    setState(() => _isSaving = true);
    await FlutterOfflineStorage.saveDraft(_report);
    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم حفظ المسودة تلقائياً في التخزين المحلي للهاتف.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _submitReport() async {
    _recalculate();

    if (_report.bookName.isEmpty) {
      _showError('يرجى إدخال اسم الكتاب في المحور العلمي.');
      _tabController.animateTo(0);
      return;
    }
    if (_report.totalPages <= 0) {
      _showError('إجمالي صفحات الكتاب يجب أن يكون أكبر من صفر.');
      _tabController.animateTo(0);
      return;
    }
    if (_report.pagesRead > _report.totalPages) {
      _showError('عدد الصفحات المقروءة لا يمكن أن يتجاوز إجمالي صفحات الكتاب.');
      _tabController.animateTo(0);
      return;
    }

    setState(() => _isSaving = true);
    final res = await FlutterApiSyncService.syncReport(_report);
    setState(() => _isSaving = false);

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: Row(
            children: [
              Icon(
                res['success'] == true ? Icons.check_circle : Icons.offline_pin,
                color: const Color(0xFF0F766E),
              ),
              const SizedBox(width: 8),
              Text(res['success'] == true ? 'تم تسليم التقرير' : 'حفظ التقرير محلياً'),
            ],
          ),
          content: Text(res['message'] ?? '', style: const TextStyle(height: 1.5)),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('العودة للوحة المتابعة'),
            ),
          ],
        ),
      );
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(backgroundColor: const Color(0xFFDC2626), content: Text(msg)),
    );
  }

  // إضافة نشاط دعوي
  void _showAddDawahDialog() {
    String type = 'خطبة';
    String role = 'مقدّم';
    final titleCtrl = TextEditingController();
    final groupCtrl = TextEditingController();
    final countCtrl = TextEditingController(text: '50');

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) => AlertDialog(
          title: const Text('إضافة نشاط دعوي'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'نوع النشاط'),
                  items: ['خطبة', 'محاضرة', 'ندوة', 'درس دعوي', 'موعظة', 'نشاط دعوي آخر']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (v) => setDlgState(() => type = v!),
                ),
                const SizedBox(height: 10),
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'عنوان أو موضوع النشاط *')),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: role,
                  decoration: const InputDecoration(labelText: 'دور الطالب'),
                  items: [
                    const DropdownMenuItem(value: 'مقدّم', child: Text('مقدّم (5 نقاط)')),
                    const DropdownMenuItem(value: 'منظّم', child: Text('منظّم (3 نقاط)')),
                    const DropdownMenuItem(value: 'مشارك', child: Text('مشارك (2 نقطة)')),
                  ],
                  onChanged: (v) => setDlgState(() => role = v!),
                ),
                const SizedBox(height: 10),
                TextField(controller: groupCtrl, decoration: const InputDecoration(labelText: 'الفئة المستهدفة')),
                const SizedBox(height: 10),
                TextField(
                  controller: countCtrl,
                  decoration: const InputDecoration(labelText: 'عدد المستفيدين التقريبي'),
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
            ElevatedButton(
              onPressed: () {
                if (titleCtrl.text.trim().isEmpty) return;
                _report.dawahActivities.add(DawahActivityModel(
                  id: const Uuid().v4(),
                  type: type,
                  date: DateTime.now().toString().substring(0, 10),
                  title: titleCtrl.text.trim(),
                  role: role,
                  targetGroup: groupCtrl.text.trim(),
                  beneficiariesCount: int.tryParse(countCtrl.text) ?? 0,
                ));
                _recalculate();
                Navigator.pop(ctx);
              },
              child: const Text('إضافة'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('تقرير شهر ${widget.month} / ${widget.year}'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: const Color(0xFF0F766E),
          indicatorColor: const Color(0xFF0F766E),
          tabs: const [
            Tab(text: 'العلمي والمناقشة'),
            Tab(text: 'الدعوي والالتزام'),
            Tab(text: 'الثقافي والإنجازات'),
            Tab(text: 'التحديات والخطة'),
            Tab(text: 'الملخص والدرجة'),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        ),
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('المجموع الحالي', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                Text(
                  '${_report.totalScore} / 100 (${_report.gradeDescription})',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E), fontSize: 13),
                ),
              ],
            ),
            const Spacer(),
            OutlinedButton(
              onPressed: _isSaving ? null : _saveDraft,
              child: const Text('حفظ كمسودة'),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: _isSaving ? null : _submitReport,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F766E),
                foregroundColor: Colors.white,
              ),
              child: const Text('إرسال التقرير'),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // تبويب 1: العلمي وجلسات المناقشة
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // المحور العلمي
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المحور الأول: الأداء العلمي (30 نقطة)', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_report.scientificScore} / 30', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _bookNameController,
                          decoration: const InputDecoration(labelText: 'اسم الكتاب أو المقرر *'),
                          onChanged: (_) => _recalculate(),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _totalPagesController,
                                decoration: const InputDecoration(labelText: 'إجمالي صفحات الكتاب *'),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => _recalculate(),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                controller: _pagesReadController,
                                decoration: const InputDecoration(labelText: 'الصفحات المقروءة هذا الشهر *'),
                                keyboardType: TextInputType.number,
                                onChanged: (_) => _recalculate(),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'نسبة الإنجاز: ${_report.scientificPercentage}%',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // جلسات المناقشة
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المحور الثاني: جلسات المناقشة (20 نقطة)', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_report.discussionScore} / 20', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('أربع جلسات ثابتة شهرياً. كل جلسة حاضر (5 نقاط) أو غائب (0):', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        const SizedBox(height: 10),
                        for (int i = 0; i < _report.discussionSessions.length; i++)
                          CheckboxListTile(
                            dense: true,
                            title: Text('الجلسة رقم ${i + 1}'),
                            subtitle: Text(_report.discussionSessions[i].attended ? 'حاضر (5 نقاط)' : 'غائب (0)'),
                            value: _report.discussionSessions[i].attended,
                            activeColor: const Color(0xFF0F766E),
                            onChanged: (val) {
                              _report.discussionSessions[i].attended = val ?? false;
                              _recalculate();
                            },
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // تبويب 2: الدعوي والالتزام
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المحور الثالث: الأداء الدعوي (20 نقطة)', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_report.dawahScore} / 20', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton.icon(
                          onPressed: _showAddDawahDialog,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('إضافة نشاط دعوي'),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
                        ),
                        const SizedBox(height: 10),
                        if (_report.dawahActivities.isEmpty)
                          const Text('لم تسجل أنشطة دعوية بعد. إذا لم تنفذ نشاطاً تحصل على 0.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B)))
                        else
                          for (int i = 0; i < _report.dawahActivities.length; i++)
                            ListTile(
                              dense: true,
                              title: Text(_report.dawahActivities[i].title),
                              subtitle: Text('${_report.dawahActivities[i].type} • دور: ${_report.dawahActivities[i].role}'),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () {
                                  _report.dawahActivities.removeAt(i);
                                  _recalculate();
                                },
                              ),
                            ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المحور الرابع: الالتزام والانضباط (10 نقاط)', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_report.disciplineScore} / 10', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _unexcusedAbsencesController,
                          decoration: const InputDecoration(labelText: 'عدد مرات الغياب غير المبرر (خصم 1.5)'),
                          keyboardType: TextInputType.number,
                          onChanged: (_) => _recalculate(),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _delaysController,
                          decoration: const InputDecoration(labelText: 'عدد مرات التأخر عن المواعيد (خصم 0.5)'),
                          keyboardType: TextInputType.number,
                          onChanged: (_) => _recalculate(),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // تبويب 3: الثقافي والإنجازات
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المحور السادس: الأنشطة الثقافية والاجتماعية (5 نقاط)', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_report.culturalScore} / 5', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('عدد الأنشطة المسجلة: ${_report.culturalActivities.length} (كل نشاط 2.5 نقطة)', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المحور السابع: الإنجازات الشهرية (5 نقاط)', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('${_report.achievementsScore} / 5', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('عدد الإنجازات المسجلة: ${_report.achievements.length} (كل إنجاز 2.5 نقطة)', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // تبويب 4: التحديات والخطة (وصفي)
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('المحور الثامن: التحديات والصعوبات (وصفي)', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _challengeDescController,
                          maxLines: 2,
                          decoration: const InputDecoration(labelText: 'التحدي أو الصعوبة التي واجهتك'),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _challengeHandlingController,
                          maxLines: 2,
                          decoration: const InputDecoration(labelText: 'كيف تعاملت معها؟ وما هو الدعم المطلوب؟'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('المحور التاسع: خطة الشهر القادم (وصفي)', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _planGoalsController,
                          maxLines: 2,
                          decoration: const InputDecoration(labelText: 'الأهداف والمهام المراد إنجازها'),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _planTasksController,
                          maxLines: 2,
                          decoration: const InputDecoration(labelText: 'خطة التحسين والدعم المطلوب'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // تبويب 5: الملخص الشامل والدرجة
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  color: const Color(0xFF0F766E).withOpacity(0.06),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      children: [
                        const Text('الدرجة النهائية المحتسبة', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                        const SizedBox(height: 8),
                        Text(
                          '${_report.totalScore}',
                          style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                        ),
                        Text(
                          _report.gradeDescription,
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('المحور العاشر: الإنجاز العام والملاحظات', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _generalSummaryController,
                          maxLines: 3,
                          decoration: const InputDecoration(labelText: 'ملخص إنجازك العام للشهر وملاحظاتك الإضافية'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
