//is the actual file that handels the button clicks and calls the functions in preload.js
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-file').addEventListener('click', () => {
        window.electron.newFile(); // Call the new file function exposed by preload.js
        console.log("new file clicked");
    });

    document.getElementById('open-file').addEventListener('click', () => {
        window.electron.openFile();
        renderFile(folderPath); // Call the open file function exposed by preload.js
        console.log("open file clicked");
    });

    window.electron.onFolderOpened((folderPath) => {
    loadDirectory(folderPath);
    });

    document.getElementById('save-file').addEventListener('click', () => {
        console.log('Save File clicked');
        window.electron.saveFile(); // Call the save file function exposed by preload.js
    });

    document.getElementById('minimize').addEventListener('click', () => {
        window.electron.minimize(); // Call the minimize function exposed by preload.js
        console.log("minimize clicked");
    });

    document.getElementById('maximize').addEventListener('click', () => {
        window.electron.maximize(); // Call the maximize function exposed by preload.js
        console.log("maximize clicked");
    });
    document.getElementById('close').addEventListener('click', () => {
        window.electron.close(); // Call the close function exposed by preload.js
        console.log("close clicked");
    });

    //viewport
    //this is the renderer function
    function renderFile(filePath) {
    const viewer = document.getElementById('file-viewer');
    const ext = path.extname(filePath).toLowerCase();

    viewer.innerHTML = '';

    // Display logic per file type
    //hopefully this will detect the file type and display it accordingly
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
      viewer.innerHTML = `<img src="file://${filePath}" style="max-width:100%; max-height:100%;" />`;
    } else if (['.mp4', '.webm', '.ogg'].includes(ext)) {
      viewer.innerHTML = `
        <video controls style="max-width:100%; max-height:100%;">
          <source src="file://${filePath}" type="video/${ext.slice(1)}">
          Your browser does not support the video tag.
        </video>`;
    } else if (ext === '.pdf') {
      viewer.innerHTML = `<iframe src="file://${filePath}" style="width:100%; height:100%;" frameborder="0"></iframe>`;
    } else if (['.txt', '.js', '.json', '.md', '.html', '.css'].includes(ext)) {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return viewer.textContent = 'Error reading file.';
        viewer.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(data)}</pre>`;
      });
    } else {
      viewer.textContent = 'Preview not supported for this file type.';
    }
  } 

// Escape HTML for safe text display
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

  //folder display
    const fileList = document.getElementById('fileList');

    // Load initial directory (home)
    loadDirectory();

    async function loadDirectory(dirPath) {
        const files = await window.electron.readDir(dirPath);
        fileList.innerHTML = '';
        files.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.name;
            li.className = item.isDirectory;
            li.style.cursor = item.isDirectory;
            li.style.cursor = 'pointer';

            li.addEventListener('click', (e) => {
                e.stopPropagation();
                if (item.type === 'folder') {
                  //opening the folder
                    loadDirectory(item.fullPath);
                } else {
                    //handle file click. open in editor
                    renderFile(item.fullPath);
                }
            });
            fileList.appendChild(li);
        });
    }
});

