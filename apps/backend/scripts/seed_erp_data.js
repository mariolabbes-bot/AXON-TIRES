require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    console.log('Iniciando carga de datos ERP de prueba...');
    await pool.query('BEGIN');

    // 1. Crear Empresa
    const companyRes = await pool.query(
      `INSERT INTO companies (name, subscription_plan) VALUES ('Logística Global S.A.', 'RFID_TPMS') RETURNING id`
    );
    const companyId = companyRes.rows[0].id;
    console.log(`Empresa creada: ${companyId}`);

    // 2. Crear Sucursales
    const baseRes = await pool.query(
      `INSERT INTO branches (company_id, name, type, address) VALUES ($1, 'Base Central Santiago', 'Base Interna', 'Av. Siempre Viva 123') RETURNING id`,
      [companyId]
    );
    const baseId = baseRes.rows[0].id;

    const plantaRes = await pool.query(
      `INSERT INTO branches (company_id, name, type, address) VALUES ($1, 'Recauchajes del Norte', 'Planta Recauchaje', 'Ruta 5 Norte Km 20') RETURNING id`,
      [companyId]
    );
    const plantaId = plantaRes.rows[0].id;
    console.log(`Sucursales creadas.`);

    // 3. Crear Vehículos (Camiones)
    const vehicles = [];
    console.log('Inserting Vehicles...');
    const vehiclesRes = await pool.query(`
      INSERT INTO vehicles (company_id, plate, rfid_id, vehicle_type, axle_config, current_odometer, brand, model, year)
      VALUES 
        ($1, 'AB-CD-12', 'VEH-RFID-001', 'Tractocamión', '6x4', 45100, 'Volvo', 'FH16', 2022),
        ($1, 'EF-GH-34', 'VEH-RFID-002', 'Semirremolque', '2 Ejes', 12000, 'Randon', 'Plano', 2021),
        ($1, 'IJ-KL-56', 'VEH-RFID-003', 'Tractocamión', '4x2', 85000, 'Scania', 'R450', 2020),
        ($1, 'MN-OP-78', 'VEH-RFID-004', 'Semirremolque', '3 Ejes', 4000, 'Tremac', 'Tolva', 2023),
        ($1, 'QR-ST-90', 'VEH-RFID-005', 'Camioneta', '2 Ejes', 105000, 'Toyota', 'Hilux', 2019)
      RETURNING id, plate
    `, [companyId]);
    console.log(`5 Vehículos creados.`);

    // 4. Crear un Documento de Compra inicial
    const purchaseRes = await pool.query(
      `INSERT INTO purchase_documents (company_id, branch_id, document_number, supplier, document_date) 
       VALUES ($1, $2, 'FAC-0001', 'Michelin Chile', NOW()) RETURNING id`,
      [companyId, baseId]
    );
    const purchaseId = purchaseRes.rows[0].id;

    // 5. Crear Neumáticos y asignarlos a la compra
    for (let i = 1; i <= 30; i++) {
      await pool.query(
        `INSERT INTO tires (fire_mark_id, company_id, branch_id, purchase_id, rfid_id, brand, model, size, initial_depth, state) 
         VALUES ($1, $2, $3, $4, $5, 'Michelin', 'X Multi', '295/80R22.5', 20.0, 'Bodega Nuevo')`,
        [`FM-2026-${String(i).padStart(3, '0')}`, companyId, baseId, purchaseId, `RFID-TIRE-${String(i).padStart(3, '0')}`]
      );
    }
    console.log(`30 Neumáticos creados.`);

    // 6. Crear Activos Generales (Extintores, Pérticas)
    for (let i = 1; i <= 10; i++) {
      await pool.query(
        `INSERT INTO assets (company_id, branch_id, purchase_id, rfid_id, asset_type, serial_number, state) 
         VALUES ($1, $2, $3, $4, 'Extintor 10Kg', $5, 'Bodega')`,
        [companyId, baseId, purchaseId, `RFID-EXT-${i}`, `SN-EXT-${1000+i}`]
      );
    }
    console.log(`10 Activos Generales creados.`);

    await pool.query('COMMIT');
    console.log('Carga de datos exitosa.');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error inyectando datos:', err);
  } finally {
    pool.end();
  }
}

seed();
