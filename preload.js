const { contextBridge, ipcRenderer } = require('electron');


// Expose APIs to the renderer process
//is essentally the link between the button and the function
contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    newFile: () => ipcRenderer.send('new-file'),
    openFile: () => ipcRenderer.send('open-folder'),
    onFileCreated: (callback) => ipcRenderer.on('file-created', (event) => callback()),
    onFolderOpened: (callback) => ipcRenderer.on('folder-opened', (event, folderPath) => callback(folderPath)),
    readDir: (path) => ipcRenderer.invoke('read-dir', path),
    compileCurrentTex: (payload) => ipcRenderer.invoke('compile-tex', payload),
    getTexBackend: () => ipcRenderer.invoke('check-tex-engine'),
    saveFile: (text) => ipcRenderer.send('save-file', text),
    PDFdownload: (callback) => ipcRenderer.on('pdf-download', (_event, pdfPath) => callback(pdfPath)),
    readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath)
});

