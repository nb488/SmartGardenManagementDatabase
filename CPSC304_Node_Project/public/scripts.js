/*
 * These functions below are for various webpage functionalities.
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 *
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your
 *   backend endpoints
 * and
 *   HTML structure.
 *
 */

// global array of all table containers
const containers = [
  'persontableContainer',
  'postalcodetableContainer',
  'tooltypetableContainer',
  'planttypetableContainer',
  'sectiondimensionstableContainer',
  'locationtableContainer',
  'gardentableContainer',
  'tooltableContainer',
  'hasaccesstableContainer',
  'sectiontableContainer',
  'planttableContainer',
  'environmentaldatapointtableContainer',
  'maintenancelogtableContainer',
  'watertableContainer',
  'nutrienttableContainer',
  'lighttableContainer',
];

// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
  const statusElem = document.getElementById('dbStatus');
  const loadingGifElem = document.getElementById('loadingGif');

  const response = await fetch('/check-db-connection', {
    method: 'GET',
  });

  // Hide the loading GIF once the response is received.
  loadingGifElem.style.display = 'none';
  // Display the statusElem's text in the placeholder.
  statusElem.style.display = 'inline';

  response
    .text()
    .then((text) => {
      statusElem.textContent = text;
    })
    .catch((error) => {
      statusElem.textContent = 'connection timed out'; // Adjust error handling if required.
    });
}

// This function resets and populates the database.
async function resetDatabase() {
  const response = await fetch('/reset-database', {
    method: 'POST',
  });
  const responseData = await response.json();

  if (responseData.success) {
    const messageElement = document.getElementById('resetResultMsg');
    messageElement.textContent =
      'smart garden database initiated successfully!';
    fetchTableData();
  } else {
    alert('Error initiating table!');
  }
}

// Inserts new records into the gardentable.
async function insertGarden(event) {
  event.preventDefault();

  const idValue = document.getElementById('insertId').value;
  const nameValue = document.getElementById('insertName').value;
  const postalcodeValue = document.getElementById('insertPostalCode').value;
  const streetnameValue = document.getElementById('insertStreetName').value;
  const housenumberValue = document.getElementById('insertHouseNumber').value;
  const owneridValue = document.getElementById('insertOwnerId').value;

  const response = await fetch('/insert-gardentable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      garden_id: idValue,
      name: nameValue,
      postal_code: postalcodeValue,
      street_name: streetnameValue,
      house_number: housenumberValue,
      owner_id: owneridValue,
    }),
  });

  try {
    const responseData = await response.json();
    const messageElement = document.getElementById('insertionResultMsg');

    if (responseData.success) {
        messageElement.textContent = 'Data inserted successfully!';
        loadTable({ endpoint: '/gardentable', tableId: 'gardentable' });
        loadTable({ endpoint: '/locationtable', tableId: 'locationtable' });
    } else {
        messageElement.textContent =
        responseData.message || 'Error inserting data!';
    }
  } catch (err) {
    messageElement.textContent = "Error inserting data!"
    }
}

let plantsData = [];
let plantTypesData = [];
let sectionsData = [];

