# BPMN tool including suggestion service
## General information
This tool is created for a bachelor's thesis by Milo Plomp. It is an extension of an open source BPMN modeling tool.

## Base tool
The base of this tool is [bpmn-js](https://github.com/bpmn-io/bpmn-js), specifically the [modeler example](https://github.com/bpmn-io/bpmn-js-examples/tree/master/modeler).

## How to use
All changes are made in app/index.js and app/index.html

The tool depends on npm packages, which are listed in package.json

To run the tool, open the main directory in a terminal and run the following command:
```
grunt auto-build
```
Please note: grunt should be installed locally on your machine.

Some issues might arise due to resource conflict when running the tool. For the experiments, we used a CORS browser extension.
