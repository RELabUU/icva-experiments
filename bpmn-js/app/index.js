'use strict';

var fs = require('fs');

//npm modules
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

//Variable containing XML file of the model
var xml;
var updatedXML;

//Array of suggestion id's
var idArray;

//Experiment number, as filled in by observer
var expNumber;

//The json object to which feedback is pushed
var obj;

//Variable determining if feedback is given
var feedbackGiven;

//Variable with all feedback info
var allFeedback = {
  "model": {
     "experimentNumber": expNumber,
     "language": "BPMN"
   },
   "feedback": [
  ]
};

//The suggestion file object
var JSONObject;

//Simplified JSON commit file
var simplifiedJSONfile;

//Empty JSON file for requesting suggestions
var emptyJSON = {
};

////////////////////////////////////////


//Loading diagram
var newDiagramXML = fs.readFileSync(__dirname + '/../resources/BlankDiagram.bpmn', 'utf-8');

//convert to JSON
if(updatedXML != null)
{
  var result = convert.xml2json(updatedXML, {compact: false, spaces: 4});
}

//POST JSON
var commitFile = fs.readFileSync(__dirname + '/../resources/commit_example_milo.json', 'utf-8');

function reqListener () {
  console.log(this.responseText);
}

//Display suggestions on screen
$('#giveSuggestions').click(function(e) {

  //Create the simplified JSON file for committing
  simplifyJSON();

  //Committing the simplified JSON file
  var req = new XMLHttpRequest();
  var url = "http://pacas.science.uu.nl:8080/ozpplomp/"+expNumber+"/commit/";
  req.open("POST", url, true);
  req.send(JSON.stringify(simplifiedJSONfile));

  //When the commit file is sent
  req.onreadystatechange = function() {//Call a function when the state changes.
  if(req.readyState == 4 && req.status == 200) {

      //Request the suggestion file
      var sugreq = new XMLHttpRequest();
      var sugurl = "http://pacas.science.uu.nl:8080/ozpplomp/"+expNumber+"/suggestions/";
      sugreq.open("POST", sugurl, true);
      sugreq.send(JSON.stringify(emptyJSON));

      //When the suggestion file is received
      sugreq.onreadystatechange = function() {//Call a function when the state changes.
      if(sugreq.readyState == 4 && sugreq.status == 200) {
          JSONObject = JSON.parse(sugreq.responseText);
          suggestions();

          //show the div and change button text
          $('#suggestionDiv').show();
          $('#suggTitle').show();
          document.getElementById("giveSuggestions").innerHTML = "Update suggestions";
        }
      }
    }
  }
});

//Function responsible for displaying suggestions and reacting to feedback events
function suggestions() {
  var suggestionTable = document.getElementById("suggestionList");
  idArray = JSONObject.suggestions;

  //Delete all rows, starting from position 1
  if(suggestionTable.rows.length > 1) {
    suggestionTable.innerHTML="<table id=\"suggestionList\"><thead><tr class=\"tableHead\"><th id=\"tableSuggestion\">Suggestion</th><th id=\"tableUseful\">Useful?</th></tr></thead><tbody></tbody></table>";
  }

  if (JSONObject.suggestions.length > 0) {
    for (var i = 0; i < JSONObject.suggestions.length; i++) {

      //Insert rows for all suggestions in JSON file
      var row = suggestionTable.insertRow(i+1);
      var cell = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      cell.innerHTML = JSONObject.suggestions[i].suggestionName;
      cell2.innerHTML =
      '<button id="usefulBttn">Useful</button>';
      cell3.innerHTML =
      '<button id="notUsefulBttn">Not useful</button>';
    }
  }
  else {
    var row = suggestionTable.insertRow(1);

    row.innerHTML = "<tr><td colspan=\"2\">There are no suggestions.</td></tr>";
  }

  //React to click events for second column (positive)
  $( "tr" ).each(function( index ) {
    $( this ).find( "td:eq(1) > button" ).click(function(event) {
      //Get the row in which the button is located
      var row = event.target.parentNode.parentNode;
      //Get the content of the first cell in that row
      var cel = row.cells[0];
      var suggestionName = cel.innerHTML;
      var rowIndex = row.rowIndex;
      var suggID = idArray[rowIndex-1].suggestionid;
      feedbackPos(suggestionName, rowIndex, suggID);

      if(JSONObject.suggestions.length == 0)
      {
        var row = suggestionTable.insertRow(1);
        row.innerHTML = "<tr><td colspan=\"2\">There are no suggestions.</td></tr>";
      }
    });
  });

  //React to click events for third column (negative)
  $( "tr" ).each(function( index ) {
    $( this ).find( "td:eq(2) > button" ).click(function(event) {
      //Get the row in which the button is located
      var row = event.target.parentNode.parentNode;
      //Get the content of the first cell in that row
      var cel = row.cells[0];
      var suggestionName = cel.innerHTML;
      var rowIndex = row.rowIndex;
      var suggID = idArray[rowIndex-1].suggestionid;
      feedbackNeg(suggestionName, rowIndex, suggID);

      if(JSONObject.suggestions.length == 0)
      {
        var row = suggestionTable.insertRow(1);
        row.innerHTML = "<tr><td colspan=\"2\">There are no suggestions.</td></tr>";
      }
    });
  });
}

