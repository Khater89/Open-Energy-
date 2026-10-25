CREATE TABLE IF NOT EXISTS admin_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL UNIQUE,
 password_hash text NOT NULL, role text NOT NULL CHECK(role IN ('admin','staff','viewer')) DEFAULT 'staff',
 last_login_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text NOT NULL,phone text NOT NULL,email text NOT NULL,
 service_type text NOT NULL CHECK(service_type IN ('on-grid','off-grid','hybrid')),city text NOT NULL,
 property_type text NOT NULL CHECK(property_type IN ('home','business','farm','other')),message text NOT NULL DEFAULT '',
 source text NOT NULL DEFAULT 'website',consented_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS consultation_bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),lead_id uuid NOT NULL REFERENCES leads(id),preferred_date date NOT NULL,
 preferred_time text NOT NULL CHECK(preferred_time IN ('morning','afternoon','evening')),
 monthly_bill numeric(12,2),address text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','scheduled','closed')),
 notes text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,
 idempotency_key uuid NOT NULL UNIQUE,payload_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contact_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text NOT NULL,phone text NOT NULL,email text NOT NULL,subject text NOT NULL,message text NOT NULL,
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','scheduled','closed')),notes text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 1,
 idempotency_key uuid NOT NULL UNIQUE,payload_hash text NOT NULL,consented_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text NOT NULL,system_type text NOT NULL CHECK(system_type IN ('on-grid','off-grid','hybrid')),
 location text NOT NULL,summary text NOT NULL,image_url text NOT NULL DEFAULT '',is_featured boolean NOT NULL DEFAULT false,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS services (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,slug text NOT NULL UNIQUE,summary text NOT NULL,details text NOT NULL,is_active boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS rate_limits (bucket text PRIMARY KEY,hits integer NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,user_id uuid REFERENCES admin_users(id),entity_type text NOT NULL,entity_id uuid NOT NULL,old_status text NOT NULL,new_status text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS booking_status_created ON consultation_bookings(status,created_at DESC);
CREATE INDEX IF NOT EXISTS contact_status_created ON contact_requests(status,created_at DESC);

CREATE TABLE IF NOT EXISTS notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('booking','contact')),
 booking_id uuid REFERENCES consultation_bookings(id) ON DELETE CASCADE,
 contact_id uuid REFERENCES contact_requests(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','accepted','failed')),
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now(), locked_until timestamptz, lock_token uuid,
 last_error text, provider_message_id text, accepted_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK((kind='booking' AND booking_id IS NOT NULL AND contact_id IS NULL) OR (kind='contact' AND contact_id IS NOT NULL AND booking_id IS NULL)),
 UNIQUE(booking_id), UNIQUE(contact_id)
);
CREATE INDEX IF NOT EXISTS notification_ready ON notification_outbox(status,next_attempt_at);
