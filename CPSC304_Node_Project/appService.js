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
async function testOracleConnection() {
  return await withOracleDB(async (connection) => {
    return true;
  }).catch(() => {
    return false;
  });
}

// reset database and run database_initialization.sql to populate tables
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

// insert query
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

    // check 3: if postal code does not exist in Postal Code table, reject insertion
    const postalcodeCheck = await connection.execute(
            `SELECT * FROM POSTALCODE WHERE postal_code = :postal_code`,
            [postal_code]);

    if (postalcodeCheck.rows.length === 0) {return {success: false, message: "Postal Code does not exist in Postal Code Table"}}


    // check 4: if primary key (garden ID) already exists, reject insertion
    const primarykeyCheck = await connection.execute(
        `SELECT * FROM Garden WHERE garden_id = :garden_id`,
        [garden_id],
    );

    if (primarykeyCheck.rows.length !== 0) {
        return {success: false, message: 'Duplicate Garden ID, please enter a different Garden ID'}
    }

    // check 5: if foreign key to location table does not exist, insert it (note that location contains foreign key to Postal Code)
    const locationCheck = await connection.execute(
      `SELECT * FROM LOCATION WHERE postal_code = :postal_code AND house_number = :house_number AND street_name = :street_name`,
      [postal_code, house_number, street_name],
    );

    if (locationCheck.rows.length === 0) {
        try {
            const locationUpdate = await connection.execute(
            `INSERT INTO LOCATION (postal_code, house_number, street_name) VALUES (:postal_code, :house_number, :street_name)`,
            [postal_code, house_number, street_name],
            { autoCommit: true })

        } catch (err) {
            return { success:false, message: 'Location (postal code, house number, street name) invalid' }
        }
    }

    // try insertion to Garden table
    try {
    const result = await connection.execute(
      `INSERT INTO GARDEN (garden_id, name, postal_code, street_name, house_number, owner_id) VALUES (:garden_id, :name, :postal_code, :street_name, :house_number, :owner_id)`,
      [garden_id, name, postal_code, street_name, house_number, owner_id],
      { autoCommit: true },
    );
    return {success: true}; //original :  return result.rowsAffected && result.rowsAffected > 0
  } catch(err) {
    return {success: false, message: err.message};
  };
  })
}

// select query
async function selectPlanttable(filters) {
  let sql = 'SELECT * FROM PLANT';
  const vals = [];

  // assemble sql query with binding
  if (filters[0].value != '') {
    sql += ` WHERE `;

    filters.forEach((f, index) => {
      let col = f.column;
      let value = f.value;
      if (col === 'type_name' && value !== '') {
      col = `LOWER(${f.column})`;
      value = f.value.toLowerCase();}

      if (index > 0) sql += ` ${f.logic} `; // concatenate OR/AND after first attribute
      sql += `${col} = :${index}`;
      vals.push(value);
    });
  }

  return await withOracleDB(async (connection) => {

  try {
    const result = await connection.execute(sql, vals, { autoCommit: true });
    return {success : true, rows : result.rows};
  } catch (err) {
    return {success : false, message : 'Selection unsuccessful, invalid Input'}
  };})
}