//Updates the experiment number variable
$('#numberOk').click(function(e) {
  expNumber = (document.querySelector("#experimentNumber")).value;

  //Disable elements
  $( "#numberOk" ).css({"disabled": "true", "display": "none"});
  $( "#experimentNumber" ).prop( "disabled", true );
});

//Function that is called when positive feedback is given for a suggestion
function feedbackPos(name, rowindex, suggID) {
  //Writing feedback to historic feedback JSON
  allFeedback.feedback.push({"suggestionId": suggID, "suggestionName": name, "feedback": "useful"});

  feedbackGiven = "yes";

  //Send a new JSON file for every feedback element
  obj = {
    "model": {
       "experimentNumber": expNumber,
       "language": "iStar"
     },
     "feedback": [
       {
         "suggestionId": suggID,
         "suggestionName": name,
         "feedback": "useful"
       }
    ]
  };

  var json = JSON.stringify(obj, null, 4);

  //removing id from array
  idArray.splice(rowindex-1, 1);

  //removing suggestion from screen
  var suggestionTable = document.getElementById("suggestionList");
  suggestionTable.deleteRow(rowindex);

  //sending feedback info to service
  var feedbackreq = new XMLHttpRequest();
  var feedbackurl = "http://pacas.science.uu.nl:8080/ozpplomp/"+expNumber+"/feedback/";
  feedbackreq.open("POST", feedbackurl, true);
  feedbackreq.send(json);

  //pushing suggestion to past suggestion table
  var pastSuggestionTable = document.getElementById("pastSuggestionList");
  var row = pastSuggestionTable.insertRow(0);
  var cell = row.insertCell(0);
  var cell2 = row.insertCell(1);

  pastFeedback(obj);
}

//Function that is called when positive feedback is given for a suggestion
function feedbackNeg(name, rowindex, suggID) {
  //Writing feedback to historic feedback JSON
  allFeedback.feedback.push({"suggestionId": suggID, "suggestionName": name, "feedback": "not useful"});

  feedbackGiven = "yes";

  obj = {
    "model": {
       "experimentNumber": expNumber,
       "language": "iStar"
     },
     "feedback": [
       {
         "suggestionId": suggID,
         "suggestionName": name,
         "feedback": "not useful"
       }
    ]
  };

  var json = JSON.stringify(obj, null, 4);

  //removing id from array
  idArray.splice(rowindex-1, 1);

  //removing suggestion from screen
  var suggestionTable = document.getElementById("suggestionList");
  suggestionTable.deleteRow(rowindex);

  //sending feedback info to service
  var feedbackreq = new XMLHttpRequest();
  var feedbackurl = "http://pacas.science.uu.nl:8080/ozpplomp/"+expNumber+"/feedback/";
  feedbackreq.open("POST", feedbackurl, true);
  feedbackreq.send(json);

  pastFeedback();
}

