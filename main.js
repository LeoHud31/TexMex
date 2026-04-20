const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: __dirname + '/preload.js',
        },
        frame: false, // removes the default window frame, custom added later
    });
    mainWindow.maximize(), // maximizes the window
    // loads the index.html file into the window
    mainWindow.loadFile('index.html');

    mainWindow.on('window-close', function () {
        mainWindow = null;
    });
}

// Handle IPC events
//this drives the communication between the main process and the renderer process
//ipcMain is used to handle events sent from the renderer process
//this is for the custom toolbar buttons (minimize, maximize, close)
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

//this toggles the maximize state of the window
ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

//this closes the window
ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

// Handle file operations
// creates a new file 
ipcMain.on('new-file', () => {
    console.log('New File triggered');
    // Logic for creating a new file (e.g., clearing the editor or resetting state)
    mainWindow.webContents.send('file-created', 'New file created');
});

//opens an existing file
ipcMain.on('open-file', async () => {
    console.log('Open File triggered');
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });

    if (!canceled && filePaths.length > 0) {
        mainWindow.webContents.send('folder-opened', filePaths[0]);
    }
});

// saves the current file
ipcMain.on('save-file', async () => {
    console.log('Save File triggered');
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'Text Files', extensions: ['txt', 'md', 'json'] }],
    });

    if (!canceled && filePath) {
        // Replace 'Your file content here' with the actual content to save
        fs.writeFileSync(filePath, 'Your file content here', 'utf-8');
        mainWindow.webContents.send('file-saved', 'File saved successfully');
    }
});
//this is used for the file explorer functionality
const fs = require('fs');
const path = require('path');

ipcMain.handle('read-dir', async (event, dirPath) => {
    const targetPath = dirPath || require('os').homedir();
    const items = fs.readdirSync(targetPath, { withFileTypes: true });
    // Filter out hidden files (those starting with a dot)
    const visibleItems = items.filter(item => !item.name.startsWith('.'));
    return visibleItems.map(item => ({
        name: item.name,
        isDirectory: item.isDirectory() ? 'folder' : 'file',
        fullpath: path.join(targetPath, item.name),
    }));
});

//calls the createWindow function when the app is ready
app.whenReady().then(createWindow);

// quits the app when all windows are closed, except on macOS
//darwin is the name of the operating system that macOS is based on
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// creates a new window when the app is activated (macOS specific)
app.on('activate', function () {
    if (mainWindow === null) createWindow();
});