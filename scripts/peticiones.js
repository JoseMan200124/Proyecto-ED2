let currentChatBubble = null; // Variable global para mantener la referencia a la burbuja de chat actual
let currentDPI = null; // Almacena el DPI del candidato actualmente seleccionado

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

        const table = generateTable(currentData);
        document.getElementById('tableContainer').innerHTML = '';
        document.getElementById('tableContainer').appendChild(table);
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
        currentDPI = dpi;

        const conversations = await response.json();
        console.log("ESTAS SON TODAS LAS CONVERSACIONES =====");
        console.log(conversations);
        displayChatBubble(conversations);
    } catch (error) {
        console.error('Error al obtener las conversaciones:', error);
    }
}


function parseMessage(message) {
    const parts = message.split(' - ');
    return {
        date: parts[0],
        phoneNumber: parts[1].split(':')[0],
        content: parts[1].split(':').slice(1).join(':').trim()
    };
}

function displayChatBubble(conversations) {
    // Cierra la burbuja de chat anterior si existe
    if (currentChatBubble) {
        document.body.removeChild(currentChatBubble);
    }

    // Crea el contenedor para las nuevas burbujas de chat
    const chatContainer = document.createElement('div');
    chatContainer.classList.add('chat-container');
    document.body.appendChild(chatContainer);
    currentChatBubble = chatContainer;

    let lastPhoneNumber = '';

    conversations.forEach((conv) => {
        const { date, phoneNumber, content } = parseMessage(conv);
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message');
        chatMessage.textContent = content;

        const metaData = document.createElement('div');
        metaData.textContent = `${date} - ${phoneNumber}`;
        metaData.classList.add('chat-meta');
        chatMessage.appendChild(metaData);

        if (phoneNumber !== lastPhoneNumber) {
            chatMessage.classList.add('sender-1');
            lastPhoneNumber = phoneNumber;
        } else {
            chatMessage.classList.add('sender-2');
        }

        chatContainer.appendChild(chatMessage);
    });

    const assignButton = document.createElement('button');
    assignButton.textContent = 'Asignar Candidato';
    assignButton.classList.add('assign-button');
    assignButton.onclick = function() {
        Swal.fire({
            title: 'Asignación en Proceso',
            text: 'El candidato se encuentra en proceso de llenar la información correspondiente.',
            icon: 'info',
            confirmButtonText: 'Ok'
        }).then((result) => {
            if (result.isConfirmed) {
                setTimeout(() => {
                    Swal.fire({
                        title: 'Información Completada',
                        text: 'El candidato ha llenado toda la información correspondiente.',
                        icon: 'success',
                        confirmButtonText: 'Evaluar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            Swal.fire({
                                title: 'Evaluación del Candidato',
                                html: `
                                    <input type="text" id="comments" class="swal2-input" placeholder="Comentarios sobre el candidato">
                                    <div style="display: flex; justify-content: space-around;">
                                        <button id="ideal" class="swal2-confirm swal2-styled">Ideal</button>
                                        <button id="not-ideal" class="swal2-deny swal2-styled">No Ideal</button>
                                    </div>
                                `,
                                focusConfirm: false,
                                showConfirmButton: false,
                                preConfirm: () => { return false; },
                                didOpen: () => {
                                    document.getElementById('ideal').addEventListener('click', () => {
                                        const comments = document.getElementById('comments').value;
                                        Swal.close();
                                        const candidateData = currentData.find(person => person.dpi === currentDPI);

                                        if (candidateData) {
                                            // Mostrar la animación de correo electrónico
                                            Swal.fire({
                                                title: 'Enviando información del candidato...',
                                                text: 'Por favor, espera.',
                                                imageUrl: '../images/mail-download.gif',
                                                showConfirmButton: false,
                                                allowOutsideClick: false,
                                                allowEscapeKey: false,
                                                didOpen: () => {
                                                    Swal.showLoading();
                                                    setTimeout(() => {
                                                        Swal.fire({
                                                            title: 'Información del Candidato',
                                                            html: `
                                                                <p><strong>Nombre:</strong> ${candidateData.name}</p>
                                                                <p><strong>DPI:</strong> ${candidateData.dpi}</p>
                                                                <p><strong>Fecha de Nacimiento:</strong> ${new Date(candidateData.dateBirth).toLocaleDateString()}</p>
                                                                <p><strong>Dirección:</strong> ${candidateData.address}</p>
                                                                <p><strong>Comentarios:</strong> ${comments}</p>
                                                            `,
                                                            icon: 'info',
                                                            confirmButtonText: 'Cerrar'
                                                        });
                                                    }, 2000);
                                                }
                                            });
                                        } else {
                                            Swal.fire({
                                                title: 'Error',
                                                text: 'No se encontraron los datos del candidato.',
                                                icon: 'error',
                                                confirmButtonText: 'Cerrar'
                                            });
                                        }
                                    });
                                    document.getElementById('not-ideal').addEventListener('click', () => {
                                        const comments = document.getElementById('comments').value;
                                        Swal.close();
                                        console.log('Candidato No Ideal', comments);
                                    
                                        // Selecciona la instancia de DataTables a partir del ID del elemento <table>
                                        const table = $('#dataTable').DataTable();
                                        table.rows().every(function() {
                                            // Aquí se asume que 'data' es un array y el DPI está en el índice 1 (segunda columna)
                                            let rowData = this.data();
                                            if (rowData && rowData[1] === currentDPI) {
                                                this.remove().draw();
                                                currentData = currentData.filter(person => person.dpi !== currentDPI);
                                                Swal.fire({
                                                    title: 'Candidato Eliminado',
                                                    text: 'La información del candidato ha sido eliminada.',
                                                    icon: 'success',
                                                    confirmButtonText: 'Entendido'
                                                });
                                                return false; // Detener la iteración después de eliminar la fila
                                            }
                                        });
                                    });
                                    
                                    
                                }
                            });
                        }
                    });
                }, 5000); // 5 segundos de retraso
            }
        });
    };

    chatContainer.appendChild(assignButton);

    setTimeout(() => {
        chatContainer.classList.add('show-chat-bubble');
    }, 100);
}
function parseMessage(message) {
    const parts = message.split(' - ');
    return {
        date: parts[0],
        phoneNumber: parts[1].split(':')[0],
        content: parts[1].split(':').slice(1).join(':').trim()
    };
}



function parseMessage(message) {
    const parts = message.split(' - ');
    return {
        date: parts[0],
        phoneNumber: parts[1].split(':')[0],
        content: parts[1].split(':').slice(1).join(':').trim()
    };
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
            fetchConversationsAndShowChatBubble(person.dpi);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    return table;
}
