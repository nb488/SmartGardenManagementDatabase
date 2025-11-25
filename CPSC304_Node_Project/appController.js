const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
  const isConnect = await appService.testOracleConnection();
  if (isConnect) {
    res.send('connected');
  } else {
    res.send('unable to connect');
  }
});

router.get('/gardentable', async (req, res) => {
  const tableContent = await appService.fetchGardentableFromDb();
  res.json({ data: tableContent });
});

router.get('/persontable', async (req, res) => {
  const tableContent = await appService.fetchPersonFromDb();
  res.json({ data: tableContent });
});

router.get('/postalcodetable', async (req, res) => {
  const tableContent = await appService.fetchPostalCodeFromDb();
  res.json({ data: tableContent });
});

router.get('/postalcodetable', async (req, res) => {
  const tableContent = await appService.fetchPostalCodeFromDb();
  res.json({ data: tableContent });
});

router.get('/tooltypetable', async (req, res) => {
  const tableContent = await appService.fetchToolTypeFromDb();
  res.json({ data: tableContent });
});

router.get('/planttypetable', async (req, res) => {
  const tableContent = await appService.fetchPlantTypeFromDb();
  res.json({ data: tableContent });
});

router.get('/sectiondimensionstable', async (req, res) => {
  const tableContent = await appService.fetchSectionDimensionsFromDb();
  res.json({ data: tableContent });
});

router.get('/locationtable', async (req, res) => {
  const tableContent = await appService.fetchLocationFromDb();
  res.json({ data: tableContent });
});

router.get('/tooltable', async (req, res) => {
  const tableContent = await appService.fetchToolFromDb();
  res.json({ data: tableContent });
});

router.get('/hasaccesstable', async (req, res) => {
  const tableContent = await appService.fetchHasAccessFromDb();
  res.json({ data: tableContent });
});

router.get('/sectiontable', async (req, res) => {
  const tableContent = await appService.fetchSectionFromDb();
  res.json({ data: tableContent });
});

router.get('/planttable', async (req, res) => {
  const tableContent = await appService.fetchPlantFromDb();
  res.json({ data: tableContent });
});

router.get('/environmentaldatapointtable', async (req, res) => {
  const tableContent = await appService.fetchEnvironmentalDataPointFromDb();
  res.json({ data: tableContent });
});

router.get('/maintenancelogtable', async (req, res) => {
  const tableContent = await appService.fetchMaintenanceLogFromDb();
  res.json({ data: tableContent });
});

router.get('/watertable', async (req, res) => {
  const tableContent = await appService.fetchWaterFromDb();
  res.json({ data: tableContent });
});

router.get('/nutrienttable', async (req, res) => {
  const tableContent = await appService.fetchNutrientFromDb();
  res.json({ data: tableContent });
});

router.get('/lighttable', async (req, res) => {
  const tableContent = await appService.fetchLightFromDb();
  res.json({ data: tableContent });
});

router.post('/reset-database', async (req, res) => {
  const initiateResult = await appService.resetDatabase();
  if (initiateResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.post('/insert-gardentable', async (req, res) => {
  const { garden_id, name, postal_code, street_name, house_number, owner_id } =
    req.body;
  const insertResult = await appService.insertGardentable(
    garden_id,
    name,
    postal_code,
    street_name,
    house_number,
    owner_id,
  );
  if (insertResult) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

router.post('/select-planttable', async (req, res) => {
  const { filters } = req.body;
  const selectRows = await appService.selectPlanttable(filters);

  if (selectRows) {
    res.json({ success: true, data: selectRows });
  } else {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
