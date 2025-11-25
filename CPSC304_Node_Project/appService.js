const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
  user: envVariables.ORACLE_USER,
  password: envVariables.ORACLE_PASS,
  connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
  poolMin: 1,
  poolMax: 3,
  poolIncrement: 1,
  poolTimeout: 60,
};

// initialize connection pool
async function initializeConnectionPool() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Connection pool started');
  } catch (err) {
    console.error('Initialization error: ' + err.message);
  }
}

async function closePoolAndExit() {
  console.log('\nTerminating');
  try {
    await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
    console.log('Pool closed');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

initializeConnectionPool();

process.once('SIGTERM', closePoolAndExit).once('SIGINT', closePoolAndExit);

// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
  let connection;
  try {
    connection = await oracledb.getConnection(); // Gets a connection from the default pool
    return await action(connection);
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
  return await withOracleDB(async (connection) => {
    return true;
  }).catch(() => {
    return false;
  });
}

async function resetDatabase() {
  return await withOracleDB(async (connection) => {
    const fs = require('fs').promises;
    const path = require('path');

    try {
      const sqlFilePath = path.join(
        __dirname,
        '../database_initialization.sql',
      );
      const sqlContent = await fs.readFile(sqlFilePath, 'utf-8');

      const statements = sqlContent
        .split(';')
        .map((stmt) => {
          // Remove comment lines from each statement
          const lines = stmt.split('\n').filter((line) => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !trimmed.startsWith('--');
          });
          return lines.join('\n').trim();
        })
        .filter((stmt) => stmt.length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await connection.execute(statement, [], { autoCommit: true });
        } catch (err) {
          if (statement.trim().toUpperCase().startsWith('DROP')) {
            console.log('Table might not exist, continuing...');
          } else {
            console.error(`Error executing statement ${i + 1}:`, err.message);
            throw err;
          }
        }
      }
      return true;
    } catch (err) {
      console.error('Error resetting database:', err);
      return false;
    }
  }).catch(() => {
    return false;
  });
}

// ---------------------------------------------------------------
// QUERY COMMANDS
// ---------------------------------------------------------------

async function insertGardentable(
  garden_id,
  name,
  postal_code,
  street_name,
  house_number,
  owner_id,
) {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      `INSERT INTO GARDEN (garden_id, name, postal_code, street_name, house_number, owner_id) VALUES (:garden_id, :name, :postal_code, :street_name, :house_number, :owner_id)`,
      [garden_id, name, postal_code, street_name, house_number, owner_id],
      { autoCommit: true },
    );

    return result.rowsAffected && result.rowsAffected > 0;
  }).catch(() => {
    return false;
  });
}

async function selectPlanttable(filters) {
    let sql = 'SELECT * FROM PLANT WHERE ';
    const vals = [];


    filters.forEach((f, index) => {
        if (index > 0) sql += ` ${f.logic} `; // note spaces required
        sql += `${f.column} = :${index}`;
        vals.push(f.value);
    });

    //console.log(sql);

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(sql, vals, { autoCommit: true });
        return result.rows;
    }).catch(() => {
        return false;
    });
}

// ---------------------------------------------------------------
// FETCH COMMANDS
// ---------------------------------------------------------------

async function fetchGardentableFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM GARDEN');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchPersonFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM PERSON');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchPostalCodeFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM POSTALCODE');

    const rows = result.rows.map((row) => {
      const obj = {};
      result.metaData.forEach((col, idx) => {
        obj[col.name.toLowerCase()] = row[idx];
      });
      return obj;
    });
    return rows;
  }).catch(() => {
    return [];
  });
}

async function fetchToolTypeFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM TOOLTYPE');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchPlantTypeFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM PLANTTYPE');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchSectionDimensionsFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM SECTIONDIMENSIONS');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchLocationFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM LOCATION');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchToolFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM TOOL');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchHasAccessFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM HASACCESS');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchSectionFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM SECTION');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchPlantFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM PLANT');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchEnvironmentalDataPointFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute(
      'SELECT * FROM ENVIRONMENTALDATAPOINT',
    );
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchMaintenanceLogFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM MAINTENANCELOG');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchWaterFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM WATER');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchNutrientFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM NUTRIENT');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

async function fetchLightFromDb() {
  return await withOracleDB(async (connection) => {
    const result = await connection.execute('SELECT * FROM LIGHT');
    return result.rows;
  }).catch(() => {
    return [];
  });
}

module.exports = {
  testOracleConnection,

  resetDatabase,

  insertGardentable,
  selectPlanttable,

  fetchGardentableFromDb,
  fetchPersonFromDb,
  fetchPostalCodeFromDb,
  fetchToolTypeFromDb,
  fetchPlantTypeFromDb,
  fetchSectionDimensionsFromDb,
  fetchLocationFromDb,
  fetchToolFromDb,
  fetchHasAccessFromDb,
  fetchSectionFromDb,
  fetchPlantFromDb,
  fetchEnvironmentalDataPointFromDb,
  fetchMaintenanceLogFromDb,
  fetchWaterFromDb,
  fetchNutrientFromDb,
  fetchLightFromDb,
};
