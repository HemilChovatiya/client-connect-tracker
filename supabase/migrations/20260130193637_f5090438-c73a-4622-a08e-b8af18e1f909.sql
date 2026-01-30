
-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'manager', 'collector');

-- Create status enums
CREATE TYPE public.collector_status AS ENUM ('active', 'traveling', 'offline', 'idle');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Create user_roles table (critical for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table (tenants)
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_years table
CREATE TABLE public.financial_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (customer_id, label)
);

-- Create modules table
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permissions table (module-wise permissions per customer/role)
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_add BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_print BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (customer_id, role, module_id)
);

-- Create customer_users table (users belonging to customers)
CREATE TABLE public.customer_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'collector',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (customer_id, user_id)
);

-- Create companies table (per customer)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (customer_id, code)
);

-- Create collectors table
CREATE TABLE public.collectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status collector_status DEFAULT 'offline',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    outstanding_amount DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    financial_year_id UUID REFERENCES public.financial_years(id) ON DELETE CASCADE NOT NULL,
    collector_id UUID REFERENCES public.collectors(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    description TEXT,
    amount_to_collect DECIMAL(15,2) NOT NULL DEFAULT 0,
    amount_collected DECIMAL(15,2) DEFAULT 0,
    status task_status DEFAULT 'pending',
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collector_locations table (real-time tracking)
CREATE TABLE public.collector_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collector_id UUID REFERENCES public.collectors(id) ON DELETE CASCADE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create location_history table
CREATE TABLE public.location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collector_id UUID REFERENCES public.collectors(id) ON DELETE CASCADE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    duration_minutes INTEGER DEFAULT 0,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's customer_id
CREATE OR REPLACE FUNCTION public.get_user_customer_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT customer_id
  FROM public.customer_users
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Superadmins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for customers
CREATE POLICY "Superadmins can manage all customers"
ON public.customers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their customer"
ON public.customers FOR SELECT
TO authenticated
USING (id = public.get_user_customer_id(auth.uid()));

-- RLS Policies for financial_years
CREATE POLICY "Superadmins can manage all financial years"
ON public.financial_years FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their financial years"
ON public.financial_years FOR SELECT
TO authenticated
USING (customer_id = public.get_user_customer_id(auth.uid()));

-- RLS Policies for modules
CREATE POLICY "Everyone can view active modules"
ON public.modules FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Superadmins can manage modules"
ON public.modules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies for permissions
CREATE POLICY "Superadmins can manage all permissions"
ON public.permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer admins can view their permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (customer_id = public.get_user_customer_id(auth.uid()));

-- RLS Policies for customer_users
CREATE POLICY "Superadmins can manage all customer users"
ON public.customer_users FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer admins can manage their users"
ON public.customer_users FOR ALL
TO authenticated
USING (
  customer_id = public.get_user_customer_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for companies
CREATE POLICY "Superadmins can manage all companies"
ON public.companies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their companies"
ON public.companies FOR SELECT
TO authenticated
USING (customer_id = public.get_user_customer_id(auth.uid()));

CREATE POLICY "Customer admins can manage their companies"
ON public.companies FOR ALL
TO authenticated
USING (
  customer_id = public.get_user_customer_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for collectors
CREATE POLICY "Superadmins can manage all collectors"
ON public.collectors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their collectors"
ON public.collectors FOR SELECT
TO authenticated
USING (customer_id = public.get_user_customer_id(auth.uid()));

-- RLS Policies for clients
CREATE POLICY "Superadmins can manage all clients"
ON public.clients FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their clients"
ON public.clients FOR SELECT
TO authenticated
USING (customer_id = public.get_user_customer_id(auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Superadmins can manage all tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (customer_id = public.get_user_customer_id(auth.uid()));

-- RLS Policies for collector_locations
CREATE POLICY "Superadmins can view all locations"
ON public.collector_locations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their collector locations"
ON public.collector_locations FOR SELECT
TO authenticated
USING (
  collector_id IN (
    SELECT id FROM public.collectors 
    WHERE customer_id = public.get_user_customer_id(auth.uid())
  )
);

-- RLS Policies for location_history
CREATE POLICY "Superadmins can view all location history"
ON public.location_history FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Customer users can view their location history"
ON public.location_history FOR SELECT
TO authenticated
USING (
  collector_id IN (
    SELECT id FROM public.collectors 
    WHERE customer_id = public.get_user_customer_id(auth.uid())
  )
);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_years_updated_at BEFORE UPDATE ON public.financial_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collectors_updated_at BEFORE UPDATE ON public.collectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default modules
INSERT INTO public.modules (name, code, description, icon, sort_order) VALUES
('Dashboard', 'dashboard', 'Main dashboard view', 'LayoutDashboard', 1),
('Collectors', 'collectors', 'Manage collectors', 'Users', 2),
('Clients', 'clients', 'Manage clients', 'Building2', 3),
('Tasks', 'tasks', 'Manage collection tasks', 'ClipboardList', 4),
('Reports', 'reports', 'View reports', 'FileText', 5),
('Map View', 'map', 'Track collectors on map', 'Map', 6),
('Settings', 'settings', 'System settings', 'Settings', 7);

-- Enable realtime for collector_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.collector_locations;
