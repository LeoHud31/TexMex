import { EditorState } from "https://esm.sh/@codemirror/state@6";
import { EditorView, keymap } from "https://esm.sh/@codemirror/view@6";
import { defaultKeymap, history, historyKeymap } from "https://esm.sh/@codemirror/commands@6";
import { latex } from "https://esm.sh/codemirror-lang-latex@0.2.0";

console.log("editor.js loaded");

if (!window.EditorView) {
  console.error("CodeMirror not loaded properly.");
}

const mount = document.querySelector("#Editor");
if (!mount) {
  console.error("Could not find #Editor");
  throw new Error("Mount element missing");
}

const state = EditorState.create({
  doc: "\\documentclass{article}\n\\begin{document}\nHello world\n\\end{document}",
  extensions: [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    latex(),
    EditorView.lineWrapping,
    EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily: "Consolas, monospace",
        fontSize: "15px"
      }
    })
  ]
});

const editor = new EditorView({
  state,
  parent: mount
});

console.log("editor working");
editor.focus();