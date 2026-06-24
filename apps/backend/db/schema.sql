-- Enable btree_gist extension for GIST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP TABLE IF EXISTS checkpoint_events CASCADE;
DROP TABLE IF EXISTS telemetry_readings CASCADE;
DROP TABLE IF EXISTS tire_assignments CASCADE;
DROP TABLE IF EXISTS asset_assignments CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS tire_state_logs CASCADE;
DROP TABLE IF EXISTS asset_state_logs CASCADE;
DROP TABLE IF EXISTS tires CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS purchase_documents CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. Empresas (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subscription_plan VARCHAR(20) DEFAULT 'RFID_TPMS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usuarios del Sistema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sucursales / Ubicaciones Físicas (Bases propias, Plantas Recauchaje)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'Base Interna', 'Planta Recauchaje', 'Bodega Externa'
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Documentos de Ingreso (Compras)
CREATE TABLE purchase_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL, -- A qué sucursal ingresó la compra
    document_number VARCHAR(50) NOT NULL, -- Factura o Guía
    supplier VARCHAR(100),
    document_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Flota / Vehículos (Centro de la operación)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    branch_id UUID REFERENCES branches(id), -- Base actual del vehículo
    plate VARCHAR(15) NOT NULL,
    brand VARCHAR(50),
    model VARCHAR(50),
    year INT,
    rfid_id VARCHAR(100), -- Identificador RFID principal del vehículo
    vehicle_type VARCHAR(50) NOT NULL,
    axle_config VARCHAR(50) NOT NULL,
    current_odometer INT DEFAULT 0,
    odometer_updated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'EN_BASE', -- 'EN_BASE' | 'EN_RUTA'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, plate),
    UNIQUE(company_id, rfid_id)
);

-- 6. Neumáticos (Activos Complejos)
CREATE TABLE tires (
    fire_mark_id VARCHAR(50) PRIMARY KEY,
    company_id UUID REFERENCES companies(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL, -- Ubicación física actual (si no está en vehículo)
    purchase_id UUID REFERENCES purchase_documents(id),
    rfid_id VARCHAR(100),
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    size VARCHAR(20),
    dot_code VARCHAR(20),
    initial_depth NUMERIC(5,2),
    state VARCHAR(30) DEFAULT 'Bodega Nuevo', -- Bodega Nuevo, Bodega Usado, Operativo, Planta Recauchaje, Desecho
    retread_count INT DEFAULT 0,
    accumulated_mileage INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, rfid_id)
);

-- 7. Activos Generales (Pérticas, Llantas metálicas, Extintores, etc.)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    purchase_id UUID REFERENCES purchase_documents(id),
    rfid_id VARCHAR(100),
    asset_type VARCHAR(50) NOT NULL, -- 'Pértica', 'Extintor', 'Llanta Metálica'
    serial_number VARCHAR(100),
    state VARCHAR(30) DEFAULT 'Bodega', -- Bodega, En Vehículo, Desecho
    accumulated_mileage INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, rfid_id)
);

-- 8. Sensores (Hardware TPMS consumible)
CREATE TABLE sensors (
    mac_address MACADDR PRIMARY KEY,
    company_id UUID REFERENCES companies(id) NOT NULL,
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    state VARCHAR(20) DEFAULT 'Libre', -- Asignado, Libre, Dañado
    last_seen TIMESTAMPTZ
);

-- 9. Asignaciones de Neumáticos (A Vehículos)
CREATE TABLE tire_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    tire_fire_mark VARCHAR(50) REFERENCES tires(fire_mark_id) NOT NULL,
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

-- 10. Asignaciones de Activos Generales (A Vehículos)
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
    asset_id UUID REFERENCES assets(id) NOT NULL,
    start_odometer INT NOT NULL,
    end_odometer INT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    unassigned_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- 11. Logs e Historial
CREATE TABLE tire_state_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    tire_fire_mark VARCHAR(50) REFERENCES tires(fire_mark_id),
    previous_state VARCHAR(30),
    new_state VARCHAR(30) NOT NULL,
    branch_id UUID REFERENCES branches(id), -- Dónde ocurrió
    reason TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_state_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    asset_id UUID REFERENCES assets(id),
    previous_state VARCHAR(30),
    new_state VARCHAR(30) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    reason TEXT,
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Telemetría y Eventos
CREATE TABLE telemetry_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_mac MACADDR REFERENCES sensors(mac_address),
    pressure_psi NUMERIC(5,2) NOT NULL,
    temperature_c NUMERIC(5,2) NOT NULL,
    reading_timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_telemetry_mac_time ON telemetry_readings(sensor_mac, reading_timestamp DESC);

CREATE TABLE checkpoint_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    branch_id UUID REFERENCES branches(id),
    vehicle_id UUID REFERENCES vehicles(id),
    event_type VARCHAR(20) NOT NULL, -- 'CHECK_IN', 'CHECK_OUT'
    status VARCHAR(20) NOT NULL DEFAULT 'OK', -- 'OK', 'DIVERGENTE'
    operator_id UUID REFERENCES users(id),
    unknown_rfids JSONB DEFAULT '[]'::jsonb,
    missing_rfids JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    event_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Mobile App Logs
CREATE TABLE control_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'RECAUCHAJE_ENVIO', 'RECAUCHAJE_RECEPCION', 'REPARACION_ENVIO', etc.
    status VARCHAR(20) DEFAULT 'PENDIENTE', -- 'PENDIENTE', 'RECIBIDO', 'PARCIAL'
    supplier_branch_id UUID REFERENCES branches(id),
    operator_id UUID REFERENCES users(id),
    affected_tires JSONB DEFAULT '[]'::jsonb, -- array of UUIDs or RFIDs or detailed objects
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    operator_id UUID REFERENCES users(id),
    total_scanned INT NOT NULL DEFAULT 0,
    missing_assets JSONB DEFAULT '[]'::jsonb,
    extra_assets JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    audit_date TIMESTAMPTZ DEFAULT NOW()
);