// update query
async function updatePlant(plant_id, fieldsToUpdate) {
  return await withOracleDB(async (connection) => {
    // Validate at least one field is being updated
    if (Object.keys(fieldsToUpdate).length === 0) {
      return {
        success: false,
        message: 'At least one field must be selected for update',
      };
    }

    // Validate type_name if being updated
    if (fieldsToUpdate.type_name !== undefined) {
      const typeCheck = await connection.execute(
        `SELECT * FROM PLANTTYPE WHERE name = :type_name`,
        [fieldsToUpdate.type_name],
      );
      if (typeCheck.rows.length === 0) {
        return {
          success: false,
          message: 'Plant type does not exist in PlantType table',
        };
      }
    }

    // Validate section_id if being updated
    if (fieldsToUpdate.section_id !== undefined) {
      const sectionCheck = await connection.execute(
        `SELECT * FROM SECTION WHERE section_id = :section_id`,
        [fieldsToUpdate.section_id],
      );
      if (sectionCheck.rows.length === 0) {
        return {
          success: false,
          message: 'Section ID does not exist in Section table',
        };
      }
    }

    // Build dynamic UPDATE query
    const setClauses = [];
    const values = [];
    let bindIndex = 0;

    if (fieldsToUpdate.latitude !== undefined) {
      setClauses.push(`latitude = :${bindIndex}`);
      values.push(fieldsToUpdate.latitude);
      bindIndex++;
    }
    if (fieldsToUpdate.longitude !== undefined) {
      setClauses.push(`longitude = :${bindIndex}`);
      values.push(fieldsToUpdate.longitude);
      bindIndex++;
    }
    if (fieldsToUpdate.radius !== undefined) {
      setClauses.push(`radius = :${bindIndex}`);
      values.push(fieldsToUpdate.radius);
      bindIndex++;
    }
    if (fieldsToUpdate.is_ready !== undefined) {
      setClauses.push(`is_ready = :${bindIndex}`);
      values.push(fieldsToUpdate.is_ready);
      bindIndex++;
    }
    if (fieldsToUpdate.type_name !== undefined) {
      setClauses.push(`type_name = :${bindIndex}`);
      values.push(fieldsToUpdate.type_name);
      bindIndex++;
    }
    if (fieldsToUpdate.section_id !== undefined) {
      setClauses.push(`section_id = :${bindIndex}`);
      values.push(fieldsToUpdate.section_id);
      bindIndex++;
    }

    // Add plant_id to values
    values.push(plant_id);

    const sql = `UPDATE PLANT SET ${setClauses.join(', ')} WHERE plant_id = :${bindIndex}`;

    // Update the plant
    try {
      const result = await connection.execute(sql, values, {
        autoCommit: true,
      });

      if (result.rowsAffected && result.rowsAffected > 0) {
        return { success: true };
      } else {
        return { success: false, message: 'Plant not found' };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  });
}

// project query
async function projectGarden(columns) {
  return await withOracleDB(async (connection) => {
    if (!columns || columns.length === 0) {
      return {
        success: false,
        message: 'At least one column must be selected',
      };
    }

    // Build column list
    const columnList = columns.join(', ');
    const sql = `SELECT ${columnList} FROM GARDEN ORDER BY garden_id`;

    const result = await connection.execute(sql);

    return {
      success: true,
      columns: columns,
      rows: result.rows,
    };
  }).catch((err) => {
    return { success: false, message: err.message };
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

// division query
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

// nested aggregation query
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

// having query
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

// join query
async function joinPlantWithPlantType(plantTypeName) {
  return await withOracleDB(async (connection) => {
    const sql = `
      SELECT 
        p.plant_id,
        p.latitude,
        p.longitude,
        p.radius,
        p.is_ready,
        p.section_id,
        pt.name as type_name,
        pt.requirements,
        pt.description
      FROM Plant p
      JOIN PlantType pt ON p.type_name = pt.name
      WHERE pt.name = :plantTypeName
      ORDER BY p.plant_id`;

    const result = await connection.execute(sql, [plantTypeName]);
    
    return result.rows.map((row) => {
      return {
        plant_id: row[0],
        latitude: row[1],
        longitude: row[2],
        radius: row[3],
        is_ready: row[4],
        section_id: row[5],
        type_name: row[6],
        requirements: row[7],
        description: row[8]
      };
    });
  }).catch(() => {
    return [];
  });
}

// delete query
async function deleteToolType(toolTypeName) {
  return await withOracleDB(async (connection) => {

    const checkResult = await connection.execute(
      `SELECT name, function FROM TOOLTYPE WHERE name = :toolTypeName`,
      [toolTypeName]
    );

    if (checkResult.rows.length === 0) {
      return {
        success: false,
        message: 'Tool type not found'
      };
    }

    try {
      const result = await connection.execute(
        `DELETE FROM TOOLTYPE WHERE name = :toolTypeName`,
        [toolTypeName],
        { autoCommit: true }
      );

      if (result.rowsAffected && result.rowsAffected > 0) {
        return {
          success: true,
          message: `All "${toolTypeName}" tools have been successfully deleted!`
        };
      } else {
        return {
          success: false,
          message: 'Failed to delete tool type'
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.message
      };
    }
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
  updatePlant,
  selectPlanttable,
  projectGarden,
  groupByPlantType,
  divisionSectionsWithAllPlantTypes,
  nestedAggregationSectionDiversity,
  havingSectionsHighWaterUsage,
  joinPlantWithPlantType,
  deleteToolType,

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
