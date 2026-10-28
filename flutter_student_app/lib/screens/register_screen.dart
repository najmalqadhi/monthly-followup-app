import 'package:flutter/material.dart';
import '../services/api_sync_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  String _selectedStage = 'المرحلة الجامعية';
  bool _isLoading = false;
  String? _errorMessage;

  final List<String> _stages = [
    'المرحلة الثانوية',
    'المرحلة الجامعية',
    'مرحلة التأهيل والتدريب',
    'الدراسات العليا',
  ];

  void _handleRegister() async {
    final fullName = _fullNameController.text.trim();
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (fullName.isEmpty || username.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'يرجى تعبئة الحقول الإلزامية');
      return;
    }
    if (password.length < 6) {
      setState(() => _errorMessage = 'كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await FlutterApiSyncService.register(
      fullName: fullName,
      username: username,
      password: password,
      educationalStage: _selectedStage,
      email: _emailController.text.trim().isNotEmpty ? _emailController.text.trim() : null,
      phone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
    );

    setState(() => _isLoading = false);

    if (res['success'] == true) {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Color(0xFF0F766E)),
                SizedBox(width: 8),
                Text('تم إنشاء الحساب بنجاح'),
              ],
            ),
            content: const Text(
              'حسابك الآن بحالة «بانتظار الموافقة». سيقوم المشرف أو مسؤول النظام بمراجعة بياناتك وتفعيل الحساب قبل أن تتمكن من الدخول.',
              style: TextStyle(height: 1.5),
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context);
                },
                child: const Text('العودة لتسجيل الدخول'),
              ),
            ],
          ),
        );
      }
    } else {
      setState(() {
        _errorMessage = res['message'] ?? 'فشل إنشاء الحساب';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('تسجيل حساب طالب جديد')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                    ),
                  ),

                TextField(
                  controller: _fullNameController,
                  decoration: const InputDecoration(
                    labelText: 'الاسم الكامل *',
                    hintText: 'مثال: عبد الله أحمد باوزير',
                  ),
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _usernameController,
                  decoration: const InputDecoration(
                    labelText: 'اسم المستخدم (فريد بالإنجليزية) *',
                    hintText: 'abdullah.ahmed',
                  ),
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'كلمة المرور (6 خانات فأكثر) *',
                  ),
                ),
                const SizedBox(height: 12),

                DropdownButtonFormField<String>(
                  value: _selectedStage,
                  decoration: const InputDecoration(labelText: 'المرحلة التعليمية *'),
                  items: _stages.map((stage) {
                    return DropdownMenuItem(value: stage, child: Text(stage));
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedStage = val);
                  },
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'البريد الإلكتروني (اختياري)',
                    hintText: 'student@example.com',
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),

                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'رقم الهاتف / الواتساب (اختياري)',
                    hintText: '05xxxxxxxx',
                  ),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: _isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('إرسال طلب التسجيل', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