async function populateUpdatePlantDropdowns() {
  try {
    const plantsResponse = await fetch('/planttable');
    const plantsResult = await plantsResponse.json();
    plantsData = plantsResult.data;

    const typesResponse = await fetch('/planttypetable');
    const typesResult = await typesResponse.json();
    plantTypesData = typesResult.data;

    const sectionsResponse = await fetch('/sectiontable');
    const sectionsResult = await sectionsResponse.json();
    sectionsData = sectionsResult.data;

    const plantSelect = document.getElementById('updatePlantSelect');
    plantSelect.innerHTML = '<option value="">-- Select a Plant --</option>';
    plantsData.forEach((plant) => {
      const option = document.createElement('option');
      option.value = plant[0]; // plant_id
      option.textContent = `Plant ${plant[0]} - ${plant[5]} in Section ${plant[6]}`;
      plantSelect.appendChild(option);
    });

    const typeSelect = document.getElementById('updateTypeName');
    typeSelect.innerHTML = '<option value="">-- Select Type --</option>';
    plantTypesData.forEach((type) => {
      const option = document.createElement('option');
      option.value = type[0]; // name
      option.textContent = type[0];
      typeSelect.appendChild(option);
    });

    const sectionSelect = document.getElementById('updateSectionId');
    sectionSelect.innerHTML = '<option value="">-- Select Section --</option>';
    sectionsData.forEach((section) => {
      const option = document.createElement('option');
      option.value = section[0]; // section_id
      option.textContent = `Section ${section[0]} (Garden ${section[1]})`;
      sectionSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error populating update dropdowns:', error);
  }
}

function handlePlantSelection() {
  const plantId = document.getElementById('updatePlantSelect').value;
  const fieldsDiv = document.getElementById('updatePlantFields');

  if (plantId) {
    const plant = plantsData.find((p) => p[0] == plantId);
    if (plant) {
      document.getElementById('updateLatitude').value = plant[1];
      document.getElementById('updateLongitude').value = plant[2];
      document.getElementById('updateRadius').value = plant[3];
      document.getElementById('updateIsReady').value = plant[4];
      document.getElementById('updateTypeName').value = plant[5];
      document.getElementById('updateSectionId').value = plant[6];
      fieldsDiv.style.display = 'block';
    }
  } else {
    fieldsDiv.style.display = 'none';
  }
}

function setupCheckboxListeners() {
  const checkboxes = [
    { check: 'checkLatitude', field: 'updateLatitude' },
    { check: 'checkLongitude', field: 'updateLongitude' },
    { check: 'checkRadius', field: 'updateRadius' },
    { check: 'checkIsReady', field: 'updateIsReady' },
    { check: 'checkTypeName', field: 'updateTypeName' },
    { check: 'checkSectionId', field: 'updateSectionId' },
  ];

  checkboxes.forEach(({ check, field }) => {
    document.getElementById(check).addEventListener('change', function () {
      document.getElementById(field).disabled = !this.checked;
    });
  });
}

async function updatePlant(event) {
  event.preventDefault();

  const plantId = document.getElementById('updatePlantSelect').value;
  const fieldsToUpdate = {};

  // Only include checked fields
  if (document.getElementById('checkLatitude').checked) {
    fieldsToUpdate.latitude = parseFloat(
      document.getElementById('updateLatitude').value,
    );
  }
  if (document.getElementById('checkLongitude').checked) {
    fieldsToUpdate.longitude = parseFloat(
      document.getElementById('updateLongitude').value,
    );
  }
  if (document.getElementById('checkRadius').checked) {
    fieldsToUpdate.radius = parseFloat(
      document.getElementById('updateRadius').value,
    );
  }
  if (document.getElementById('checkIsReady').checked) {
    fieldsToUpdate.is_ready = parseInt(
      document.getElementById('updateIsReady').value,
    );
  }
  if (document.getElementById('checkTypeName').checked) {
    fieldsToUpdate.type_name = document.getElementById('updateTypeName').value;
  }
  if (document.getElementById('checkSectionId').checked) {
    fieldsToUpdate.section_id = parseInt(
      document.getElementById('updateSectionId').value,
    );
  }

  // Validate at least one field is selected
  if (Object.keys(fieldsToUpdate).length === 0) {
    document.getElementById('updateResultMsg').textContent =
      'Please select at least one field to update!';
    return;
  }

  const response = await fetch('/update-plant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plant_id: plantId,
      fieldsToUpdate: fieldsToUpdate,
    }),
  });

  const responseData = await response.json();
  const messageElement = document.getElementById('updateResultMsg');

  if (responseData.success) {
    messageElement.textContent = 'Plant updated successfully!';
    loadTable({ endpoint: '/planttable', tableId: 'planttable' });
    document.getElementById('updatePlantForm').reset();
    document.getElementById('updatePlantFields').style.display = 'none';
    // Uncheck all checkboxes and disable all fields
    document.querySelectorAll('.field-checkbox').forEach((cb) => {
      cb.checked = false;
    });
    document.getElementById('updateLatitude').disabled = true;
    document.getElementById('updateLongitude').disabled = true;
    document.getElementById('updateRadius').disabled = true;
    document.getElementById('updateIsReady').disabled = true;
    document.getElementById('updateTypeName').disabled = true;
    document.getElementById('updateSectionId').disabled = true;
  } else {
    messageElement.textContent =
      responseData.message || 'Error updating plant!';
  }
}

