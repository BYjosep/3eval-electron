const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

function getListPath(name) {
    return path.join(app.getPath('userData'), `${name}.json`);
}

function createWindow () {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, '../../public/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-lists', () => {
    const files = fs.readdirSync(app.getPath('userData'));
    return files.filter(f => f.endsWith('.json')).map(f => path.basename(f, '.json'));
});

ipcMain.handle('load-points', (event, listName) => {
    const filePath = getListPath(listName);
    try {
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error al leer archivo:', err);
        return [];
    }
});

ipcMain.handle('save-points', (event, listName, points) => {
    const filePath = getListPath(listName);
    try {
        fs.writeFileSync(filePath, JSON.stringify(points, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error al escribir archivo:', err);
    }
});

ipcMain.handle('delete-list', (event, listName) => {
    const filePath = getListPath(listName);
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.error('Error al borrar lista:', err);
    }
});

ipcMain.handle('get-place-name', async (event, lat, lon) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    return new Promise((resolve) => {
        https.get(url, {
            headers: {
                'User-Agent': 'openstreetmap-electron-app/1.0 (tucorreo@ejemplo.com)'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const address = json.address || {};
                    const name = address.village || address.town || address.city || 'Lugar desconocido';
                    resolve(name);
                } catch (e) {
                    console.error('Error al parsear Nominatim:', e);
                    resolve('Lugar desconocido');
                }
            });
        }).on('error', (err) => {
            console.error('Error solicitud HTTPS:', err);
            resolve('Lugar desconocido');
        });
    });
});
