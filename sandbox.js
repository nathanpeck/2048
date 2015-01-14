var async = require('async'),
    prompt = require('prompt'),
    colors = require('colors'),
    _      = require('lodash');

var map = [];
var dimensions = 5;

for (var rowNum = 0; rowNum < dimensions; rowNum++) {
  var row = [];
  for (var colNum = 0; colNum < dimensions; colNum++) {
    row.push(0);
  }
  map.push(row);
}

function drawBlankVert() {
  for (var delim = 0; delim < (9 * dimensions) + 1; delim ++) {
    if (delim % 9 === 0)
      process.stdout.write('|');
    else
      process.stdout.write(' ');
  }
  process.stdout.write('\n');
}

function drawFilledRow() {
  for (var delim = 0; delim < (9 * dimensions)+1; delim ++) {
    process.stdout.write('-');
  }
  process.stdout.write('\n');
}

function draw(thisMap) {
  drawFilledRow();
  for (var rowNum = 0; rowNum < dimensions; rowNum++) {
    drawBlankVert();
    process.stdout.write('|');
    for (var colNum = 0; colNum < dimensions; colNum++) {
      var numberString;
      if (thisMap[rowNum][colNum] === 0)
        numberString = '';
      else
        numberString = thisMap[rowNum][colNum].toString();
      var paddingLength = Math.floor((8 - numberString.length) / 2);
      for (pad = 0; pad < paddingLength; pad++) {
        process.stdout.write(' ');
      }
      process.stdout.write(numberString);
      for (pad = 0; pad < 8 - paddingLength - numberString.length; pad++) {
        process.stdout.write(' ');
      }
      process.stdout.write('|');
    }
    process.stdout.write('\n');
    drawBlankVert();
    drawFilledRow();
  }
}

function randomDrop(force) {
  var dropped = false;
  /*if (force)
    dropped = false;
  else if (Math.round(Math.random()))
    dropped = true;
  else
    dropped = false;*/
  while(!dropped) {
    var x = Math.floor(Math.random()*dimensions);
    var y = Math.floor(Math.random()*dimensions);
    if (map[y][x] === 0) {
      map[y][x] = 2;
      dropped = true;
    }
  }
}

function move(thisMap, direction) {
  var localMap = _.cloneDeep(thisMap);
  var initial;
  var delta;
  if (direction == 'left') {
    initial = 0;
    delta = 1;
  }
  else if (direction == 'right') {
    initial = dimensions - 1;
    delta = -1;
  }
  else if (direction == 'up') {
    localMap = recomposeMap(localMap);
    return recomposeMap(move(localMap, 'left'));
  }
  else if (direction == 'down') {
    localMap = recomposeMap(localMap);
    return recomposeMap(move(localMap, 'right'));
  }
  else {
    return localMap;
  }

  for (var row = 0; row < dimensions; row++) {
    var workingNumber = null;
    var workingCol;
    for (var col = initial; col < dimensions && col >= 0; col += delta) {
      if (workingNumber === null) {
        workingNumber = localMap[row][col];
        workingCol = col;
      }
      else {
        if (localMap[row][col] === 0) {
          // Do nothing, just skip over this tile
        }
        else if (workingNumber === 0 && localMap[row][col] !== 0) {
          localMap[row][workingCol] = localMap[row][col];
          localMap[row][col] = 0;
          workingCol = workingCol + delta;
          workingNumber = localMap[row][workingCol];
        }
        else if (localMap[row][col] == workingNumber) {
          localMap[row][workingCol] += localMap[row][col];
          localMap[row][col] = 0;
          workingCol = workingCol + 1;
          workingNumber = localMap[row][workingCol];
        }
      }
    }
  }

  return localMap;
}

// Turn rows into columns for the purpose of
// simplifying the move logic for up/down
function recomposeMap(map, command) {
  var localMap = [];
  var dimensions = 5;

  for (var rowNum = 0; rowNum < dimensions; rowNum++) {
    var row = [];
    for (var colNum = 0; colNum < dimensions; colNum++) {
      row.push(map[colNum][rowNum]);
    }
    localMap.push(row);
  }

  return localMap;
}

function testMove(thisMap, command) {
  var newMap = move(thisMap, command);
  var identical = true;

  for (var row = 0; row < dimensions; row++) {
    for (var col = 0; col < dimensions; col++) {
      if (thisMap[row][col] != newMap[row][col]) {
        identical = false;
      }
    }
  }
  return !identical;
}

prompt.start({
  colors: false
});

randomDrop(true);

async.whilst(
  function () {
    var found = false;
    for (var x = 0; x < dimensions; x++) {
      for (var y = 0; y < dimensions; y++) {
        if (map[x][y] === 0) {
          found = true;
        }
      }
    }
    return found;
  },
  function (doneWithLoop) {
    draw(map);
    prompt.get(['command'], function (err, result) {
      if (result.command == 'exit') {
        process.exit(0);
      }
      else {
        if (testMove(map, result.command)) {
          map = move(map, result.command);
          randomDrop();
          doneWithLoop();
        }
        else {
          console.log('Illegal move');
          doneWithLoop();
        }
      }
    });
  },
  function () {
    console.log('done');
  }
);