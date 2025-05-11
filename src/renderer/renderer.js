let callejeroClaro = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

let relieveClaro = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17
});

let callejeroOscuro = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

let relieveOscuro = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://stamen.com">Stamen Design</a>',
    subdomains: 'abcd',
    maxZoom: 20
});

let satelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, etc.'
});

let savedBase = localStorage.getItem('currentBase') || 'Callejero';
let currentBase = savedBase === 'Relieve' ? relieveClaro : callejeroClaro;

let map = L.map('map', {
    center: [40.4168, -3.7038],
    zoom: 13,
    layers: [currentBase]
});

const baseMaps = {
    "Callejero": callejeroClaro,
    "Satélite": satelite,
    "Relieve": relieveClaro
};

L.control.layers(baseMaps, null, { position: 'bottomleft' }).addTo(map);

let currentList = null;
let points = [];

function drawPoint(point) {
    const emojiIcon = L.divIcon({
        html: '<div style="font-size: 28px; line-height: 1;">📍</div>',
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        popupAnchor: [0, -40],
        className: ''
    });

    const marker = L.marker(point.coords, { icon: emojiIcon }).addTo(map);

    const editButton = `<button onclick="editPoint('${point.coords[0]}','${point.coords[1]}')">✏️ Editar</button>`;
    let popupText = `<b>${point.title}</b><br>${point.question}<br><ul>`;
    for (const ans of point.answers) {
        popupText += `<li>${ans.text}${ans.correct ? ' ✅' : ''}</li>`;
    }
    popupText += '</ul>' + editButton;

    marker.bindPopup(popupText);

    marker.on('contextmenu', () => {
        points = points.filter(p => p !== point);
        map.removeLayer(marker);
        savePoints();
    });

    marker._pointData = point;
}

function editPoint(lat, lng) {
    const point = points.find(p => p.coords[0] == lat && p.coords[1] == lng);
    if (!point) return;

    const template = document.getElementById('point-form-template');
    const form = template.content.cloneNode(true);
    const titleInput = form.querySelector('.point-title');
    const questionInput = form.querySelector('.point-question');
    const answersContainer = form.querySelector('.answers-container');
    const addAnswerBtn = form.querySelector('.add-answer');
    const saveBtn = form.querySelector('.save-point');

    titleInput.value = point.title;
    questionInput.value = point.question;

    function addAnswer(text = '', isCorrect = false) {
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

    point.answers.forEach(ans => addAnswer(ans.text, ans.correct));
    addAnswerBtn.onclick = () => addAnswer();

    saveBtn.onclick = () => {
        const newTitle = titleInput.value.trim();
        const newQuestion = questionInput.value.trim();

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

        if (!newTitle || !newQuestion || answers.length < 2 || !hasCorrect) {
            alert("Completa todos los campos correctamente.");
            return;
        }

        point.title = newTitle;
        point.question = newQuestion;
        point.answers = answers;

        map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer._pointData === point) {
                map.removeLayer(layer);
            }
        });

        drawPoint(point);
        savePoints();
        map.closePopup();
    };

    L.popup()
        .setLatLng(point.coords)
        .setContent(form)
        .openOn(map);
}

function savePoints() {
    if (currentList) {
        window.electronAPI.savePoints(currentList, points);
    }
}

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
    const themeToggle = document.getElementById('theme-toggle');
    const input = document.getElementById('new-list-name');
    const createBtn = document.getElementById('create-list');
    const select = document.getElementById('list-select');
    const deleteBtn = document.getElementById('delete-list');
    const clearBtn = document.getElementById('clear-points');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
            setTimeout(() => {
                input.removeAttribute('disabled');
                input.focus();
            }, 300);
        }
    });

    themeToggle.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        document.body.classList.toggle('dark-mode', isDark);
        updateMapTheme(isDark);
    });

    createBtn.addEventListener('click', () => {
        const name = input.value.trim();
        if (name && window.electronAPI && window.electronAPI.savePoints) {
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

    deleteBtn.addEventListener('click', () => {
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

    clearBtn.addEventListener('click', () => {
        points = [];
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
        savePoints();
    });

    map.on('baselayerchange', function (e) {
        localStorage.setItem('currentBase', e.name);
    });

    refreshListSelector();
});