//Displaying (or not displaying) past feedback
function pastFeedback(obj) {
  var pastSuggestionTable = document.getElementById("pastSuggestionList");
  var test = obj;

  //If there is at least 1 feedback result
  if (feedbackGiven == "yes") {
    //Delete content of table
    pastSuggestionTable.innerHTML="<table id=\"pastSuggestionList\"><thead><tr class=\"tableHead\"><th id=\"tableSuggestion\">Suggestion</th><th id=\"pastFeedback\">Rated</th></tr></thead><tbody></tbody></table>";

    for (var i = 0; i < allFeedback.feedback.length; i++) {
      var buttonID;
      if(allFeedback.feedback[i].feedback == "useful"){
        buttonID = "posFeedback";
      }
      else {
        buttonID = "negFeedback";
      }

      //Insert rows for all suggestions in JSON file
      var row = pastSuggestionTable.insertRow(i+1);
      var cell = row.insertCell(0);
      var cell2 = row.insertCell(1);
      cell.innerHTML = allFeedback.feedback[i].suggestionName;
      //cell2.innerHTML = obj.feedback[i].feedback;
      cell2.innerHTML = '<button id='+buttonID+'>'+allFeedback.feedback[i].feedback+'</button>';
    }
  }
  else {
    //Delete all rows, starting from position 1
    if(pastSuggestionTable.rows.length > 1) {
      for(var j = 0; j < pastSuggestionTable.rows.length; j++){
        pastSuggestionTable.deleteRow(1);
      }
    }
    var row = pastSuggestionTable.insertRow(1);
    var cell = row.insertCell(0);
    //var cell2 = row.insertCell(1);
    row.innerHTML = "<tr><td colspan=\"2\">No suggestions have been rated yet.</td></tr>";
  }
}

//Display suggestions on screen
$('#pastSuggestions').click(function(e) {
  if(document.getElementById("pastSuggestions").innerHTML == "View past suggestions"){
    //show the div and change button text
    $('#pastSuggDiv').show();
    document.getElementById("pastSuggestions").innerHTML = "Hide past suggestions";
    pastFeedback();
  }
  else {
    //hide the div and change button text
    $('#pastSuggDiv').hide()
    document.getElementById("pastSuggestions").innerHTML = "View past suggestions";
  }
});


//Standard BPMN-js functions

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

//Saving SVG
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

      //var xml = e.target.result;
      xml = e.target.result;

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

//Simplifying JSON model
function simplifyJSON() {
  //Make sure the model is updated before this function can be called
  if(updatedXML == null){
    alert("You have to update the model before requesting suggestions!")
  }
  //This part of the code is only executed when the model is updated first
  else if(updatedXML != null){
    var result = convert.xml2json(updatedXML, {compact: false, spaces: 4});

    var modelObject = JSON.parse(result);
    var modelString = JSON.stringify(modelObject, ['elements', 'attributes', 'id', 'name'], 4);
    var arrayofLines = modelString.split("\n");

    //Output of simplified
    var simplifiedJSONstring = "";
    //simplified JSON file to which every element is pushed
    simplifiedJSONfile = {
      "elements": [
      ]
    };

    for(var i = 0; i < (arrayofLines.length - 1); i++)
    {
      var condition1 = arrayofLines[i].includes("name");
      var condition2 = arrayofLines[i].includes("id");
      var condition3 = arrayofLines[i].includes("bpmn2:");
      var condition4 = arrayofLines[i+1].includes("name");

      if(((condition1 || condition2) && !condition3) && (condition2 && condition4))
      {
        var string1 = arrayofLines[i];
        var string2 = arrayofLines[i+1];

        simplifiedJSONstring += string1 + "\n" + string2 + "\n";

        //Remove unwanted string info
        var splitString1 = string1;
        splitString1 = splitString1.trim();
        splitString1 = splitString1.replace(" ","");
        splitString1 = splitString1.replace(/\"id\":/g,'');
        splitString1 = splitString1.replace(/,/g,'');
        splitString1 = splitString1.replace(/\"/g,'');

        var splitString2 = string2;
        splitString2 = splitString2.trim();
        splitString2 = splitString2.replace(" ","");
        splitString2 = splitString2.replace(/\"name\":/g,'');
        splitString2 = splitString2.replace(/,/g,'');
        splitString2 = splitString2.replace(/\"/g,'');

        simplifiedJSONfile.elements.push({"id": splitString1, "name": splitString2});
      }
    }

    var simpleString = JSON.stringify(simplifiedJSONfile, null, 4);
  }
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
  var downloadJSON = $('#downloadjson');

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
    //convert to JSON is the
    if(updatedXML == null){
      alert("You have to update the model before downloading!")
    }
    else if(updatedXML != null){
      var result = convert.xml2json(updatedXML, {compact: false, spaces: 4});
      download("JSONmodel.json", result);
    }
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

    //this function is called when the model changes
    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
      updatedXML = xml;
    });
  }, 500);

  modeler.on('commandStack.changed', exportArtifacts);
});
