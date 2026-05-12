-- Enable btree_gist extension for GIST indexes on macaddr and boolean
CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP TABLE IF EXISTS checkpoint_events CASCADE;
DROP TABLE IF EXISTS telemetry_readings CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS tire_state_logs CASCADE;
DROP TABLE IF EXISTS tires CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 0. Empresas (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subscription_plan VARCHAR(20) DEFAULT 'RFID_ONLY', -- 'RFID_ONLY' o 'RFID_TPMS'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 0.1 Usuarios del Sistema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'OPERATOR', -- 'ADMIN', 'OPERATOR'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Flota / Vehículos
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    plate VARCHAR(10) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    axle_config VARCHAR(50) NOT NULL, -- ej. '6x4', '4x2'
    current_odometer INT DEFAULT 0,
    odometer_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, plate) -- La patente es única por empresa
);

-- 2. Neumáticos (Activos principales)
CREATE TABLE tires (
    fire_mark_id VARCHAR(50) PRIMARY KEY, -- Marca de fuego como PK natural (Asumimos única a nivel global o usaríamos ID artificial)
    company_id UUID REFERENCES companies(id) NOT NULL,
    rfid_id VARCHAR(100),
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    size VARCHAR(20), -- Medida del neumático
    dot_code VARCHAR(20),
    initial_depth NUMERIC(5,2),
    state VARCHAR(30) DEFAULT 'Bodega', -- Operativo, Bodega, Planta Recauchaje, Reparación, Desecho
    retread_count INT DEFAULT 0,
    accumulated_mileage INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, rfid_id)
);

-- 3. Sensores (Hardware consumible)
CREATE TABLE sensors (
    mac_address MACADDR PRIMARY KEY,
    company_id UUID REFERENCES companies(id) NOT NULL,
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    state VARCHAR(20) DEFAULT 'Libre', -- Asignado, Libre, Dañado
    last_seen TIMESTAMPTZ
);

-- Historial de Estados del Neumático
CREATE TABLE tire_state_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    tire_fire_mark VARCHAR(50) REFERENCES tires(fire_mark_id),
    previous_state VARCHAR(30),
    new_state VARCHAR(30) NOT NULL,
    reason TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Asignaciones (Relación dinámica y temporal)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    tire_fire_mark VARCHAR(50) REFERENCES tires(fire_mark_id),
    sensor_mac MACADDR REFERENCES sensors(mac_address),
    axle_position VARCHAR(10) NOT NULL,
    start_odometer INT NOT NULL,
    end_odometer INT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    EXCLUDE USING gist (
        sensor_mac WITH =, 
        is_active WITH =
    ) WHERE (is_active AND sensor_mac IS NOT NULL)
);

-- 5. Telemetría / Lecturas
CREATE TABLE telemetry_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_mac MACADDR REFERENCES sensors(mac_address),
    pressure_psi NUMERIC(5,2) NOT NULL,
    temperature_c NUMERIC(5,2) NOT NULL,
    reading_timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_telemetry_mac_time ON telemetry_readings(sensor_mac, reading_timestamp DESC);

-- 6. Eventos / Auditoría en Patio (Check-Point)
CREATE TABLE checkpoint_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    event_type VARCHAR(20) NOT NULL,
    operator_id UUID REFERENCES users(id),
    anomalies_detected BOOLEAN DEFAULT FALSE,
    notes TEXT,
    event_timestamp TIMESTAMPTZ DEFAULT NOW()
);
