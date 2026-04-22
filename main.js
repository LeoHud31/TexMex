const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

let mainWindow;

//creates main app window
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
    console.log("close pressed. main")
});

// Handle file operations
// creates a new file 
ipcMain.on('new-file', () => {
    console.log('New File triggered. main');
    // Logic for creating a new file (e.g., clearing the editor or resetting state)
    mainWindow.webContents.send('file-created', 'New file created');
});

//opens an existing file
ipcMain.on('open-file', async () => {
    console.log('Open File triggered. main');
    const { cancelled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
    });

    if (!cancelled && filePaths.length > 0) {
        mainWindow.webContents.send('folder-opened', filePaths[0]);
    }
});

// saves the current file
ipcMain.on('save-file', async (_event, editorText) => {
    console.log('Current directory:', __dirname);
    console.log('Save File triggered. main');
    const { cancelled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: '.tex', extensions: ['tex'] }],
    });

    if (!cancelled && filePath) {
        // Replace 'Your file content here' with the actual content to save
        fs.writeFileSync(filePath, editorText, 'utf-8');
    }
});
//this is used for the file explorer functionality
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

// creates the command needed to see if a compiler already exists
function commandExists(command) {
  return new Promise((resolve) => {
    exec(
      `${command} --version`,
      { env: process.env, windowsHide: true },
      (error) => resolve(!error)
    );
  });
}

//checks Tex engine and returns engine type if found, or returns null otherwise
ipcMain.handle("check-tex-engine", async () => {
  const engines = ["pdflatex", "xelatex", "lualatex"];

  for (const engine of engines) {
    const found = await commandExists(engine);
    if (found) {
      console.log(`TeX engine found: ${engine}`);
      return { engine };
    }
  }

  console.warn("No TeX engine found in PATH");
  return { engine: null };
});


//TeX compiler handler with pdflatex

//handler for the compile-text event, adds to tempory dir with texmex prefix, writes to main.tex
ipcMain.handle("compile-tex", async (_event, { source, engine = "pdflatex" }) => {
    if (typeof source !== "string" || source.trim().length === 0) {
    throw new Error("No TeX source received from renderer");
    }

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "texmex-"));
    const texFile = path.join(workDir, "main.tex");
    const pdfFile = path.join(workDir, "main.pdf");
    fs.writeFileSync(texFile, source, "utf8");

    //finds the allowed latex engines and throws error if not supported
    const allowed = new Set(["pdflatex", "xelatex", "lualatex"]);
    if (!allowed.has(engine)) throw new Error("Unsupported engine");

    //arguments for the TeX engine, sets interaction mode to nonstopmode to prevent user prompts, 
    //halts on error,
    //formats errors with file and line info,
    //outputs to the temp directory
    const args = [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        "main.tex"
    ];    

    //spawns the TeX process and captures its output, resolves with the log if successful,
    //rejects with an error if compilation fails
    const output = await new Promise((resolve, reject) => {
        const proc = spawn(engine, args, { 
            cwd: workDir,
            windowsHide: true,
            env: process.env 
        });
        let log = "";
    
        proc.stdout.on("data", d => { log += d.toString(); });
        proc.stderr.on("data", d => { log += d.toString(); });

        proc.on("error", reject);
        proc.on("close", code => {
          if (code === 0 && fs.existsSync(pdfFile)) resolve(log);
          else reject(new Error(log || "TeX compile failed"));
        });
    });

    return { ok: true, pdfPath: pdfFile, log: output };
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