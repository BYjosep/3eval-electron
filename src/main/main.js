const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

function getListPath(name) {
    return path.join(dataDir, `${name}.json`);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        }
    });

    win.loadFile(path.join(__dirname, '../../public/index.html'));
}

ipcMain.handle('get-lists', () => {
    console.log("Leyendo listas desde:", dataDir);
    const files = fs.readdirSync(dataDir);
    console.log("Archivos encontrados:", files);
    return files
        .filter(f => f.endsWith('.json'))
        .map(f => path.basename(f, '.json'));
});

ipcMain.handle('load-points', (_, listName) => {
    const filePath = getListPath(listName);
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
});

ipcMain.handle('save-points', (_, listName, points) => {
    const filePath = getListPath(listName);
    fs.writeFileSync(filePath, JSON.stringify(points, null, 2), 'utf-8');
});

ipcMain.handle('delete-list', (_, listName) => {
    const filePath = getListPath(listName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
});

ipcMain.handle('get-place-name', (_, lat, lon) => {
    return new Promise((resolve) => {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        https.get(url, { headers: { 'User-Agent': 'electron-app' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.display_name || 'Ubicación desconocida');
                } catch {
                    resolve('Ubicación desconocida');
                }
            });
        }).on('error', () => {
            resolve('Ubicación desconocida');
        });
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
