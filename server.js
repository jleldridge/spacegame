var express = require('express');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
var http = require('http');
var engine = require('./engine/SpaceGameEngine.js');
var app = express();

var port = process.env.PORT || 5000;
app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
server.listen(port);

var i = 0;
var bullet_i = 0;
var wss = new WebSocketServer({
  server: server
});

var shipsById = {};
var bulletsById = {};
var ships = [];
var bullets = [];

wss.on('connection', function connection(ws) {
  console.log('Client connected.');
  var newShip = {
    "id": i,
    "x": 50,
    "y": 50,
    "dx": 0,
    "dy": 0
  };
  shipsById[newShip.id] = newShip;
  ships.push(newShip);

  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    switch (msg.messageType) {
      case "addBullet":
        // var response = JSON.stringify({"messageType": "addBullet", "x": msg.x, "y": msg.y, "dx": msg.dx, "dy":msg.dy});
        var newBullet = {
          "id": bullet_i++,
          "x": msg.x,
          "y": msg.y,
          "dx": msg.dx,
          "dy": msg.dy
        };
        bullets.push(newBullet);
        bulletsById[newBullet.id] = newBullet;
        // broadcast(response);
        break;
      case "updatePlayer":
        shipsById[msg.id].dx = msg.dx;
        shipsById[msg.id].dy = msg.dy;
        shipsById[msg.id].rotation = msg.rotation;
        // var response = JSON.stringify({"messageType": "updatePlayer", "id": msg.id, "x": msg.x, "y": msg.y, "rotation": msg.rotation});
        // broadcast(response);
        break;
    }
  });

  ws.on('close', function close(code, message) {
    console.log('Client closed with code %s\n%s', code, message);

    var ship = shipsById[ws.id];
    var shipIndex = ships.indexOf(ship);
    ships.splice(shipIndex, 1);
    shipsById[ship.id] = null;

    var response = JSON.stringify({
      "messageType": "playerLeft",
      "id": ws.id
    });
    broadcast(response);
  });

  var clientMsg = {
    "messageType": "id",
    "id": i
  };
  ws.send(JSON.stringify(clientMsg));

  ws.id = i;
  var clientConnectedBroadcastMsg = {
    "messageType": "newPlayer",
    "id": i
  };
  broadcast(JSON.stringify(clientConnectedBroadcastMsg));

  i++;
});

var broadcast = function(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
}

var update = function() {
  for (var i = 0; i < ships.length; i++) {
    ships[i].x += ships[i].dx;
    ships[i].y += ships[i].dy;
    var shipMsg = JSON.stringify({
      "messageType": "updatePlayer",
      "id": ships[i].id,
      "x": ships[i].x,
      "y": ships[i].y,
      "rotation": ships[i].rotation
    });
    broadcast(shipMsg);
  }

  for (var i = 0; i < bullets.length; i++) {
    console.log("bullet%s x:%s y:%s", i, bullets[i].x, bullets[i].y);
    bullets[i].x += bullets[i].dx;
    bullets[i].y += bullets[i].dy;
    var bulletMsg = JSON.stringify({
      "messageType": "updateBullet",
      "id": bullets[i].id,
      "x": bullets[i].x,
      "y": bullets[i].y
    });
    broadcast(bulletMsg);
  }
}

setInterval(update, 25);
