-- Esquema para Home Doctor Ibarra
-- Ejecutar UNA VEZ en el SQL Editor de tu proyecto de Supabase.

create table if not exists doctors (
  id text primary key,
  name text,
  specialty text
);

create table if not exists patients (
  id text primary key,
  "historyNumber" text,
  "lastNamePaternal" text,
  "lastNameMaternal" text,
  "firstNames" text,
  cedula text,
  "birthDate" text,
  sex text,
  "maritalStatus" text,
  occupation text,
  nationality text,
  phone text,
  address text,
  canton text,
  province text,
  "companionName" text,
  "companionRelation" text,
  "companionPhone" text,
  app text,
  aqx text,
  allergies text,
  apf text,
  "createdAt" bigint,
  "sourceUrl" text,
  "needsReview" boolean default false
);

create table if not exists history (
  id text primary key,
  "patientId" text references patients(id) on delete cascade,
  "doctorId" text references doctors(id),
  date text,
  reason text,
  bp text,
  hr text,
  rr text,
  temp text,
  weight text,
  height text,
  spo2 text,
  bmi text,
  diagnosis text,
  treatment text,
  notes text
);

create table if not exists appointments (
  id text primary key,
  "patientId" text references patients(id) on delete cascade,
  "doctorId" text references doctors(id),
  date text,
  time text,
  status text
);

create table if not exists billing (
  id text primary key,
  "patientId" text references patients(id) on delete cascade,
  "appointmentId" text,
  concept text,
  amount numeric,
  status text
);

-- Seguridad: como esta app maneja datos médicos, activamos RLS y solo
-- permitimos acceso a usuarios que hayan iniciado sesión (autenticados).
-- Debes crear tu propio usuario en Authentication > Users antes de usar la app.

alter table doctors enable row level security;
alter table patients enable row level security;
alter table history enable row level security;
alter table appointments enable row level security;
alter table billing enable row level security;

create policy "Autenticados pueden todo - doctors" on doctors
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Autenticados pueden todo - patients" on patients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Autenticados pueden todo - history" on history
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Autenticados pueden todo - appointments" on appointments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Autenticados pueden todo - billing" on billing
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