// Display select tuples from planttable.
async function selectPlant(event) {
  event.preventDefault();

  const filterRows = document.querySelectorAll(
    '#filters-container .filter-row',
  );
  const filters = Array.from(filterRows).map((row, i) => {
    const logicSel = row.querySelector('.logic-select');
    const columnSel = row.querySelector('.column-select');
    const inputVal = row.querySelector('.filter-value');

    return {
      logic: i === 0 ? null : logicSel.value, // first input does not have logic value
      column: columnSel.value,
      value: inputVal.value,
    };
  });

    const messageElement = document.getElementById('selectionResultMsg');
    //const resultContainer = document.getElementById('selectionResult');
    const resultContainer = document.getElementById('selectionResult');
    const plantCol = ['Plant ID', 'Latitude', 'Longitude', 'Radius', 'Status', 'Type', 'Section ID'];
    resultContainer.innerHTML = '';

try {
  const response = await fetch('/select-planttable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filters }),
  });

  const data = await response.json();

    if (data.success && data.rows.length > 0) {
        const table = document.createElement('table');
        table.border = '1';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        plantCol.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        data.rows.forEach((row) => {
            const tr = document.createElement('tr');
            row.forEach((cell) => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        resultContainer.appendChild(table);

    } else {
        messageElement.textContent = 'No results found';
    }
} catch (err) {
        resultContainer.textContent = 'Error fetching data.';
  }
}

// Dynamically create filter option-menus for logic (AND/OR) and column selection
async function addSelectFilter(event) {
  event.preventDefault();
  const filtersContainer = document.getElementById('filters-container');
  const filterRow = document.createElement('div');
  filterRow.className = 'filter-row';

  // AND/OR
  const logicSel = document.createElement('select');
  logicSel.className = 'logic-select';
  logicSel.innerHTML = `
        <option value="AND">AND</option>
        <option value="OR">OR</option>`;

  const columnSel = document.createElement('select');
  columnSel.className = 'column-select';
  columnSel.innerHTML = `
        <option value="plant_id">Plant ID</option>
        <option value="latitude">Latitude</option>
        <option value="longitude">Longitude</option>
        <option value="radius">Radius</option>
        <option value="is_ready">Status</option>
        <option value="type_name">Type</option>
        <option value="section_id">Section ID</option>`;

  const inputBox = document.createElement('input');
  inputBox.className = 'filter-value';
  inputBox.placeholder = 'Value';
  inputBox.required = true;

  filterRow.appendChild(logicSel);
  filterRow.appendChild(columnSel);
  filterRow.appendChild(inputBox);

  filtersContainer.appendChild(filterRow);
}

// remove a selection-query filter from view
async function removeSelectFilter(event) {
  event.preventDefault();
  const filtersContainer = document.getElementById('filters-container');
  if (filtersContainer.lastElementChild != filtersContainer.firstElementChild) {
    filtersContainer.removeChild(filtersContainer.lastElementChild);
  }
}

async function groupByPlantType() {
  const tableBody = document.querySelector('#groupByResultTable tbody');
  const resultMsg = document.getElementById('groupByResultMsg');

  tableBody.innerHTML = '';
  resultMsg.textContent = '';

  try {
    const response = await fetch('/plant-groupby-type');
    const data = await response.json();

    if (data.success && data.data.length > 0) {
      data.data.forEach((row) => {
        const tr = document.createElement('tr');
        const typeCell = document.createElement('td');
        typeCell.textContent = row.type_name;
        const countCell = document.createElement('td');
        countCell.textContent = row.plant_count;
        tr.appendChild(typeCell);
        tr.appendChild(countCell);
        tableBody.appendChild(tr);
      });
      resultMsg.textContent = 'Plant count by type loaded successfully.';
    } else {
      resultMsg.textContent = 'No data available';
    }
  } catch (err) {
    resultMsg.textContent = 'Error fetching data';
  }
}

async function divisionQuery() {
  const tableBody = document.querySelector('#divisionResultTable tbody');
  const resultMsg = document.getElementById('divisionResultMsg');

  tableBody.innerHTML = '';
  resultMsg.textContent = '';

  try {
    const response = await fetch('/sections-with-all-plant-types');
    const data = await response.json();

    if (data.success && data.data.length > 0) {
      data.data.forEach((row) => {
        const tr = document.createElement('tr');
        const sectionCell = document.createElement('td');
        sectionCell.textContent = row.section_id;
        const gardenIdCell = document.createElement('td');
        gardenIdCell.textContent = row.garden_id;
        const gardenNameCell = document.createElement('td');
        gardenNameCell.textContent = row.garden_name;
        tr.appendChild(sectionCell);
        tr.appendChild(gardenIdCell);
        tr.appendChild(gardenNameCell);
        tableBody.appendChild(tr);
      });
      resultMsg.textContent =
        'Sections with all plant types loaded successfully.';
    } else {
      resultMsg.textContent = 'No sections have grown all plant types yet.';
    }
  } catch (err) {
    resultMsg.textContent = 'Error fetching data';
  }
}

async function nestedAggregationQuery() {
  const tableBody = document.querySelector('#nestedAggResultTable tbody');
  const resultMsg = document.getElementById('nestedAggResultMsg');

  tableBody.innerHTML = '';
  resultMsg.textContent = '';

  try {
    const response = await fetch('/sections-above-avg-diversity');
    const data = await response.json();

    if (data.success && data.data.length > 0) {
      data.data.forEach((row) => {
        const tr = document.createElement('tr');
        const sectionIdCell = document.createElement('td');
        sectionIdCell.textContent = row.section_id;
        const gardenIdCell = document.createElement('td');
        gardenIdCell.textContent = row.garden_id;
        const gardenNameCell = document.createElement('td');
        gardenNameCell.textContent = row.garden_name;
        const diversityCell = document.createElement('td');
        diversityCell.textContent = row.diversity;
        tr.appendChild(sectionIdCell);
        tr.appendChild(gardenIdCell);
        tr.appendChild(gardenNameCell);
        tr.appendChild(diversityCell);
        tableBody.appendChild(tr);
      });
      resultMsg.textContent =
        'Sections with above-average diversity loaded successfully.';
    } else {
      resultMsg.textContent = 'No sections above average diversity found.';
    }
  } catch (err) {
    resultMsg.textContent = 'Error fetching data';
  }
}

async function havingQuery() {
  const tableBody = document.querySelector('#havingResultTable tbody');
  const resultMsg = document.getElementById('havingResultMsg');

  tableBody.innerHTML = '';
  resultMsg.textContent = '';

  try {
    const response = await fetch('/sections-high-water-usage');
    const data = await response.json();

    if (data.success && data.data.length > 0) {
      data.data.forEach((row) => {
        const tr = document.createElement('tr');
        const sectionIdCell = document.createElement('td');
        sectionIdCell.textContent = row.section_id;
        const gardenIdCell = document.createElement('td');
        gardenIdCell.textContent = row.garden_id;
        const gardenNameCell = document.createElement('td');
        gardenNameCell.textContent = row.garden_name;
        const waterCell = document.createElement('td');
        waterCell.textContent = row.total_water.toFixed(1);
        tr.appendChild(sectionIdCell);
        tr.appendChild(gardenIdCell);
        tr.appendChild(gardenNameCell);
        tr.appendChild(waterCell);
        tableBody.appendChild(tr);
      });
      resultMsg.textContent = 'High water usage sections loaded successfully.';
    } else {
      resultMsg.textContent = 'No sections with high water usage found.';
    }
  } catch (err) {
    resultMsg.textContent = 'Error fetching data';
  }
}

async function projectionGarden(event) {
  event.preventDefault();

  const resultMsg = document.getElementById('projectionResultMsg');
  const resultContainer = document.getElementById('projectionResult');

  resultMsg.textContent = '';
  resultContainer.innerHTML = '';

  const checkboxes = [
    'projGardenId',
    'projName',
    'projPostalCode',
    'projStreetName',
    'projHouseNumber',
    'projOwnerId',
  ];

  const selectedColumns = checkboxes
    .map((id) => {
      const checkbox = document.getElementById(id);
      return checkbox.checked ? checkbox.value : null;
    })
    .filter((val) => val !== null);

  if (selectedColumns.length === 0) {
    resultMsg.textContent = 'Please select at least one column!';
    return;
  }

  try {
    const response = await fetch('/project-garden', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ columns: selectedColumns }),
    });

    const data = await response.json();

    if (data.success && data.rows.length > 0) {
      const table = document.createElement('table');
      table.border = '1';

      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      data.columns.forEach((col) => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create body
      const tbody = document.createElement('tbody');
      data.rows.forEach((row) => {
        const tr = document.createElement('tr');
        row.forEach((cell) => {
          const td = document.createElement('td');
          td.textContent = cell;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      resultContainer.appendChild(table);
      resultMsg.textContent = 'Projection query executed successfully!';
    } else {
      resultMsg.textContent = data.message || 'No data found.';
    }
  } catch (err) {
    resultMsg.textContent = 'Error executing projection query!';
    console.error('Projection error:', err);
  }
}

async function populateJoinTypeDropdown() {

  try {
    const response = await fetch('/planttypetable');
    const result = await response.json();
    const plantTypes = result.data;

    const select = document.getElementById('joinPlantTypeSelect');
    select.innerHTML = '<option value="">-- Select a Plant Type --</option>';
    
    plantTypes.forEach((type) => {
      const option = document.createElement('option');
      option.value = type[0]; 
      option.textContent = type[0];
      select.appendChild(option);

    });
  } catch (err) {
    console.error('Error populating plant type dropdown:', err);
  }
}

async function joinPlantType(event) {
  event.preventDefault();

  const resultMsg = document.getElementById('joinResultMsg');
  const resultContainer = document.getElementById('joinResult');

  resultMsg.textContent = '';
  resultContainer.innerHTML = '';

  const plantTypeName = document.getElementById('joinPlantTypeSelect').value;

  if (!plantTypeName) {
    resultMsg.textContent = 'Please select a plant type!';
    return;
  }

  try {
    const response = await fetch('/join-plant-planttype', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plantTypeName: plantTypeName }),
    });

    const data = await response.json();

    if (data.success && data.data.length > 0) {
      const table = document.createElement('table');
      table.border = '1';


      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = ['Plant ID', 'Latitude', 'Longitude', 'Radius', 'Status', 'Section ID', 'Type', 'Requirements', 'Description'];
      headers.forEach((header) => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      data.data.forEach((row) => {
        const tr = document.createElement('tr');
        
        const tdId = document.createElement('td');
        tdId.textContent = row.plant_id;
        tr.appendChild(tdId);

        const tdLat = document.createElement('td');
        tdLat.textContent = row.latitude.toFixed(4);
        tr.appendChild(tdLat);

        const tdLon = document.createElement('td');
        tdLon.textContent = row.longitude.toFixed(4);
        tr.appendChild(tdLon);

        const tdRadius = document.createElement('td');
        tdRadius.textContent = row.radius.toFixed(2);
        tr.appendChild(tdRadius);

        const tdStatus = document.createElement('td');
        tdStatus.textContent = row.is_ready === 1 ? 'Ready' : 'Not Ready';
        tr.appendChild(tdStatus);

        const tdSection = document.createElement('td');
        tdSection.textContent = row.section_id;
        tr.appendChild(tdSection);

        const tdType = document.createElement('td');
        tdType.textContent = row.type_name;
        tr.appendChild(tdType);

        const tdReq = document.createElement('td');
        tdReq.textContent = row.requirements || 'N/A';
        tr.appendChild(tdReq);

        const tdDesc = document.createElement('td');
        tdDesc.textContent = row.description;
        tr.appendChild(tdDesc);

        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      resultContainer.appendChild(table);
      resultMsg.textContent = `Join query succesfully executed`;
    } else {
      resultMsg.textContent = `No plants found.`;
    }
  } catch (err) {
    resultMsg.textContent = 'Error executing join query';
  }
}

// Fetches data from a table and displays it.
// tableID is string ex. 'persontable', endpoint is string ex. '/persontable'
// adjusted to handle database info as objects instead of arrays
async function loadTable({ endpoint, tableId }) {
  const tableElement = document.getElementById(tableId);
  const tableBody = tableElement.querySelector('tbody');

  const response = await fetch(endpoint, {
    method: 'GET',
  });

  const responseData = await response.json();
  const tableIdContent = responseData.data;

  // Always clear old, already fetched data before new fetching process.
  if (tableBody) {
    tableBody.innerHTML = '';
  }

  tableIdContent.forEach((user) => {
    const row = tableBody.insertRow();
    const fields = Object.values(user);
    fields.forEach((field, index) => {
      const cell = row.insertCell(index);
      // Format decimal numbers to 3 decimal places
      if (typeof field === 'number' && !Number.isInteger(field)) {
        cell.textContent = field.toFixed(3);
      } else {
        cell.textContent = field;
      }
    });
  });
}

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function () {
  checkDbConnection();
  fetchTableData();

  document
    .getElementById('resetDatabase')
    .addEventListener('click', resetDatabase);

  // insertion query
  document
    .getElementById('insertGardentable')
    .addEventListener('submit', insertGarden);
  // selection query
  document
    .getElementById('addFilterButton')
    .addEventListener('click', addSelectFilter);
  document
    .getElementById('removeFilterButton')
    .addEventListener('click', removeSelectFilter);
  document
    .getElementById('selectionPlanttable')
    .addEventListener('submit', selectPlant);
  document
    .getElementById('groupByTypeBtn')
    .addEventListener('click', groupByPlantType);
  document
    .getElementById('divisionBtn')
    .addEventListener('click', divisionQuery);
  document
    .getElementById('nestedAggBtn')
    .addEventListener('click', nestedAggregationQuery);
  document.getElementById('havingBtn').addEventListener('click', havingQuery);
  document
    .getElementById('projectionGardenForm')
    .addEventListener('submit', projectionGarden);

  document
    .getElementById('updatePlantForm')
    .addEventListener('submit', updatePlant);
  document
    .getElementById('updatePlantSelect')
    .addEventListener('change', handlePlantSelection);
  document
    .getElementById('joinPlantTypeForm')
    .addEventListener('submit', joinPlantType);
  setupCheckboxListeners();

  const queryButtons = document.querySelectorAll('.queryButtons button');
  queryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const queryType = button.dataset.query;
      const container = document.getElementById(`${queryType}-container`);

      // Toggle if clicking again
      if (button.classList.contains('selected')) {
        button.classList.remove('selected');
        container.style.display = 'none';
      } else {
        // Remove selected class from all buttons and hide all containers
        queryButtons.forEach((btn) => btn.classList.remove('selected'));
        document
          .querySelectorAll('.query-container')
          .forEach((cont) => (cont.style.display = 'none'));

        // Show selected button and container
        button.classList.add('selected');
        container.style.display = 'block';

        // Populate update dropdowns when update container is shown
        if (queryType === 'update') {
          populateUpdatePlantDropdowns();
        }

        if (queryType === 'join') {
          populateJoinTypeDropdown();
        }


      }
    });
  });
};

