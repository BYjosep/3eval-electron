const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

contextBridge.exposeInMainWorld('electronAPI', {
    getLists: () => {
        console.log('getLists called');
        return ipcRenderer.invoke('get-lists');
    },
    loadPoints: (listName) => {
        console.log('loadPoints called with:', listName);
        return ipcRenderer.invoke('load-points', listName);
    },
    savePoints: (listName, points) => {
        console.log('savePoints called with:', listName);
        return ipcRenderer.invoke('save-points', listName, points);
    },
    deleteList: (listName) => {
        console.log('deleteList called with:', listName);
        return ipcRenderer.invoke('delete-list', listName);
    },
    getPlaceName: (lat, lon) => {
        console.log('getPlaceName called with:', lat, lon);
        return ipcRenderer.invoke('get-place-name', lat, lon);
    }
});

console.log('Preload script finished - API exposed');
