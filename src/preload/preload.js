const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getLists: () => ipcRenderer.invoke('get-lists'),
    loadPoints: (listName) => ipcRenderer.invoke('load-points', listName),
    savePoints: (listName, points) => ipcRenderer.invoke('save-points', listName, points),
    deleteList: (listName) => ipcRenderer.invoke('delete-list', listName),
    getPlaceName: (lat, lon) => ipcRenderer.invoke('get-place-name', lat, lon)
});
