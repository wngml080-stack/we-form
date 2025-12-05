-- Add columns to members table for detailed registration
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES public.staffs(id),
  ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES public.staffs(id),
  ADD COLUMN IF NOT EXISTS exercise_goal text,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS body_fat_mass numeric,
  ADD COLUMN IF NOT EXISTS skeletal_muscle_mass numeric;

-- Add member_id to schedules for session tracking
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.members(id);

-- Create permission_requests table
CREATE TABLE IF NOT EXISTS public.permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staffs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requested_permission text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.staffs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for permission_requests
ALTER TABLE public.permission_requests ENABLE ROW LEVEL SECURITY;

-- Staff can view their own requests
CREATE POLICY "Staff can view own permission requests"
  ON public.permission_requests FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.staffs WHERE id = staff_id));

-- Staff can create their own requests
CREATE POLICY "Staff can create permission requests"
  ON public.permission_requests FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.staffs WHERE id = staff_id));

-- Company admins can view all requests in their company
CREATE POLICY "Company admins can view company permission requests"
  ON public.permission_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.staffs 
      WHERE company_id = permission_requests.company_id 
      AND role IN ('company_admin', 'system_admin')
    )
  );

-- Company admins can update (approve/reject) requests
CREATE POLICY "Company admins can update permission requests"
  ON public.permission_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.staffs 
      WHERE company_id = permission_requests.company_id 
      AND role IN ('company_admin', 'system_admin')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_permission_requests_staff_id ON public.permission_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_company_id ON public.permission_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON public.permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_members_trainer_id ON public.members(trainer_id);
CREATE INDEX IF NOT EXISTS idx_members_registered_by ON public.members(registered_by);
CREATE INDEX IF NOT EXISTS idx_schedules_member_id ON public.schedules(member_id);
