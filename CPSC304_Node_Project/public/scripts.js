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

  const idValue = document.getElementById('insertgId').value;
  const nameValue = document.getElementById('insertgName').value;
  const postalcodeValue = document.getElementById('insertgPostalCode').value;
  const streetnameValue = document.getElementById('insertgStreetName').value;
  const housenumberValue = document.getElementById('insertgHouseNumber').value;
  const owneridValue = document.getElementById('insertgOwnerId').value;

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

  const responseData = await response.json();
  const messageElement = document.getElementById('ginsertResultMsg');

  if (responseData.success) {
    messageElement.textContent = 'Data inserted successfully!';
    loadTable({ endpoint: '/gardentable', tableId: 'gardentable' });
  } else {
    messageElement.textContent = 'Error inserting data!';
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

  document
    .getElementById('insertGardentable')
    .addEventListener('submit', insertGarden);

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
