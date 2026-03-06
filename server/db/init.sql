-- Master Schema for IndusInnovate Technologies HR Suite
-- Version 2.0 — Full spec compliant

-- ─── 1. Profiles (Auth & Roles) ────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('hr', 'employee')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new auth columns to profiles (idempotent)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- ─── 2. Employees ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT,
  department TEXT DEFAULT 'Engineering',
  phone TEXT,
  joining_date DATE,
  salary NUMERIC,
  status TEXT DEFAULT 'Active',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS designation TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS dob DATE;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- ─── 3. Leaves ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT CHECK (leave_type IN ('Sick', 'Casual', 'Earned', 'Comp-Off')),
  start_date DATE,
  end_date DATE,
  days NUMERIC,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  attachment_url TEXT,
  reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE leaves ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL;
  ALTER TABLE leaves ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
END $$;

-- ─── 4. Leave Balances (NEW) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  year INT NOT NULL,
  casual_total INT DEFAULT 12,
  casual_used INT DEFAULT 0,
  sick_total INT DEFAULT 12,
  sick_used INT DEFAULT 0,
  earned_total INT DEFAULT 15,
  earned_used INT DEFAULT 0,
  comp_off_total INT DEFAULT 0,
  comp_off_used INT DEFAULT 0,
  UNIQUE(employee_id, year)
);

-- ─── 5. Holidays ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'National',
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 6. Documents ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  file_url TEXT NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending',
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path TEXT;
END $$;

-- ─── 7. Payroll ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC NOT NULL,
  hra NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  pf NUMERIC DEFAULT 0,
  tds NUMERIC DEFAULT 0,
  gross_salary NUMERIC NOT NULL,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES profiles(id);
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
END $$;

-- ─── 8. Attendance ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('Present', 'Absent', 'Late', 'Half-Day')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hours_worked NUMERIC;
END $$;

-- ─── 9. Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  deadline DATE,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'On-Hold')),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id) ON DELETE SET NULL;
END $$;

-- ─── 10. Project Members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role TEXT,
  PRIMARY KEY (project_id, employee_id)
);

DO $$ BEGIN
  ALTER TABLE project_members ADD COLUMN IF NOT EXISTS role_in_project TEXT;
  ALTER TABLE project_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- ─── 11. Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
END $$;

-- ─── 12. Daily Reports ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  work_done TEXT NOT NULL,
  hours NUMERIC NOT NULL,
  blockers TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
  ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS hours_spent NUMERIC;
END $$;

-- ─── 13. Offer Letters ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offer_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  ctc NUMERIC NOT NULL,
  joining_date DATE NOT NULL,
  status TEXT DEFAULT 'Generated' CHECK (status IN ('Generated', 'Sent', 'Accepted', 'Declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE offer_letters ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE offer_letters ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'offer' CHECK (type IN ('offer', 'joining'));
  ALTER TABLE offer_letters ADD COLUMN IF NOT EXISTS file_path TEXT;
  ALTER TABLE offer_letters ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES profiles(id);
END $$;

-- ─── 14. Complaints ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL;
  ALTER TABLE complaints ADD COLUMN IF NOT EXISTS attachment TEXT;
END $$;

-- ─── 15. Audit Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  ip_address TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
END $$;

-- ─── 16. Chat Groups ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id) ON DELETE SET NULL;
END $$;

-- ─── 17. Chat Group Members ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_group_members (
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, employee_id)
);

DO $$ BEGIN
  ALTER TABLE chat_group_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- ─── 18. Messages ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment TEXT;
END $$;

-- ─── 19. Meetings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  agenda TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60,
  room_url TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS duration_minutes INT;
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_link TEXT;
END $$;

-- ─── 20. Meeting Participants ────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_participants (
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, employee_id)
);

-- ─── 21. Folders (Drive) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  is_company BOOLEAN DEFAULT FALSE,
  is_hr_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 22. Files (Drive) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  size BIGINT NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE files ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
  ALTER TABLE files ADD COLUMN IF NOT EXISTS folder TEXT;
END $$;

-- ─── 23. File Shares ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_shares (
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES employees(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (file_id, employee_id)
);

-- ─── 24. Notifications (NEW) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 25. Token Blacklist (NEW) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  invalidated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ─── 26. Password Reset Tokens (NEW) ────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 27. Leave Balances with unique idx ──────────────────────────
-- Already created above, this ensures no dupe index
CREATE INDEX IF NOT EXISTS idx_leave_bal_emp_year ON leave_balances(employee_id, year);

-- ─── 28. Announcements (NEW) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 28. Auto-cleanup old blacklisted tokens ────────────────────
-- Run periodically; handled in application layer
