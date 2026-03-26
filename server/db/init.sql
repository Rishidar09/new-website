-- Master Schema for IndusInnovate Technologies HR Suite
-- Version 2.0 — Full spec compliant

-- ─── 1. Profiles (Auth & Roles) ────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'hr', 'employee')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new auth columns to profiles (idempotent)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_activation'));
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_status_check;
  END IF;

  ALTER TABLE profiles
    ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'inactive', 'pending_activation'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'profiles'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'hr', 'employee'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ─── 2. Employees ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT,
  department TEXT,
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
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS dob DATE;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS pan TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS personal_email TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS technology TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS experience_years NUMERIC;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS aadhaar_card TEXT;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_revision_history_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

DO $$ BEGIN
  IF to_regclass('public.departments') IS NOT NULL
     AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'employees_department_id_fkey'
      AND table_name = 'employees'
  ) THEN
    ALTER TABLE employees
      ADD CONSTRAINT employees_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
  END IF;
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

-- ─── 2A. Departments (NEW) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO departments (name)
SELECT DISTINCT department
FROM employees
WHERE department IS NOT NULL AND TRIM(department) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE employees e
SET department_id = d.id
FROM departments d
WHERE e.department_id IS NULL
  AND e.department IS NOT NULL
  AND TRIM(e.department) <> ''
  AND d.name = e.department;

UPDATE employees
SET manager_id = reporting_manager_id
WHERE manager_id IS NULL
  AND reporting_manager_id IS NOT NULL;

UPDATE employees
SET reporting_manager_id = manager_id
WHERE reporting_manager_id IS NULL
  AND manager_id IS NOT NULL;

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

DO $$ BEGIN
  ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS casual_encashed INT DEFAULT 0;
  ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS sick_encashed INT DEFAULT 0;
  ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS earned_encashed INT DEFAULT 0;
  ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS comp_off_encashed INT DEFAULT 0;
END $$;

CREATE TABLE IF NOT EXISTS leave_encashment_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encashable_leave_types TEXT[] NOT NULL,
  max_days_per_year INT NOT NULL,
  payout_formula TEXT NOT NULL,
  updated_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_encashment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Casual', 'Sick', 'Earned', 'Comp-Off')),
  days_requested INT NOT NULL CHECK (days_requested > 0),
  encashment_amount NUMERIC NOT NULL DEFAULT 0,
  request_year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewer_comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reimbursed_payroll_id UUID REFERENCES payroll(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_encashment_requests_employee_year
  ON leave_encashment_requests(employee_id, request_year);

CREATE INDEX IF NOT EXISTS idx_leave_encashment_requests_status
  ON leave_encashment_requests(status);

CREATE INDEX IF NOT EXISTS idx_leave_encashment_requests_reimbursed
  ON leave_encashment_requests(reimbursed_payroll_id);

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

-- ─── 6A. Asset Management ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('Laptop', 'Phone', 'Monitor', 'Access Card', 'Other')),
  serial_number TEXT UNIQUE NOT NULL,
  purchase_date DATE,
  asset_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'damaged', 'retired')),
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  return_date DATE,
  condition_notes TEXT,
  assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  returned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_assignments_active_asset
  ON asset_assignments(asset_id)
  WHERE return_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_assets_type_status
  ON assets(asset_type, status);

CREATE INDEX IF NOT EXISTS idx_asset_assignments_employee_active
  ON asset_assignments(employee_id, return_date);

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
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS conveyance NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS special_allowance NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS ptax NUMERIC DEFAULT 200;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS emp_code TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS designation TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS department TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS processed_days INT DEFAULT 31;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS paid_days INT DEFAULT 31;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS pan_no TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bank_account TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS bank_name TEXT;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS pf_employee NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS pf_employer NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS esi_employee NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS esi_employer NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS reimbursements NUMERIC DEFAULT 0;
  ALTER TABLE payroll ADD COLUMN IF NOT EXISTS leave_encashment NUMERIC DEFAULT 0;
END $$;

UPDATE payroll
SET pf_employee = COALESCE(pf_employee, pf, 0)
WHERE (pf_employee IS NULL OR pf_employee = 0)
  AND COALESCE(pf, 0) > 0;

-- ─── 7A. Statutory Settings ────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll_statutory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pf_employee_rate NUMERIC NOT NULL,
  pf_employer_rate NUMERIC NOT NULL,
  esi_employee_rate NUMERIC NOT NULL,
  esi_employer_rate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_tds_slabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_from NUMERIC NOT NULL,
  income_to NUMERIC,
  rate NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 7A1. Income Tax Declarations ─────────────────────────────
CREATE TABLE IF NOT EXISTS income_tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (employee_id, financial_year)
);

