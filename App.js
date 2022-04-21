import { WebSocketServer } from 'ws';

import {shuffle} from './Helper.js'
import {Game} from './Game.js'
import {Player} from './Player.js'


const MAX_GAME = 10;
const PORT = 18080;
const wss = new WebSocketServer({ port: PORT });

var games = [];
var players = [];
var usedGameId = [];
var avaliableGameId= shuffle([...Array(MAX_GAME).keys()]);

//TODO: use logging module to do proper logging

wss.on('connection', function connection(ws) {
  ws.send(new GameMessage("SERVER", "Connected").toString());

  ws.on('message', function message(rawmsg) {
    console.log('received: %s', rawmsg);

    let msgObj = GameMessage.parseFromSocket(rawmsg)

    if (msgObj.message === "NEWGAME") {
  		if (games.length >= MAX_GAME) {
  		  ws.send(new GameMessage("SERVER", "ERROR", "Sorry! The game server is busy. Please try again later."))
  		  ws.close();
				return;
  		}

			const gameId = avaliableGameId.shift();
      ws.gameId = newGame.gameId;
      
			const player1 = new Player(msgObj.sender, ws);
			player1.setColor(msgObj.remarks);
      players.push(player1);
      
			const newGame = new Game(gameid);
      newGame.AddPlayer(player1);
      games.push(newGame);

      const msg = new GameMessage("SERVER", "GAMEID", newGame.gameId).toString();
      console.log('send: %s', msg);
      ws.send(msg);

			usedGameId.push(gameId);

    } else if (msgObj.message === "JOINGAME") {
      const gameId = msgObj.remarks
      const game = games.find(g => g.gameId == gameId) // DON'T use "===", it compares the true memory address
      if (!game) {
        ws.send(new GameMessage("SERVER", "ERROR", "Game ID not found").toString())
        return
      }
      ws.gameId = game.gameId
      const player2 = new Player(msgObj.sender, ws)
      players.push(player2)
      game.AddPlayer(player2)
      ws.send(new GameMessage("SERVER", "JOINGAME", (game.player1.colorCode == 0) ? 1 : 0).toString())

    } else if (msgObj.message === "NEXTMOVE") {
      const player = players.find(p => p.playerId == msgObj.sender)
      if (!player) {
        ws.send(new GameMessage("SERVER", "ERROR", "Player ID invalid").toString())
        return
      }
      const gameId = player.gameId
      const game = games.find(g => g.gameId == gameId)
      if (!game) {
        ws.send(new GameMessage("SERVER", "ERROR", "Game ID not found").toString())
        return
      }
      for (let player of game.players) {
        // don't send to yourself
        if (player.playerId != msgObj.sender) {
          player.webSock.send(new GameMessage("RIVAL", "NEXTMOVE", msgObj.remarks).toString())
        }
      }
		}else{
			console.log("Unknow request received")
		}


  });

  ws.on('close', function close() {
     const gameId = ws.gameId
     const game = games.find(g => g.gameId == gameId)
     //console.log(ws.gameId)
     if (!game) {
       return
     }
     //console.log(game)
     for (let player of game.players) {
       if (player.webSock !== ws) {
        player.webSock.send(new GameMessage("SERVER", "GAMEOVER", "WON").toString())
        player.webSock.close()
       }
     }

     games = games.filter(function(g){
       return g.gameId != gameId
     })

  })
});