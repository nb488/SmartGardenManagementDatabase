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
        "persontableContainer",
        "postalcodetableContainer",
        "tooltypetableContainer",
        "planttypetableContainer",
        "sectiondimensionstableContainer",
        "locationtableContainer",
        "gardentableContainer",
        "tooltableContainer",
        "hasaccesstableContainer",
        "sectiontableContainer",
        "planttableContainer",
        "environmentaldatapointtableContainer",
        "maintenancelogtableContainer",
        "watertableContainer",
        "nutrienttableContainer",
        "lighttableContainer"
];

// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}


// This function resets or initializes the demotable.
async function resetDemotable() {
    const response = await fetch("/initiate-demotable", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetResultMsg');
        messageElement.textContent = "demotable initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// This function resets or initializes the gardentable.
async function resetGardentable() {
    const response = await fetch("/initiate-gardentable", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('gresetResultMsg');
        messageElement.textContent = "gardentable initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Inserts new records into the demotable.
async function insertDemotable(event) {
    event.preventDefault();

    const idValue = document.getElementById('insertId').value;
    const nameValue = document.getElementById('insertName').value;

    const response = await fetch('/insert-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: idValue,
            name: nameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        loadTable({endpoint: '/demotable', tableId: 'demotable'});
    } else {
        messageElement.textContent = "Error inserting data!";
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
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            garden_id: idValue,
            name: nameValue,
            postal_code: postalcodeValue,
            street_name: streetnameValue,
            house_number: housenumberValue,
            owner_id: owneridValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('ginsertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        loadTable({endpoint: '/gardentable', tableId: 'gardentable'});
    } else {
        messageElement.textContent = "Error inserting data!";
    }
}



// Fetches data from a table and displays it.
// tableID is string ex. 'persontable', endpoint is string ex. '/persontable'
async function loadTable({endpoint, tableId}) {
    const tableElement = document.getElementById(tableId);
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch(endpoint, {
        method: 'GET'
    });

    const responseData = await response.json();
    const tableIdContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    tableIdContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// Updates names in the demotable.
async function updateNameDemotable(event) {
    event.preventDefault();

    const oldNameValue = document.getElementById('updateOldName').value;
    const newNameValue = document.getElementById('updateNewName').value;

    const response = await fetch('/update-name-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldName: oldNameValue,
            newName: newNameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Name updated successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error updating name!";
    }
}

// Counts rows in the demotable.
// Modify the function accordingly if using different aggregate functions or procedures.
async function countDemotable() {
    const response = await fetch("/count-demotable", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('countResultMsg');

    if (responseData.success) {
        const tupleCount = responseData.count;
        messageElement.textContent = `The number of tuples in demotable: ${tupleCount}`;
    } else {
        alert("Error in count demotable!");
    }
}


// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    checkDbConnection();
    fetchTableData();

    // HOME
    // displays all tables in the database?
    const homeButton = document.getElementById("homebutton");
    homeButton.addEventListener("click", () => {
        HideAllQueryComponents();
        // TODO: Make function to intialize/reset all the tables (currently only resets garden and demotable)?
        // TODO: Remove demotable later
        // TODO: Home tab can show all the tables
        document.getElementById("resetDemotable").addEventListener("click", resetDemotable);
        document.getElementById("resetGardentable").addEventListener("click", resetGardentable);

        document.getElementById("insertDemotable").addEventListener("submit", insertDemotable);

        document.getElementById("updataNameDemotable").addEventListener("submit", updateNameDemotable);
        document.getElementById("countDemotable").addEventListener("click", countDemotable);
    });

    // INSERT QUERY
    // displays the query box and the required tables for insertion query
    const insertButton = document.getElementById("insertbutton");
    insertButton.addEventListener("click", () => {
        HideAllQueryComponents();

        document.getElementById("insertGardentable").classList.add("active");
        document.getElementById("insertGardentable").addEventListener("submit", insertGarden);
        // show garden, person, location table when button is clicked
        document.getElementById("gardentableContainer").classList.add("active");
        document.getElementById("persontableContainer").classList.add("active");
        document.getElementById("locationtableContainer").classList.add("active");
    });

    // NEXT QUERY

};


// Hides all the query components, used to reset the view of the window.
function HideAllQueryComponents() {
    document.querySelectorAll(".queryTable").forEach(element => {
        element.classList.remove("active");
    });
    document.querySelectorAll(".queryinputContainer").forEach(element => {
        element.classList.remove("active");
    });
}

// General function to refresh the displayed table data. 
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
    const tables = [
    {endpoint: '/demotable', tableId: 'demotable' },
    {endpoint: '/persontable', tableId: 'persontable' },
    {endpoint: '/postalcodetable', tableId: 'postalcodetable'},
    {endpoint: '/tooltypetable', tableId: 'tooltypetable' },
    {endpoint: '/planttypetable', tableId: 'planttypetable'},
    {endpoint: '/sectiondimensionstable', tableId: 'sectiondimensionstable' },
    {endpoint: '/locationtable', tableId: 'locationtable'},
    {endpoint: '/gardentable', tableId: 'gardentable' },
    {endpoint: '/tooltable', tableId: 'tooltable'},
    {endpoint: '/hasaccesstable', tableId: 'hasaccesstable' },
    {endpoint: '/sectiontable', tableId: 'sectiontable'},
    {endpoint: '/planttable', tableId: 'planttable' },
    {endpoint: '/environmentaldatapointtable', tableId: 'environmentaldatapointtable'},
    {endpoint: '/maintenancelogtable', tableId: 'maintenancelogtable' },
    {endpoint: '/watertable', tableId: 'watertable'},
    {endpoint: '/nutrienttable', tableId: 'nutrienttable' },
    {endpoint: '/lighttable', tableId: 'lighttable'}
    ];

    tables.forEach(t => loadTable(t));
}




