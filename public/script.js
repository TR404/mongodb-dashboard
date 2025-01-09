function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

async function connectToDatabase() {
    showLoader();
    const dbUrl = document.getElementById('dbUrl').value;
    const collectionsList = document.getElementById('collectionsList');
    collectionsList.innerHTML = ''; 
    try {
        const response = await fetch('/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dbUrl }),
        });
        const data = await response.json();
        if (data.success) {
            const dbList = document.createElement('ul');
            Object.entries(data.databases).forEach(([dbName, collections]) => {
                const dbItem = document.createElement('li');
                dbItem.textContent = `Database: ${dbName}`;
                dbItem.style.cursor = 'pointer';

                dbItem.addEventListener('click', () => {
                    showCollections(dbName, collections);
                });
                dbList.appendChild(dbItem);
            });
            collectionsList.appendChild(dbList);
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to the database.');
    } finally {
        hideLoader();
    }
}

function showCollections(dbName, collections) {
    const collectionsList = document.getElementById('collectionsList');
    collectionsList.innerHTML = ''; 
    const collectionList = document.createElement('ul');
    collections.forEach(collection => {
        const collectionItem = document.createElement('li');
        collectionItem.textContent = collection;
        collectionItem.style.cursor = 'pointer';
        collectionItem.addEventListener('click', () => {
            showQuerySection(dbName, collection);
        });
        collectionList.appendChild(collectionItem);
    });
    collectionsList.appendChild(collectionList);
}

function showQuerySection(dbName, collectionName) {
    const querySection = document.getElementById('querySection');
    querySection.style.display = 'block';
    const queryInput = document.getElementById('queryInput');
    queryInput.value = `db.${collectionName}.find({})`; 
    querySection.setAttribute('data-db', dbName);
    querySection.setAttribute('data-collection', collectionName);
}

async function executeQuery() {
    showLoader();
    const dbUrl = document.getElementById('dbUrl').value;
    const queryInput = document.getElementById('queryInput').value;
    const queryResults = document.getElementById('queryResults');
    const querySection = document.getElementById('querySection');
    const dbName = querySection.getAttribute('data-db');
    const collectionName = querySection.getAttribute('data-collection');
    queryResults.innerHTML = ''; 
    try {
        const response = await fetch('/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbUrl,
                dbName,
                collectionName,
                query: queryInput
            }),
        });
        const data = await response.json();
        if (data.success) {
            data.results.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'result-item';
                itemDiv.innerHTML = `
                    <pre contenteditable="false" id="result-${index}">${JSON.stringify(item, null, 2)}</pre>
                    <div class="icon-buttons">
                        <button class="icon-button" onclick="editData(${index})">
                            <img src="https://img.icons8.com/ios-filled/50/000000/edit.png" alt="Edit">
                        </button>
                        <button class="icon-button" onclick="deleteData(${index})">
                            <img src="https://img.icons8.com/ios-filled/50/000000/delete.png" alt="Delete">
                        </button>
                        <button class="icon-button" onclick="submitUpdate(${index})" style="display: none;">
                            <img src="https://img.icons8.com/ios-filled/50/000000/save.png" alt="Save">
                        </button>
                    </div>
                `;
                queryResults.appendChild(itemDiv);
            });
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to execute the query.');
    } finally {
        hideLoader();
    }
}

function editData(index) {
    const resultElement = document.getElementById(`result-${index}`);
    resultElement.contentEditable = true;
    resultElement.focus();
    resultElement.style.border = '1px solid #ccc';
    resultElement.style.padding = '10px';
    resultElement.style.borderRadius = '5px';
    const saveButton = resultElement.parentElement.querySelector('.icon-buttons .icon-button:nth-child(3)');
    saveButton.style.display = 'inline-block';
}

async function submitUpdate(index) {
    showLoader();
    const dbUrl = document.getElementById('dbUrl').value;
    const querySection = document.getElementById('querySection');
    const dbName = querySection.getAttribute('data-db');
    const collectionName = querySection.getAttribute('data-collection');
    const updateInput = JSON.parse(document.getElementById(`result-${index}`).textContent);
    const originalData = JSON.parse(document.getElementById('queryResults').children[index].querySelector('pre').textContent);
    if (updateInput._id) {
        delete updateInput._id;
    }
    try {
        const response = await fetch('/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbUrl,
                dbName,
                collectionName,
                operation: 'updateOne',
                filter: { _id: originalData._id }, 
                update: updateInput
            }),
        });
        const data = await response.json();
        if (data.success) {
            alert('Data updated successfully');
            document.getElementById(`result-${index}`).contentEditable = false;
            document.getElementById(`result-${index}`).style.border = 'none';
            document.getElementById(`result-${index}`).style.padding = '0';
            document.getElementById(`result-${index}`).style.borderRadius = '0';
            const saveButton = document.getElementById(`result-${index}`).parentElement.querySelector('.icon-buttons .icon-button:nth-child(3)');
            saveButton.style.display = 'none';
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update the data.');
    } finally {
        hideLoader();
    }
}

async function deleteData(index) {
    showLoader();
    const dbUrl = document.getElementById('dbUrl').value;
    const querySection = document.getElementById('querySection');
    const dbName = querySection.getAttribute('data-db');
    const collectionName = querySection.getAttribute('data-collection');
    const originalData = JSON.parse(document.getElementById('queryResults').children[index].querySelector('pre').textContent);

    try {
        const response = await fetch('/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbUrl,
                dbName,
                collectionName,
                filter: { _id: originalData._id } 
            }),
        });
        const data = await response.json();
        if (data.success) {
            alert('Data deleted successfully');
            executeQuery(); 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete the data.');
    } finally {
        hideLoader();
    }
}

function showCreateForm() {
    const createForm = document.getElementById('createForm');
    createForm.style.display = 'flex';
}

function closeCreateForm() {
    const createForm = document.getElementById('createForm');
    createForm.style.display = 'none';
}

async function createData() {
    showLoader();
    const dbUrl = document.getElementById('dbUrl').value;
    const querySection = document.getElementById('querySection');
    const dbName = querySection.getAttribute('data-db');
    const collectionName = querySection.getAttribute('data-collection');
    const createInput = JSON.parse(document.getElementById('createInput').value);

    try {
        const response = await fetch('/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dbUrl,
                dbName,
                collectionName,
                data: createInput
            }),
        });
        const data = await response.json();
        if (data.success) {
            alert('Data created successfully');
            document.getElementById('createInput').value = ''; 
            closeCreateForm();
            executeQuery(); 
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to create the data.');
    } finally {
        hideLoader();
    }
}