// General function to refresh the displayed table data.
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
  const tables = [
    { endpoint: '/persontable', tableId: 'persontable' },
    { endpoint: '/postalcodetable', tableId: 'postalcodetable' },
    { endpoint: '/tooltypetable', tableId: 'tooltypetable' },
    { endpoint: '/planttypetable', tableId: 'planttypetable' },
    { endpoint: '/sectiondimensionstable', tableId: 'sectiondimensionstable' },
    { endpoint: '/locationtable', tableId: 'locationtable' },
    { endpoint: '/gardentable', tableId: 'gardentable' },
    { endpoint: '/tooltable', tableId: 'tooltable' },
    { endpoint: '/hasaccesstable', tableId: 'hasaccesstable' },
    { endpoint: '/sectiontable', tableId: 'sectiontable' },
    { endpoint: '/planttable', tableId: 'planttable' },
    {
      endpoint: '/environmentaldatapointtable',
      tableId: 'environmentaldatapointtable',
    },
    { endpoint: '/maintenancelogtable', tableId: 'maintenancelogtable' },
    { endpoint: '/watertable', tableId: 'watertable' },
    { endpoint: '/nutrienttable', tableId: 'nutrienttable' },
    { endpoint: '/lighttable', tableId: 'lighttable' },
  ];

  tables.forEach((t) => loadTable(t));
}
