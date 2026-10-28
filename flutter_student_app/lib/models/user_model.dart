class UserModel {
  final String id;
  final String studentId;
  final String fullName;
  final String username;
  final String? email;
  final String? phone;
  final String role; // 'student'
  final String status; // 'pending' | 'active' | 'suspended'
  final String educationalStage;
  final String? supervisorName;
  final String createdAt;

  UserModel({
    required this.id,
    required this.studentId,
    required this.fullName,
    required this.username,
    this.email,
    this.phone,
    required this.role,
    required this.status,
    required this.educationalStage,
    this.supervisorName,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      studentId: json['studentId'] ?? '',
      fullName: json['fullName'] ?? '',
      username: json['username'] ?? '',
      email: json['email'],
      phone: json['phone'],
      role: json['role'] ?? 'student',
      status: json['status'] ?? 'pending',
      educationalStage: json['educationalStage'] ?? '',
      supervisorName: json['supervisorName'],
      createdAt: json['createdAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studentId': studentId,
      'fullName': fullName,
      'username': username,
      'email': email,
      'phone': phone,
      'role': role,
      'status': status,
      'educationalStage': educationalStage,
      'supervisorName': supervisorName,
      'createdAt': createdAt,
    };
  }
}
