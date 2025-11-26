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
    // check 1: if foreign key to Person table does not exist, reject insertion
    const ownerCheck = await connection.execute(
      `SELECT * FROM PERSON WHERE person_id = :owner_id`,
      [owner_id],
    );

    if (ownerCheck.rows.length === 0) {
      return {
        success: false,
        message: 'Owner ID does not exist in Person Table',
      };
    }

    // check 2: if foreign key to location table does not exist, insert it (note that location contains foreign key to Postal Code)
    const locationCheck = await connection.execute(
      `SELECT * FROM LOCATION WHERE postal_code = :postal_code AND house_number = :house_number AND street_name = :street_name`,
      [postal_code, house_number, street_name],
    );

    if (locationCheck.rows.length === 0) {
      try {
        const locationUpdate = await connection.execute(
          `INSERT INTO LOCATION (postal_code, house_number, street_name) VALUES (:postal_code, :house_number, :street_name)`,
          [postal_code, house_number, street_name],
          { autoCommit: true },
        );
        //console.log("try!");
      } catch (err) {
        return {
          success: false,
          message: 'Postal Code does not exist in the Postal Code Table',
        }; // TODO: assumes error always due to postal code
      }
    }

    // try insertion to Garden table
    try {
      const result = await connection.execute(
        `INSERT INTO GARDEN (garden_id, name, postal_code, street_name, house_number, owner_id) VALUES (:garden_id, :name, :postal_code, :street_name, :house_number, :owner_id)`,
        [garden_id, name, postal_code, street_name, house_number, owner_id],
        { autoCommit: true },
      );
      return { success: true }; //original :  return result.rowsAffected && result.rowsAffected > 0
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

async function selectPlanttable(filters) {
  let sql = 'SELECT * FROM PLANT';
  const vals = [];

  // assemble sql query with binding
  if (filters[0].value != '') {
    // check if no user input -> output all tuples
    sql += ` WHERE `;

    filters.forEach((f, index) => {
      if (index > 0) sql += ` ${f.logic} `; // concatenate OR/AND after first attribute
      sql += `${f.column} = :${index}`;
      vals.push(f.value);
    });
  }

  //console.log(sql);

  return await withOracleDB(async (connection) => {
    const result = await connection.execute(sql, vals, { autoCommit: true });
    return result.rows;
  }).catch(() => {
    return false;
  });
}

async function groupByPlantType() {
  return await withOracleDB(async (connection) => {
    const sql =
      'SELECT type_name, count(*) as plant_count FROM PLANT GROUP BY type_name ORDER BY type_name';

    const result = await connection.execute(sql);
    return result.rows.map((row) => {
      return {
        type_name: row[0],
        plant_count: row[1],
      };
    });
  }).catch(() => {
    return [];
  });
}

async function divisionSectionsWithAllPlantTypes() {
  return await withOracleDB(async (connection) => {
    const sql = `
      SELECT s.section_id, s.garden_id, g.name as garden_name
      FROM Section s
      JOIN Garden g ON s.garden_id = g.garden_id
      WHERE NOT EXISTS (
        SELECT pt.name
        FROM PlantType pt
        WHERE NOT EXISTS (
          SELECT p.plant_id
          FROM Plant p
          WHERE p.section_id = s.section_id
          AND p.type_name = pt.name
        )
      )
      ORDER BY s.section_id`;

    const result = await connection.execute(sql);
    return result.rows.map((row) => {
      return {
        section_id: row[0],
        garden_id: row[1],
        garden_name: row[2],
      };
    });
  }).catch(() => {
    return [];
  });
}

async function nestedAggregationSectionDiversity() {
  return await withOracleDB(async (connection) => {
    const sql = `
      SELECT s.section_id, s.garden_id, g.name as garden_name,
             COUNT(DISTINCT p.type_name) as diversity
      FROM Section s
      JOIN Garden g ON s.garden_id = g.garden_id
      JOIN Plant p ON s.section_id = p.section_id
      GROUP BY s.section_id, s.garden_id, g.name
      HAVING COUNT(DISTINCT p.type_name) > (
        SELECT AVG(diversity_count)
        FROM (
          SELECT COUNT(DISTINCT p2.type_name) as diversity_count
          FROM Plant p2
          GROUP BY p2.section_id
        )
      )
      ORDER BY diversity DESC, s.section_id`;

    const result = await connection.execute(sql);
    return result.rows.map((row) => {
      return {
        section_id: row[0],
        garden_id: row[1],
        garden_name: row[2],
        diversity: row[3],
      };
    });
  }).catch(() => {
    return [];
  });
}

async function havingSectionsHighWaterUsage() {
  return await withOracleDB(async (connection) => {
    const sql = `
      SELECT s.section_id, s.garden_id, g.name as garden_name,
             SUM(w.volume_litres) as total_water
      FROM Section s
      JOIN Garden g ON s.garden_id = g.garden_id
      JOIN Water w ON s.section_id = w.section_id
      GROUP BY s.section_id, s.garden_id, g.name
      HAVING SUM(w.volume_litres) > 50
      ORDER BY total_water DESC`;

    const result = await connection.execute(sql);
    return result.rows.map((row) => {
      return {
        section_id: row[0],
        garden_id: row[1],
        garden_name: row[2],
        total_water: row[3],
      };
    });
  }).catch(() => {
    return [];
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
  groupByPlantType,
  divisionSectionsWithAllPlantTypes,
  nestedAggregationSectionDiversity,
  havingSectionsHighWaterUsage,

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
