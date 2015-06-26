var express = require('express');
var fs = require('fs');
var WebSocketServer = require('ws').Server;
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static('public'));

app.get('/', function(request, response) {
  var index = fs.readFileSync('./index.html');
  response.setHeader('Content-Type', 'text/html');
  response.send(index);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running on port:" + app.get('port'))
})

i = 0;
wss = new WebSocketServer({port: 81});

wss.on('connection', function connection(ws) {
  console.log('received %s', ws);

  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    var response = JSON.stringify({"messageType": "updatePlayer", "id": msg.id, "x": msg.x, "y": msg.y, "rotation": msg.rotation});
    broadcast(response);
  });

  var clientMsg = {"messageType": "id", "id": i};
  ws.send(JSON.stringify(clientMsg));

  var clientConnectedBroadcastMsg = {"messageType": "newPlayer", "id": i++};
  broadcast(JSON.stringify(clientConnectedBroadcastMsg));
});

broadcast = function(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
}