CREATE TABLE IF NOT EXISTS income_tax_declaration_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id UUID NOT NULL REFERENCES income_tax_declarations(id) ON DELETE CASCADE,
  section_code TEXT NOT NULL CHECK (section_code IN ('80C', 'HRA', 'HOME_LOAN_INTEREST', 'STANDARD_DEDUCTION', 'OTHER')),
  item_label TEXT NOT NULL,
  declared_amount NUMERIC NOT NULL DEFAULT 0,
  approved_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  hr_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income_tax_declaration_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES income_tax_declaration_items(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_tax_decl_employee_year
  ON income_tax_declarations(employee_id, financial_year);

CREATE INDEX IF NOT EXISTS idx_income_tax_decl_status
  ON income_tax_declarations(status);

CREATE INDEX IF NOT EXISTS idx_income_tax_items_declaration
  ON income_tax_declaration_items(declaration_id, section_code, status);

CREATE INDEX IF NOT EXISTS idx_income_tax_proofs_item
  ON income_tax_declaration_proofs(item_id);

-- ─── 7A2. Salary Revision Workflow ─────────────────────────────
CREATE TABLE IF NOT EXISTS salary_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  proposed_basic_salary NUMERIC NOT NULL CHECK (proposed_basic_salary >= 0),
  proposed_hra NUMERIC NOT NULL CHECK (proposed_hra >= 0),
  proposed_allowances NUMERIC NOT NULL CHECK (proposed_allowances >= 0),
  proposed_total_ctc NUMERIC NOT NULL CHECK (proposed_total_ctc >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  initiated_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approver_comment TEXT,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_revisions_employee_effective
  ON salary_revisions(employee_id, effective_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salary_revisions_status
  ON salary_revisions(status, created_at DESC);

-- ─── 7B. Expense Claims & Reimbursements ───────────────────────
CREATE TABLE IF NOT EXISTS expense_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Travel', 'Food', 'Equipment', 'Other')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  description TEXT,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewer_comment TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reimbursed_payroll_id UUID REFERENCES payroll(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_claims_employee ON expense_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_claims_reimbursed ON expense_claims(reimbursed_payroll_id);

-- ─── 8. Attendance ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  check_in TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('Present', 'On Leave', 'Late', 'Half-Day')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hours_worked NUMERIC;
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location TEXT;
END $$;

-- ─── 8A. Shift Management ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee_dates
  ON employee_shift_assignments(employee_id, effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift
  ON employee_shift_assignments(shift_id);

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
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'scheduled';
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

-- ─── 29. Performance Management ─────────────────────────────────
CREATE TABLE IF NOT EXISTS appraisal_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS self_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  overall_comment TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cycle_id, employee_id)
);

CREATE TABLE IF NOT EXISTS self_appraisal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  self_appraisal_id UUID REFERENCES self_appraisals(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manager_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cycle_id, employee_id, manager_id)
);

CREATE TABLE IF NOT EXISTS manager_appraisal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_appraisal_id UUID REFERENCES manager_appraisals(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cycle_id, employee_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_goals_cycle_employee ON goals(cycle_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_self_appraisals_cycle_employee ON self_appraisals(cycle_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_appraisals_cycle_employee ON manager_appraisals(cycle_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_cycle_employee ON peer_feedback(cycle_id, employee_id);

-- ─── 30. Employee Onboarding ────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requires_document BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES onboarding_cases(id) ON DELETE CASCADE,
  template_task_id UUID REFERENCES onboarding_template_tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  requires_document BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  document_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_active_case_per_employee
  ON onboarding_cases(employee_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_onboarding_template_tasks_template ON onboarding_template_tasks(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_onboarding_case_tasks_case ON onboarding_case_tasks(case_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);

-- ─── 31. Employee Offboarding ──────────────────────────────────
CREATE TABLE IF NOT EXISTS offboarding_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  last_working_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('resignation', 'termination', 'contract_end')),
  reason_details TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  finalized_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  finalized_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES offboarding_cases(id) ON DELETE CASCADE,
  task_code TEXT NOT NULL,
  task_title TEXT NOT NULL,
  assigned_role TEXT NOT NULL CHECK (assigned_role IN ('IT', 'Finance', 'HR')),
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  is_cleared BOOLEAN NOT NULL DEFAULT FALSE,
  cleared_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  cleared_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (case_id, task_code)
);

CREATE TABLE IF NOT EXISTS offboarding_exit_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES offboarding_cases(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reason_for_leaving TEXT NOT NULL,
  experience_rating INTEGER NOT NULL CHECK (experience_rating >= 1 AND experience_rating <= 5),
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_offboarding_active_case_per_employee
  ON offboarding_cases(employee_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_offboarding_cases_status
  ON offboarding_cases(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_offboarding_checklist_case
  ON offboarding_checklist_items(case_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_offboarding_checklist_assignee
  ON offboarding_checklist_items(assigned_to, assigned_role, is_cleared);

-- ─── 32. Employee Helpdesk ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('IT Issue', 'Payroll Query', 'Leave Issue', 'General HR', 'Grievance')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS helpdesk_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS helpdesk_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_employee
  ON helpdesk_tickets(employee_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status
  ON helpdesk_tickets(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_assigned_to
  ON helpdesk_tickets(assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_category
  ON helpdesk_tickets(category, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_helpdesk_comments_ticket
  ON helpdesk_comments(ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_helpdesk_comments_user
  ON helpdesk_comments(user_id);

-- ─── 33. Employee Celebrations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_celebrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  celebration_type TEXT NOT NULL CHECK (celebration_type IN ('birthday', 'work_anniversary')),
  celebration_date DATE NOT NULL,
  announcement_id UUID REFERENCES announcements(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (employee_id, celebration_type, celebration_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_celebrations_date
  ON employee_celebrations(celebration_date, celebration_type);

-- ─── 34. Employee Surveys ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'department')),
  target_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('rating', 'mcq', 'text')),
  options_json TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (survey_id, employee_id)
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_surveys_status_target
  ON surveys(status, target_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_order
  ON survey_questions(survey_id, order_index);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey
  ON survey_responses(survey_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_answers_question
  ON survey_answers(question_id);
