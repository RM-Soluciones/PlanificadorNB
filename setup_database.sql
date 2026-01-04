-- Script SQL para crear las tablas necesarias en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Tabla para almacenar choferes
CREATE TABLE IF NOT EXISTS public.choferes (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabla para almacenar móviles
CREATE TABLE IF NOT EXISTS public.moviles (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.choferes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moviles ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir operaciones (ajusta según tus necesidades de seguridad)
-- Política para SELECT (lectura) - permitir a todos
CREATE POLICY "Enable read access for all users" ON public.choferes
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.moviles
    FOR SELECT USING (true);

-- Políticas para INSERT, UPDATE, DELETE (escritura) - permitir a todos
-- NOTA: En producción, deberías restringir esto solo a usuarios autenticados
CREATE POLICY "Enable insert for all users" ON public.choferes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.choferes
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.choferes
    FOR DELETE USING (true);

CREATE POLICY "Enable insert for all users" ON public.moviles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.moviles
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON public.moviles
    FOR DELETE USING (true);

-- Insertar datos iniciales de choferes (los que ya tenías en el código)
INSERT INTO public.choferes (nombre) VALUES
    ('SARAPURA'),
    ('MENDOZA'),
    ('MAMANI.P'),
    ('CRUZ D'),
    ('CALA'),
    ('SALVATIERRA'),
    ('GUZMAN'),
    ('CORONEL'),
    ('SOLIS'),
    ('RIOS'),
    ('SANCHEZ'),
    ('FLORES'),
    ('MAMANI.F'),
    ('SERRUDO'),
    ('DE ZUANI'),
    ('AVENDAÑO'),
    ('ARJONA'),
    ('RAVAZA'),
    ('ARRATIA'),
    ('DIAZ'),
    ('SALAS'),
    ('GALLARDO'),
    ('APARICIO'),
    ('GVH'),
    ('MASTERBUS'),
    ('FENIX'),
    ('MAGNO'),
    ('MAR ANDINO'),
    ('MARCELO COPA'),
    ('OTRO'),
    ('VILAPLANA'),
    ('FLORES.J'),
    ('SOLIZ.A'),
    ('ALVAREZ'),
    ('RENFIJES'),
    ('ORTUÑO'),
    ('GERON'),
    ('SANTOS'),
    ('CRUZ F')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar datos iniciales de móviles (los que ya tenías en el código)
INSERT INTO public.moviles (nombre) VALUES
    ('M32'),
    ('M33'),
    ('M09'),
    ('M18'),
    ('M20'),
    ('M21'),
    ('M22'),
    ('M24'),
    ('M25'),
    ('M26'),
    ('M28'),
    ('M30'),
    ('M34'),
    ('M35'),
    ('M36'),
    ('M37'),
    ('M38'),
    ('M39'),
    ('M40'),
    ('M41'),
    ('M42'),
    ('M46'),
    ('GVH'),
    ('MASTERBUS'),
    ('FENIX'),
    ('MAGNO'),
    ('MAR ANDINO'),
    ('MARCELO COPA'),
    ('OTRO'),
    ('M43'),
    ('M44'),
    ('M45'),
    ('CAMIONETA RTM')
ON CONFLICT (nombre) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT 'Choferes insertados:' as info, COUNT(*) as total FROM public.choferes;
SELECT 'Móviles insertados:' as info, COUNT(*) as total FROM public.moviles;
