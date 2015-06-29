var express = require('express');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
var http = require('http');
var app = express();

// app.set('port', (process.env.PORT || 5000));
var port = process.env.PORT || 5000
app.use(express.static(__dirname + '/public'));

// app.get('/', function(request, response) {
//   var index = fs.readFileSync('./index.html');
//   response.setHeader('Content-Type', 'text/html');
//   response.send(index);
// });

// app.listen(app.get('port'), function() {
//   console.log("Node app is running on port:" + app.get('port'))
// })
var server = http.createServer(app)
server.listen(port)

i = 0;
wss = new WebSocketServer({server: server});

wss.on('connection', function connection(ws) {
  console.log('Client connected.');
  
  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    var response = JSON.stringify({"messageType": "updatePlayer", "id": msg.id, "x": msg.x, "y": msg.y, "rotation": msg.rotation});
    broadcast(response);
  });

  ws.on('close', function close(code, message) {
    console.log('client closed with code %s\nmessage: %s', code, message);
    var response = JSON.stringify({"messageType": "playerLeft", "id": ws.id});
    broadcast(response);
  });

  var clientMsg = {"messageType": "id", "id": i};
  ws.send(JSON.stringify(clientMsg));

  ws.id = i;
  var clientConnectedBroadcastMsg = {"messageType": "newPlayer", "id": i};
  broadcast(JSON.stringify(clientConnectedBroadcastMsg));

  i++;
});

broadcast = function(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
}
