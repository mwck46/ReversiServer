import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 18080 });
var hostId = ""
var playerId = ""
var clients = []


wss.on('connection', function connection(ws) {


  ws.on('message', function message(rawmsg) {
	const msg = JSON.parse(rawmsg).data
    console.log('received: %s', msg);
	
	const arr = msg.split(':')
	const source = arr[0]
	const data = arr[1]

	
	if(data === "HOST?"){
		if(hostId != ""){
			ws.send('SERVER:CHAR=H');
			hostId = source
		}else if (playerId != ""){
			ws.send('SERVER:CHAR=P');
			playerId = source
		}else{
			ws.send('SERVER:CHAR=V');
			playerId = source
		}
	}else if (data === "RESET"){
		console.log("reset")
	}else{
		wss.broadcast(msg)
	}
  });

	ws.on('close', function close(){
		hostId = playerId = ""
	})

  ws.send('SERVER:hi');
});

wss.broadcast = function broadcast(msg) {
   console.log(msg);
   wss.clients.forEach(function each(client) {
       client.send(msg);
    });
};