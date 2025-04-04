let map = L.map('map').setView([40.4168, -3.7038], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let points = [];
let currentList = null;

function refreshListSelector() {
    const select = document.getElementById('list-select');
    select.innerHTML = '';
    window.electronAPI.getLists().then(lists => {
        lists.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.innerText = name;
            select.appendChild(opt);
        });
        if (lists.length > 0) {
            select.value = lists[0];
            loadList(lists[0]);
        }
    });
}

function loadList(name) {
    currentList = name;
    window.electronAPI.loadPoints(name).then(data => {
        points = data;
        map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
        points.forEach(addPointToMap);
    });
}

document.getElementById('list-select').addEventListener('change', (e) => {
    loadList(e.target.value);
});

document.getElementById('create-list').addEventListener('click', () => {
    const name = document.getElementById('new-list-name').value.trim();
    if (name) {
        currentList = name;
        points = [];
        window.electronAPI.savePoints(currentList, points);
        refreshListSelector();
    }
});

document.getElementById('delete-list').addEventListener('click', () => {
    const name = document.getElementById('list-select').value;
    if (confirm(`¿Borrar la lista '${name}'?`)) {
        window.electronAPI.deleteList(name);
        refreshListSelector();
    }
});

document.getElementById('clear-points').addEventListener('click', () => {
    points = [];
    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
    if (currentList) window.electronAPI.savePoints(currentList, points);
});

// Botón para mostrar/ocultar el menú
document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

function addPointToMap(point) {
    const marker = L.marker(point.coords).addTo(map);
    const popupContent = document.createElement('div');

    const title = document.createElement('input');
    title.value = point.title;
    title.onchange = () => {
        point.title = title.value;
        window.electronAPI.savePoints(currentList, points);
    };
    popupContent.appendChild(title);

    const description = document.createElement('textarea');
    description.value = point.description;
    description.onchange = () => {
        point.description = description.value;
        window.electronAPI.savePoints(currentList, points);
    };
    popupContent.appendChild(description);

    marker.bindPopup(popupContent);

    marker.on('contextmenu', () => {
        points = points.filter(p => !(p.coords[0] === point.coords[0] && p.coords[1] === point.coords[1]));
        map.removeLayer(marker);
        if (currentList) window.electronAPI.savePoints(currentList, points);
    });
}

function createPointPopup(latlng) {
    window.electronAPI.getPlaceName(latlng.lat, latlng.lng).then(defaultTitle => {
        const formContainer = document.createElement('div');

        const titleInput = document.createElement('input');
        titleInput.placeholder = 'Título';
        titleInput.value = defaultTitle;
        formContainer.appendChild(titleInput);

        const descInput = document.createElement('textarea');
        descInput.placeholder = 'Descripción';
        formContainer.appendChild(descInput);

        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Guardar';
        formContainer.appendChild(saveBtn);

        const popup = L.popup()
            .setLatLng(latlng)
            .setContent(formContainer)
            .openOn(map);

        saveBtn.onclick = () => {
            const title = titleInput.value.trim();
            const description = descInput.value.trim();
            if (title && description) {
                const point = {
                    coords: [latlng.lat, latlng.lng],
                    title,
                    description,
                    location: defaultTitle
                };
                points.push(point);
                addPointToMap(point);
                if (currentList) window.electronAPI.savePoints(currentList, points);
                map.closePopup();
            }
        };
    });
}

map.on('click', function (e) {
    if (!currentList) return alert('Primero debes crear o seleccionar una lista.');
    createPointPopup(e.latlng);
});

refreshListSelector();
