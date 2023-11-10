let currentData = []; 

document.getElementById('uploadForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('csvFile', document.getElementById('csvFile').files[0]);

    try {
        const response = await fetch('http://localhost:3001/person/insertPersons', {
            method: 'POST',
            body: formData
        });

        currentData = await response.json();

        // Convertir la data a tabla
        const table = generateTable(currentData);
        document.getElementById('tableContainer').innerHTML = '';
        document.getElementById('tableContainer').appendChild(table);
        // Inicializar DataTables
        $(table).DataTable({
            "pageLength": 10, 
            "lengthChange": false 
        });

    } catch (error) {
        console.error('Error al cargar el archivo:', error);
    }
});
async function fetchConversationsAndShowChatBubble(dpi) {
    try {
        const response = await fetch(`http://localhost:3001/person/conversations/${dpi}`);
        if (!response.ok) {
            console.error('Error al obtener las conversaciones.');
            return;
        }

        const conversations = await response.json();
        displayChatBubble(conversations);
    } catch (error) {
        console.error('Error al obtener las conversaciones:', error);
    }
}
function displayChatBubble(conversations) {
    const chatBubble = document.createElement('div');
    chatBubble.classList.add('chat-bubble');

    conversations.forEach(conv => {
        const chatMessage = document.createElement('p');
        chatMessage.textContent = conv;
        chatBubble.appendChild(chatMessage);
    });

    document.body.appendChild(chatBubble);
    
   
    setTimeout(() => {
        chatBubble.classList.add('show-chat-bubble');
    }, 100);
}
function generateTable(data) {
    const table = document.createElement('table');
    table.classList.add('styled-table'); 
    table.setAttribute('id', 'dataTable'); 

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Name', 'DPI', 'Date of Birth', 'Address'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(person => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = person.name;
        row.appendChild(nameCell);
        
        const dpiCell = document.createElement('td');
        dpiCell.textContent = person.dpi;
        row.appendChild(dpiCell);

        const dobCell = document.createElement('td');
        dobCell.textContent = new Date(person.dateBirth).toLocaleDateString();
        row.appendChild(dobCell);

        const addressCell = document.createElement('td');
        addressCell.textContent = person.address;
        row.appendChild(addressCell);

        row.addEventListener('click', () => {
            console.log("ENTRE AL EVENTO DE DARLE CLIC A LA PERSONA ==========");
            fetchConversationsAndShowChatBubble(person.dpi);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    return table;
}

