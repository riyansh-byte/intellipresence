from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False, unique=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    deleted_at = Column(DateTime(timezone=True))


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(Text)
    role = Column(String(50), nullable=False, default="student")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    deleted_at = Column(DateTime(timezone=True))

    organization = relationship("Organization")

    __table_args__ = (
        CheckConstraint("role IN ('org_admin', 'teacher', 'student')", name="profiles_role_check"),
    )


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    deleted_at = Column(DateTime(timezone=True))

    __table_args__ = (UniqueConstraint("organization_id", "code", name="departments_organization_id_code_key"),)


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())

    __table_args__ = (UniqueConstraint("organization_id", "code", name="courses_organization_id_code_key"),)


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), unique=True)
    teacher_id = Column(String(50), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"))
    designation = Column(String(150))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), unique=True)
    student_id = Column(String(50), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    roll_number = Column(String(100), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"))
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())

    __table_args__ = (UniqueConstraint("organization_id", "roll_number", name="students_organization_id_roll_number_key"),)


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"))
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="SET NULL"))
    date = Column(Date, nullable=False, server_default=func.current_date())
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())

    __table_args__ = (
        CheckConstraint("status IN ('present', 'absent', 'late', 'excused', 'holiday')", name="attendance_status_check"),
        UniqueConstraint("session_id", "student_id", name="attendance_session_id_student_id_key"),
    )


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="leave_requests_status_check"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    action = Column(String(255), nullable=False)
    resource = Column(String(150), nullable=False)
    ip_address = Column(String(45), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    inviter_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    email = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    teacher_id = Column(String(50), nullable=True)
    student_id = Column(String(50), nullable=True)
    roll_number = Column(String(100), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(150), nullable=True)
    status = Column(String(50), nullable=False, default="pending")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="invitations_organization_id_email_key"),
        CheckConstraint("role IN ('teacher', 'student')", name="invitations_role_check"),
        CheckConstraint("status IN ('pending', 'accepted', 'expired', 'cancelled')", name="invitations_status_check"),
    )
