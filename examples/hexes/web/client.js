/*global Sprite io*/

var colors = ['space', 'red', 'brown', 'purple', 'blue', 'orange', 
              'green', 'yellow'];

var socket = new io.Socket(); 
socket.connect();

var pieces = {};

var Commands = {
  map: function (map) {
    map.forEach(function (column, x) {
      column.forEach(function (id, y) {
        if (id) {
          var piece = new Piece(x, y, id);
        }
      });
    });
  },
  move: function (params) {
    pieces[params.id].moveTo(params.x, params.y);
  }
};


socket.on('message', function (message) {
  console.log("message", message);
  Object.keys(message).forEach(function (command) {
    if (Commands.hasOwnProperty(command)) {
      Commands[command](message[command]);
    } else {
      console.error("Invalid command " + command);
    }
  });
});

// Singleton selection sprite
var selection;
function Selection(piece) {
  if (selection) {
    selection.destroy();
  }
  selection = this;
  Sprite.call(this, piece.x, piece.y, 'highlight');
  this.piece = piece;
}
// Hook into destroy to remove reference from selection
Selection.prototype.destroy = function () {
  Sprite.prototype.destroy.call(this);
  selection = null;
};
// Destroy on click
Selection.prototype.onClick = Selection.prototype.destroy;

function Tile(x, y, colorCode) {
  Sprite.call(this, x, y, colors[colorCode]);
}
Tile.prototype.setTransform = function (x, y) {
  x = x * 55 + 10;
  y = 47 + y * 64 - (x % 2) * 32;
  Sprite.prototype.setTransform.call(this, x, y);
};

function Space(x, y) {
  this.gx = x;
  this.gy = y;
  Tile.call(this, x, y, 0);
}

Space.prototype.onClick = function (evt) {
  if (selection) {
    socket.send({move: {id: selection.piece.id, x: this.gx, y: this.gy}});
    selection.destroy();
  }
};

function Piece(x, y, colorCode) {
  Tile.call(this, x, y, colorCode);
  this.id = colorCode;
  pieces[colorCode] = this;
}

Piece.prototype.onClick = function (evt) {
  new Selection(this);
};
Piece.prototype.destroy = function () {
  delete pieces[this.id];
  Tile.prototype.destroy.call(this);
};

// Set up inheritance
Space.prototype.__proto__ = Tile.prototype;
Piece.prototype.__proto__ = Tile.prototype;
Tile.prototype.__proto__ = Sprite.prototype;
Selection.prototype.__proto__ = Sprite.prototype;

for (var x = 0; x < 5; x++) {
  for (var y = 0; y < (6 + x % 2); y++) {
    new Space(x, y);
  }
}