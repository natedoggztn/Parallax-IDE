'use strict';

require('codemirror/mode/javascript/javascript');
require('codemirror/addon/search/searchcursor');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/search/search');
require('codemirror/addon/selection/mark-selection');
require('codemirror/lib/codemirror.css');
require('../../assets/theme/parallax.css');

var CodeMirror = require('codemirror');

var keyExtension = require('./key-extension');
var ConsoleBuffer = require('./console-buffer');

require('./pbasic')(CodeMirror);

function editor(app, opts, done){

  var codeEditor;
  var outputConsole;
  var buffer = new ConsoleBuffer();

  var space = app.workspace;

  function output(evt){
    buffer.update(evt);
    if(outputConsole){
      outputConsole.innerHTML = buffer.getConsoleHTML();
      outputConsole.scrollTop = outputConsole.scrollHeight;
    }
  }

  function clearOutput(){
    buffer.clear();
    if(outputConsole){
      outputConsole.innerHTML = buffer.getConsoleHTML();
    }
  }

  output.clear = clearOutput;

  app.expose('logger', output);

  app.view('editor', function(el, cb){
    console.log('editor render');

    if(!codeEditor){
      let editorContainer = document.createElement('div');
      editorContainer.style.display = 'flex';
      editorContainer.style.flex = '1';
      editorContainer.style.flexDirection = 'column';
      editorContainer.setAttribute('id', 'editorContainer');
      el.appendChild(editorContainer);

      codeEditor = CodeMirror(editorContainer, {
        value: space.current.deref(),
        mode: 'pbasic',
        theme: 'parallax',
        lineNumbers: true
      });

      codeEditor.on('inputRead', handleInput);
      codeEditor.on('keyHandled', handleInput);

      codeEditor.setOption('styleSelectedText', true);
      codeEditor.setOption('tabSize', 2);
      codeEditor.setOption('extraKeys', {
        'Ctrl-Up': false,
        'Ctrl-Down': false,
        Tab: false
      });
      keyExtension.setup(app, codeEditor);

      space._structure.on('swap', function(){
        var editorCursor = codeEditor.getCursor();
        var current = space.current.deref();
        if(current !== codeEditor.getValue()){
          codeEditor.setValue(current);
          codeEditor.setCursor(editorCursor);
        }
      });
    }

    if(!outputConsole){
      outputConsole = document.createElement('pre');
      outputConsole.style.height = '200px';
      outputConsole.style.boxShadow = 'inset 0 5px 10px -5px rgba(0, 0, 0, 0.26)';
      outputConsole.style.backgroundColor = 'white';
      outputConsole.style.padding = '10px';
      outputConsole.style.overflow = 'auto';
      outputConsole.style.whiteSpace = 'pre-wrap';
      el.appendChild(outputConsole);
    }

    cb();
  });

  function handleInput(inst){
    space.updateContent(inst.getValue());
  }

  space.updateContent(opts.initial, done);
}

module.exports = editor;
