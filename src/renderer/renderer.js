let callejero = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

let satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, etc.'
});

let relieve = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17
});

let map = L.map('map', {
    center: [40.4168, -3.7038],
    zoom: 13,
    layers: [callejero]
});

const baseMaps = {
    "Callejero": callejero,
    "Satélite": satelite,
    "Relieve": relieve
};

L.control.layers(baseMaps, null, { position: 'bottomleft' }).addTo(map);

const defaultIcon = new L.Icon({
    iconUrl: './icons/marker-light.svg',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -40]
});

const darkIcon = new L.Icon({
    iconUrl: './icons/marker-dark.svg',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [0, -40]
});

function getCurrentIcon() {
    return document.body.classList.contains('dark-mode') ? darkIcon : defaultIcon;
}

let currentList = null;
let points = [];

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
    });
}

function loadList(name) {
    currentList = name;
    window.electronAPI.loadPoints(name).then(data => {
        points = data;
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
        points.forEach(drawPoint);
    });
}

function drawPoint(point) {
    const marker = L.marker(point.coords, { icon: getCurrentIcon() }).addTo(map);
    let popupText = `<b>${point.title}</b><br>${point.question}<br><ul>`;
    for (const ans of point.answers) {
        popupText += `<li>${ans.text}${ans.correct ? ' ✅' : ''}</li>`;
    }
    popupText += '</ul>';
    marker.bindPopup(popupText);
    marker.on('contextmenu', () => {
        points = points.filter(p => p !== point);
        map.removeLayer(marker);
        savePoints();
    });
}

function savePoints() {
    if (currentList) {
        window.electronAPI.savePoints(currentList, points);
    }
}

function createPointForm(latlng) {
    const template = document.getElementById('point-form-template');
    const form = template.content.cloneNode(true);
    const titleInput = form.querySelector('.point-title');
    const questionInput = form.querySelector('.point-question');
    const answersContainer = form.querySelector('.answers-container');
    const addAnswerBtn = form.querySelector('.add-answer');
    const saveBtn = form.querySelector('.save-point');

    function addAnswer(text = '', isCorrect = false) {
        if (answersContainer.children.length >= 10) return;

        const item = document.createElement('div');
        item.className = 'answer-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = text;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'correct';

        if (isCorrect) radio.checked = true;

        item.appendChild(radio);
        item.appendChild(input);
        answersContainer.appendChild(item);
    }

    addAnswer();
    addAnswer();

    addAnswerBtn.onclick = () => addAnswer();

    saveBtn.onclick = () => {
        const title = titleInput.value.trim();
        const question = questionInput.value.trim();

        const answers = [];
        let hasCorrect = false;

        answersContainer.querySelectorAll('.answer-item').forEach(item => {
            const text = item.querySelector('input[type="text"]').value.trim();
            const correct = item.querySelector('input[type="radio"]').checked;
            if (text) {
                answers.push({ text, correct });
                if (correct) hasCorrect = true;
            }
        });

        if (!title || !question || answers.length < 2 || !hasCorrect) {
            alert("Debe completar el título, la pregunta, al menos 2 respuestas y marcar una como correcta.");
            return;
        }

        const point = {
            coords: [latlng.lat, latlng.lng],
            title,
            question,
            answers,
            location: 'Ubicación'
        };

        points.push(point);
        drawPoint(point);
        savePoints();
        map.closePopup();
    };

    L.popup()
        .setLatLng(latlng)
        .setContent(form)
        .openOn(map);
}

map.on('click', function (e) {
    if (!currentList) {
        alert('Primero debes crear o seleccionar una lista.');
        return;
    }
    createPointForm(e.latlng);
});

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const input = document.getElementById('new-list-name');
    const createBtn = document.getElementById('create-list');
    const select = document.getElementById('list-select');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            setTimeout(() => {
                input.removeAttribute('disabled');
                input.focus();
            }, 300);
        }
    });

    createBtn.addEventListener('click', () => {
        const name = input.value.trim();
        if (name) {
            currentList = name;
            points = [];
            window.electronAPI.savePoints(name, points).then(() => {
                refreshListSelector();
                input.value = '';
            });
        }
    });

    select.addEventListener('change', e => {
        const selected = e.target.value;
        currentList = selected;
        loadList(currentList);
    });

    document.getElementById('delete-list').addEventListener('click', () => {
        if (currentList && confirm(`¿Eliminar lista '${currentList}'?`)) {
            window.electronAPI.deleteList(currentList).then(() => {
                currentList = null;
                points = [];
                refreshListSelector();
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) map.removeLayer(layer);
                });
            });
        }
    });

    document.getElementById('clear-points').addEventListener('click', () => {
        points = [];
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
        savePoints();
    });

    refreshListSelector();
});
