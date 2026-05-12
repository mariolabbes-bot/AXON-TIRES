-- 1. Flota / Vehículos
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate VARCHAR(10) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    axle_config VARCHAR(50) NOT NULL, -- ej. '6x4', '4x2'
    current_odometer INT DEFAULT 0, -- Kilometraje actual del vehículo
    odometer_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Neumáticos (Activos principales)
CREATE TABLE tires (
    fire_mark_id VARCHAR(50) PRIMARY KEY, -- Marca de fuego como PK natural
    rfid_id VARCHAR(100) UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    size VARCHAR(20), -- Medida del neumático (ej. 295/80R22.5)
    dot_code VARCHAR(20),
    initial_depth NUMERIC(5,2),
    state VARCHAR(30) DEFAULT 'Bodega', -- Operativo, Bodega, Planta Recauchaje, Reparación, Desecho
    retread_count INT DEFAULT 0,
    accumulated_mileage INT DEFAULT 0, -- Kilometraje total histórico del neumático
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de Estados del Neumático
CREATE TABLE tire_state_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tire_fire_mark VARCHAR(50) REFERENCES tires(fire_mark_id),
    previous_state VARCHAR(30),
    new_state VARCHAR(30) NOT NULL,
    reason TEXT,
    operator_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sensores (Hardware consumible)
CREATE TABLE sensors (
    mac_address MACADDR PRIMARY KEY,
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    state VARCHAR(20) DEFAULT 'Libre', -- Asignado, Libre, Dañado
    last_seen TIMESTAMPTZ
);

-- 4. Asignaciones (Relación dinámica y temporal)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id),
    tire_fire_mark VARCHAR(50) REFERENCES tires(fire_mark_id),
    sensor_mac MACADDR REFERENCES sensors(mac_address),
    axle_position VARCHAR(10) NOT NULL, -- ej. '1I', '1D', '2EI'
    start_odometer INT NOT NULL, -- Odocomentro del vehículo al momento de instalar
    end_odometer INT, -- Odometro del vehículo al desmontar
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
    vehicle_id UUID REFERENCES vehicles(id),
    event_type VARCHAR(20) NOT NULL, -- 'Check-In', 'Check-Out'
    operator_id UUID,
    anomalies_detected BOOLEAN DEFAULT FALSE,
    notes TEXT,
    event_timestamp TIMESTAMPTZ DEFAULT NOW()
);
