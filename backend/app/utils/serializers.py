def organization_to_dict(organization):
    if organization is None:
        return None

    return {
        "id": str(organization.id),
        "name": organization.name,
        "domain": organization.domain,
        "is_active": organization.is_active,
        "created_at": organization.created_at.isoformat() if organization.created_at else None,
        "updated_at": organization.updated_at.isoformat() if organization.updated_at else None,
    }


def profile_to_dict(profile):
    if profile is None:
        return None

    return {
        "id": str(profile.id),
        "organization_id": str(profile.organization_id),
        "email": profile.email,
        "full_name": profile.full_name,
        "avatar_url": profile.avatar_url,
        "role": profile.role,
        "is_active": profile.is_active,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


def department_to_dict(department):
    if department is None:
        return None

    return {
        "id": str(department.id),
        "organization_id": str(department.organization_id),
        "name": department.name,
        "code": department.code,
        "is_active": department.is_active,
        "created_at": department.created_at.isoformat() if department.created_at else None,
        "updated_at": department.updated_at.isoformat() if department.updated_at else None,
    }


def course_to_dict(course, include_department=False):
    if course is None:
        return None

    result = {
        "id": str(course.id),
        "organization_id": str(course.organization_id),
        "department_id": str(course.department_id) if course.department_id else None,
        "name": course.name,
        "code": course.code,
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "updated_at": course.updated_at.isoformat() if course.updated_at else None,
    }

    if include_department:
        result["department"] = department_to_dict(getattr(course, "department", None))

    return result


def teacher_to_dict(teacher, include_department=False, include_profile=False):
    if teacher is None:
        return None

    result = {
        "id": str(teacher.id),
        "organization_id": str(teacher.organization_id),
        "profile_id": str(teacher.profile_id) if teacher.profile_id else None,
        "teacher_id": teacher.teacher_id,
        "full_name": teacher.full_name,
        "email": teacher.email,
        "department_id": str(teacher.department_id) if teacher.department_id else None,
        "designation": teacher.designation,
        "is_active": teacher.is_active,
        "created_at": teacher.created_at.isoformat() if teacher.created_at else None,
        "updated_at": teacher.updated_at.isoformat() if teacher.updated_at else None,
    }

    if include_department:
        result["department"] = department_to_dict(getattr(teacher, "department", None))

    if include_profile:
        result["profile"] = profile_to_dict(getattr(teacher, "profile", None))

    return result


def student_to_dict(student, include_department=False, include_profile=False):
    if student is None:
        return None

    result = {
        "id": str(student.id),
        "organization_id": str(student.organization_id),
        "profile_id": str(student.profile_id) if student.profile_id else None,
        "student_id": student.student_id,
        "full_name": student.full_name,
        "email": student.email,
        "roll_number": student.roll_number,
        "department_id": str(student.department_id) if student.department_id else None,
        "is_active": student.is_active,
        "created_at": student.created_at.isoformat() if student.created_at else None,
        "updated_at": student.updated_at.isoformat() if student.updated_at else None,
    }

    if include_department:
        result["department"] = department_to_dict(getattr(student, "department", None))

    if include_profile:
        result["profile"] = profile_to_dict(getattr(student, "profile", None))

    return result


def attendance_session_to_dict(session, include_course=False, include_teacher=False):
    if session is None:
        return None

    result = {
        "id": str(session.id),
        "organization_id": str(session.organization_id),
        "course_id": str(session.course_id) if session.course_id else None,
        "teacher_id": str(session.teacher_id) if session.teacher_id else None,
        "date": session.date.isoformat() if session.date else None,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }

    if include_course:
        result["course"] = course_to_dict(getattr(session, "course", None))

    if include_teacher:
        result["teacher"] = teacher_to_dict(getattr(session, "teacher", None))

    return result


def attendance_to_dict(attendance, include_session=False, include_student=False):
    if attendance is None:
        return None

    result = {
        "id": str(attendance.id),
        "organization_id": str(attendance.organization_id),
        "session_id": str(attendance.session_id),
        "student_id": str(attendance.student_id),
        "status": attendance.status,
        "created_at": attendance.created_at.isoformat() if attendance.created_at else None,
        "updated_at": attendance.updated_at.isoformat() if attendance.updated_at else None,
    }

    if include_session:
        result["session"] = attendance_session_to_dict(getattr(attendance, "session", None))

    if include_student:
        result["student"] = student_to_dict(getattr(attendance, "student", None))

    return result


def leave_request_to_dict(leave_request, include_student=False, include_reviewer=False):
    if leave_request is None:
        return None

    result = {
        "id": str(leave_request.id),
        "organization_id": str(leave_request.organization_id),
        "student_id": str(leave_request.student_id),
        "start_date": leave_request.start_date.isoformat() if leave_request.start_date else None,
        "end_date": leave_request.end_date.isoformat() if leave_request.end_date else None,
        "reason": leave_request.reason,
        "status": leave_request.status,
        "reviewed_by": str(leave_request.reviewed_by) if leave_request.reviewed_by else None,
        "created_at": leave_request.created_at.isoformat() if leave_request.created_at else None,
        "updated_at": leave_request.updated_at.isoformat() if leave_request.updated_at else None,
    }

    if include_student:
        result["student"] = student_to_dict(getattr(leave_request, "student", None))

    if include_reviewer:
        result["reviewed_by_profile"] = profile_to_dict(getattr(leave_request, "reviewer", None))

    return result


def audit_log_to_dict(audit_log, include_actor=False):
    if audit_log is None:
        return None

    result = {
        "id": str(audit_log.id),
        "organization_id": str(audit_log.organization_id),
        "actor_id": str(audit_log.actor_id) if audit_log.actor_id else None,
        "action": audit_log.action,
        "resource": audit_log.resource,
        "ip_address": audit_log.ip_address,
        "created_at": audit_log.created_at.isoformat() if audit_log.created_at else None,
    }

    if include_actor:
        result["actor"] = profile_to_dict(getattr(audit_log, "actor", None))

    return result
