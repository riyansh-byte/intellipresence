-- =====================================================================
-- ATTENDAI ENTERPRISE SaaS SCHEMA
-- TARGET PLATFORM: Supabase PostgreSQL (15+)
-- FEATURES: Multi-tenant, soft-deletes, full indexing, Row-Level Security
-- =====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────
-- 1. ROOT MULTI-TENANT TABLES
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. USER & ACCESS ROLE CONTROL
-- ─────────────────────────────────────────────────────────────────────

-- Extension of Supabase auth.users metadata
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Maps directly to auth.users.id
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'student' NOT NULL CHECK (role IN ('org_admin', 'teacher', 'student')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. ACADEMIC DIVISIONS & DEPARTMENTS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (organization_id, code)
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (organization_id, code)
);

-- ─────────────────────────────────────────────────────────────────────
-- 4. DOMAIN ENTITY SPECIFICATIONS
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    teacher_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(150),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    roll_number VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (organization_id, roll_number)
);

-- ─────────────────────────────────────────────────────────────────────
-- 5. ATTENDANCE & LEAVES TRANSACTIONAL
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'holiday')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (session_id, student_id)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────
-- 6. SYSTEM LOGGING & MONITORING
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────
-- 6.5 USER INVITATIONS SYSTEM
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inviter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('teacher', 'student')),
    -- Additional role-specific data
    teacher_id VARCHAR(50),
    student_id VARCHAR(50),
    roll_number VARCHAR(100),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(150),
    -- Invitation status
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (organization_id, email)
);

-- ─────────────────────────────────────────────────────────────────────
-- 7. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_students_org ON students(organization_id);
CREATE INDEX idx_teachers_org ON teachers(organization_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_leave_student ON leave_requests(student_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ─────────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS) FOR MULTI-TENANCY
-- ─────────────────────────────────────────────────────────────────────

-- Enable RLS on all primary tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Creating Tenant Security Access Policies
-- RLS Policy: Profiles access isolation
CREATE POLICY profile_tenant_isolation ON profiles
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Departments access isolation
CREATE POLICY department_tenant_isolation ON departments
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Courses access isolation
CREATE POLICY course_tenant_isolation ON courses
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Students access isolation
CREATE POLICY student_tenant_isolation ON students
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Teachers access isolation
CREATE POLICY teacher_tenant_isolation ON teachers
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Sessions access isolation
CREATE POLICY session_tenant_isolation ON attendance_sessions
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Attendance records access isolation
CREATE POLICY attendance_tenant_isolation ON attendance
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Leave requests access isolation
CREATE POLICY leave_tenant_isolation ON leave_requests
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS Policy: Audit logs access isolation
CREATE POLICY audit_tenant_isolation ON audit_logs
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Invitations access isolation
CREATE POLICY invitation_tenant_isolation ON invitations
    FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
