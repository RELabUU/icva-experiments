'use strict';

var fs = require('fs');

var $ = require('jquery'),
    BpmnModeler = require('bpmn-js/lib/Modeler'),
      CliModule = require('bpmn-js-cli'),
        ModelingDslModule = require('bpmn-js-cli-modeling-dsl'),
          convert = require('xml-js');

var container = $('#js-drop-zone');

var canvas = $('#js-canvas');

var modeler = new BpmnModeler({
  container: canvas,
  additionalModules: [
    CliModule, ModelingDslModule
  ],
  cli: {
    bindTo: 'cli'
  }
});

var canvasModel = modeler.get('canvas');

//convert to JSON
var xml = fs.readFileSync(__dirname + '/../resources/PizzaOrder.xml', 'utf-8');
var result = convert.xml2json(xml, {compact: false, spaces: 4});

//Loading diagram
var newDiagramXML = fs.readFileSync(__dirname + '/../resources/PizzaOrder.bpmn', 'utf-8');

//Loading suggestions JSON
var suggestionFile = fs.readFileSync(__dirname + '/../resources/suggestions_milo.json', 'utf-8');
var JSONObject = JSON.parse(suggestionFile);
//var resultaat = JSONObject.suggestions[0].suggestionName;

$('#parseSuggestions').click(function(e) {
  alert(resultaat);
});

//POST JSON
var commitFile = fs.readFileSync(__dirname + '/../resources/commit_example_milo.json', 'utf-8');

function reqListener () {
  console.log(this.responseText);
}

$('#postCommit').click(function(e) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", "http://pacas.science.uu.nl:8080/icva-review/5/commit/", true);
  xmlhttp.send(commitFile);
});

//Display suggestions on screen
$('#giveSuggestions').click(function(e) {
  var suggestionTable = document.getElementById("suggestionList");

  if (JSONObject.suggestions.length > 0) {
    for (var i = 0; i < JSONObject.suggestions.length; i++) {
      //Delete all rows, starting from position 1
      if(suggestionTable.rows.length > i+1) {
        for(var j = 0; j < suggestionTable.rows.length; j++){
          suggestionTable.deleteRow(1);
        }
      }

      //Insert rows for all suggestions in JSON file
      var row = suggestionTable.insertRow(i+1);
      var cell = row.insertCell(0);
      var cell2 = row.insertCell(1);
      cell.innerHTML = JSONObject.suggestions[i].suggestionName;
      cell2.innerHTML = "Useful";
    }
  }
  else {
    //Delete all rows, starting from position 1
    if(suggestionTable.rows.length > 1) {
      for(var j = 0; j < suggestionTable.rows.length; j++){
        suggestionTable.deleteRow(1);
      }
    }
    var row = suggestionTable.insertRow(1);
    var cell = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell.innerHTML = "No suggestions";
  }
});

function createNewDiagram() {
  openDiagram(newDiagramXML);
}

function openDiagram(xml) {

  modeler.importXML(xml, function(err) {

    if (err) {
      container
        .removeClass('with-diagram')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-diagram');
    }
  });
}

//Listening to events, for interaction log
var console = document.querySelector('#js-console');

function log() {
  console.value += Array.prototype.slice.call(arguments).map(function(e) {
    return String(e);
  }).join(' ');

  console.value += '\n';
  console.scrollTop = console.scrollHeight;
}

var eventBus = modeler.get('eventBus');

// you may hook into any of the following events
var events = [
  'element.hover',
  'element.out',
  //'element.click',
  'element.dblclick',
  'element.mousedown',
  'element.mouseup'
];

var eventClick = [
  'element.click'
];

events.forEach(function(event) {

  eventBus.on(event, function(e) {
    // e.element = the model element
    // e.gfx = the graphical element

    log(event, 'on', e.element.id);
  });
});

var deze;

eventClick.forEach(function(event) {

  eventBus.on(event, function(e) {
    // e.element = the model element
    // e.gfx = the graphical element

    deze = e.element.id;
  });
});

//When button is clicked, highlight the suggested change
$('#colorElement').click(function(e) {
  switch ($("g").hasClass("highlight")) {
    case false:
      canvasModel.addMarker(deze, 'highlight');
      break;
    case true:
      $("g").removeClass("highlight");
  }
});

//Opslaan van SVG
function saveSVG(done) {
  modeler.saveSVG(done);
}

function saveDiagram(done) {

  modeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  //When button is clicked, download the converted JSON file
  $('#downloadjson').click(function(e) {
    download("hello.txt", result);
  });

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var _ = require('lodash');

  var exportArtifacts = _.debounce(function() {

    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  modeler.on('commandStack.changed', exportArtifacts);
});
