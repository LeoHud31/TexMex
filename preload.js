const { contextBridge, ipcRenderer } = require('electron');


// Expose APIs to the renderer process
//is essentally the link between the button and the function
contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    newFile: () => ipcRenderer.send('new-file'),
    openFile: () => ipcRenderer.send('open-file'), // just send the event
    onFolderOpened: (callback) => ipcRenderer.on('folder-opened', (event, folderPath) => callback(folderPath)),
    saveFile: () => ipcRenderer.send('save-file'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    readDir: (path) => ipcRenderer.invoke('read-dir', path),
    compileTex: (payload) => ipcRenderer.invoke('compile-tex', payload),
    getTexBackend: () => ipcRenderer.invoke('check-tex-engine')
});

