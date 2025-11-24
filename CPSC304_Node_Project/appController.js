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

router.get('/demotable', async (req, res) => {
    const tableContent = await appService.fetchDemotableFromDb();
    res.json({data: tableContent});
});

router.get('/gardentable', async (req, res) => {
    const tableContent = await appService.fetchGardentableFromDb();
    res.json({data: tableContent});
});

router.get('/persontable', async (req, res) => {
    const tableContent = await appService.fetchPersonFromDb();
    res.json({data: tableContent});
});

router.get('/postalcodetable', async (req, res) => {
    const tableContent = await appService.fetchPostalCodeFromDb();
    res.json({data: tableContent});
});

router.get('/postalcodetable', async (req, res) => {
    const tableContent = await appService.fetchPostalCodeFromDb();
    res.json({data: tableContent});
});

router.get('/tooltypetable', async (req, res) => {
    const tableContent = await appService.fetchToolTypeFromDb();
    res.json({data: tableContent});
});

router.get('/planttypetable', async (req, res) => {
    const tableContent = await appService.fetchPlantTypeFromDb();
    res.json({data: tableContent});
});

router.get('/sectiondimensionstable', async (req, res) => {
    const tableContent = await appService.fetchSectionDimensionsFromDb();
    res.json({data: tableContent});
});

router.get('/locationtable', async (req, res) => {
    const tableContent = await appService.fetchLocationFromDb();
    res.json({data: tableContent});
});

router.get('/tooltable', async (req, res) => {
    const tableContent = await appService.fetchToolFromDb();
    res.json({data: tableContent});
});

router.get('/hasaccesstable', async (req, res) => {
    const tableContent = await appService.fetchHasAccessFromDb();
    res.json({data: tableContent});
});

router.get('/sectiontable', async (req, res) => {
    const tableContent = await appService.fetchSectionFromDb();
    res.json({data: tableContent});
});


router.get('/planttable', async (req, res) => {
    const tableContent = await appService.fetchPlantFromDb();
    res.json({data: tableContent});
});


router.get('/environmentaldatapointtable', async (req, res) => {
    const tableContent = await appService.fetchEnvironmentalDataPointFromDb();
    res.json({data: tableContent});
});

router.get('/maintenancelogtable', async (req, res) => {
    const tableContent = await appService.fetchMaintenanceLogFromDb();
    res.json({data: tableContent});
});

router.get('/watertable', async (req, res) => {
    const tableContent = await appService.fetchWaterFromDb();
    res.json({data: tableContent});
});

router.get('/nutrienttable', async (req, res) => {
    const tableContent = await appService.fetchNutrientFromDb();
    res.json({data: tableContent});
});

router.get('/lighttable', async (req, res) => {
    const tableContent = await appService.fetchLightFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/initiate-gardentable", async (req, res) => {
    const initiateResult = await appService.initiateGardentable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-demotable", async (req, res) => {
    const { id, name } = req.body;
    const insertResult = await appService.insertDemotable(id, name);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-gardentable", async (req, res) => {
    const { garden_id, name, postal_code, street_name, house_number, owner_id } = req.body;
    const insertResult = await appService.insertGardentable(garden_id, name, postal_code, street_name, house_number, owner_id);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-name-demotable", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameDemotable(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-demotable', async (req, res) => {
    const tableCount = await appService.countDemotable();
    if (tableCount >= 0) {
        res.json({
            success: true,
            count: tableCount
        });
    } else {
        res.status(500).json({
            success: false,
            count: tableCount
        });
    }
});


module.exports = router;