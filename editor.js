import { EditorState } from "https://esm.sh/@codemirror/state@6";
import { EditorView, keymap } from "https://esm.sh/@codemirror/view@6";
import { defaultKeymap, history, historyKeymap, indentMore } from "https://esm.sh/@codemirror/commands@6";
import { autocompletion, startCompletion, acceptCompletion, completionStatus } from "https://esm.sh/@codemirror/autocomplete@6";
import { latex, latexLanguage, latexCompletionSource } from "https://esm.sh/codemirror-lang-latex@0.2.0";



const mount = document.getElementById("Editor");
if (!mount) {
    throw new Error("Mount element not found");
}

console.log("editor.js loaded");

const packages = [
"amsmath", "amssymb", "array", "biblatex", "booktabs",
"caption", "cleveref", "csquotes", "fancyhdr", "float",
"fontspec", "geometry", "graphicx", "hyperref", "listings",
"longtable", "microtype", "minted", "multicol", "multirow",
"setspace", "siunitx", "subcaption", "tabularx", "tcolorbox",
"tikz", "titlesec", "unicode-math", "url", "xcolor", "xparse"
];

function completepackages(context) {
    const line = context.state.doc.lineAt(context.pos);
    const uptoCursor = line.text.slice(0, context.pos - line.from);

    //looks at where the curso is and checks if using a preloaded package
    const match = /\\usepackage\{([^}]*)$/.exec(uptoCursor);
    if (!match) return null;

    return {
        from: context.pos - match[1].length,
        options : packages.map(pkg => ({ 
            label: pkg,
            type: "keyword",
            apply: pkg + "}" 
        })),
        validFor: /^[^}]*/
    };
}

function combinedLatexCompletion(context) {
    //gives 2 options for autocompletion
  return completePackages(context) || latexCompletionSource(context);
}

function shouldAutoTrigger(state) {
  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  const uptoCursor = line.text.slice(0, pos - line.from);

  // Trigger when typing LaTeX command or usepackage
  return /\\[A-Za-z]{2,}$/.test(uptoCursor) || /\\usepackage\{[^}]*$/.test(uptoCursor);
}

//defines the state
const state = EditorState.create({
  doc: "\\documentclass{article}\n\\usepackage{hyperref}\n\\begin{document}\nHello world\n\\end{document}",
  extensions: [
    history(),
    keymap.of([
        ...defaultKeymap, 
        ...historyKeymap,
        { key: "Cmd-Space", run: startCompletion },
        { key: "Ctrl-Space", run: startCompletion },
        { key: "Tab",
            run: (view) => 
                completionStatus(view.state) === "active" 
                ? acceptCompletion(view) 
                : indentMore(view)
        }
    ]),
    latex(),
    latexLanguage.data.of({autocomplete: combinedLatexCompletion}),
    autocompletion({ 
        activateOnTyping: true,
        selectOnOpen: true,
    }),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged) return;
      if (shouldAutoTrigger(update.state)) startCompletion(update.view);
    }),
    EditorView.lineWrapping
  ]
});

const editor = new EditorView({
  state,
  parent: mount
});

console.log("editor working");

//launches editor
editor.focus();
window.getEditorText = () => editor.state.doc.toString();
