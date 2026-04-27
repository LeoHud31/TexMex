//is the actual file that handels the button clicks and calls the functions in preload.js
document.addEventListener('DOMContentLoaded', async () => {
  const newBtn = document.getElementById("new-file");
  const openBtn = document.getElementById("open-file");
  const saveBtn = document.getElementById("save-file");
  const minBtn = document.getElementById("minimize");
  const maxBtn = document.getElementById("maximize");
  const closeBtn = document.getElementById("close");
  const fileList = document.getElementById("fileList");
  const preview = document.getElementById("Preview");
  const renderBtn = document.getElementById("render-button");

  //logic for checking if a TeX engine is available and compiling the current document
  const backend = await window.electron.getTexBackend();
  let currentEngine = backend?.engine || "pdflatex";

  let currentDirPath;

  //checks if the engine is available and logs it
  if (backend && backend.engine){
      console.log("TeX engine available:", backend.engine);
  } else {
    console.log("No Tex engine found, using fallback mode")
    preview.textContent = "No Tex engine found in system PATH. Editor fallback mode is activated."
  }
  
  async function loadDirectory(dirPath) {
      currentDirPath = dirPath || currentDirPath;

      const files = await window.electron.readDir(currentDirPath);
      fileList.innerHTML = '';

      //for each of files in dir, creates list item and adds click listener to open in viewer
      //if its a folder it loads dir if its a file it renders the file
      files.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.name;
          li.className = item.isDirectory;
          li.style.cursor = 'pointer';

          //saves data attributes for the files/folder path which is used when the user clicks it
          li.setAttribute('data-path', item.fullpath);
          li.setAttribute('data-type', item.isDirectory);
          li.setAttribute('data-name', item.name);

          li.addEventListener('click', (e) => {
              e.stopPropagation();

              //gets the path and type of the clicked item from the data attributes
              const clickedPath = li.getAttribute('data-path');
              const itemType = li.getAttribute('data-type');

              if (itemType === 'folder') {
                  loadDirectory(clickedPath);
              } else {
                  renderFile(clickedPath);
              }
          });
          fileList.appendChild(li);
      });
  }

//gets the fileviewer element 
async function renderFile(filePath) {
  const lower = filePath.toLowerCase();

    //renders in the editor if text based file
    if (/\.(tex|bib|txt|md|log)$/i.test(lower)) {
      const text = await window.electron.readTextFile(filePath);
      window.setEditorText(text);
      preview.innerHTML = '';
      return;
    }

    //renders image if its an image file
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/.test(lower)) {
      preview.innerHTML = '<img style="max-width:100%;max-height:100%;" />';
      preview.querySelector("img").src = "file:///" + filePath.replace(/\\/g, "/");
      return;
    }

    //renders video file
    if (/\.(mp4|webm|ogg)$/.test(lower)) {
      preview.innerHTML = '<video controls style="max-width:100%;max-height:100%;"></video>';
      preview.querySelector("video").src = "file:///" + filePath.replace(/\\/g, "/");
      return;
    }

    //renders pdf in preview
    if (/\.pdf$/.test(lower)) {
      preview.innerHTML = '<iframe style="width:100%;height:100%;" frameborder="0"></iframe>';
      preview.querySelector("iframe").src = "file:///" + filePath.replace(/\\/g, "/");
      return;
    }

    preview.textContent = "Preview not supported for this file type.";
}

  //compiles the current tex document using the available engine and displays the PDF in the preview panel
async function compileCurrentTex(engine) {
  try {
    if (typeof window.getEditorText !== "function") {
      throw new Error("window.getEditorText is not available");
    }

    //makes sure the source is a non-empty string before sending to backend
    const source = window.getEditorText();
    if (!source || typeof source !== "string") {
      throw new Error("Editor returned empty/invalid TeX source");
    }

    const result = await window.electron.compileCurrentTex({ source, engine });
    
    preview.innerHTML = '<iframe style="width:100%;height:100%" frameborder="0"></iframe>';
    preview.querySelector("iframe").src = "file:///" + result.pdfPath.replace(/\\/g, "/");
  } catch (err) {
    console.error("compileCurrentTex failed:", err);
    preview.textContent = String(err.message || err);
  } 
}

newBtn?.addEventListener("click", () => window.electron.newFile());
openBtn?.addEventListener("click", () => window.electron.openFile());
saveBtn?.addEventListener("click", () => window.electron.saveFile(window.getEditorText()));
minBtn?.addEventListener("click", () => window.electron.minimize());
maxBtn?.addEventListener("click", () => window.electron.maximize());
closeBtn?.addEventListener("click", () => window.electron.close());
renderBtn?.addEventListener("click", () => { compileCurrentTex(currentEngine); });

window.electron.onFolderOpened((folderPath) => {
  loadDirectory(folderPath);
});

window.electron.PDFdownload(({savePath}) => {
  if (!savePath) return;

  const slashIndex = Math.max(savePath.lastIndexOf('/'), savePath.lastIndexOf('\\'));
  const folderPath = slashIndex >= 0 ? savePath.slice(0, slashIndex) : currentDirPath;

  loadDirectory(folderPath);
});

await loadDirectory();

});
