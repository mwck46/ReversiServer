import { WebSocketServer } from 'ws';

import { shuffle } from './Helper.js'
import { Game } from './Game.js'
import { GameMessage } from './GameMessage.js'
import { Player } from './Player.js'


const MAX_GAME = 100;
const PORT = 18080;
const wss = new WebSocketServer({ port: PORT });

var games = [];
var players = [];
var usedGameId = [];
var avaliableGameId = shuffle([...Array(MAX_GAME).keys()]);

//TODO: 
// 1) use logging module to do proper logging
// 2) may be use finite state machine?

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
      ws.gameId = gameId;

      const player1 = new Player(msgObj.sender, ws);
      player1.setColor(msgObj.remarks);
      players.push(player1);

      const newGame = new Game(gameId);
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
      const msg = new GameMessage("SERVER", "JOINGAME", game.players[0].colorCode).toString();
      ws.send(msg);
      console.log('send: %s', msg);

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
        if (player.playerId != msgObj.sender) {
          player.webSock.send(new GameMessage("RIVAL", "NEXTMOVE", msgObj.remarks).toString())
        }
      }
    } else {
      console.log("Unknow request received")
    }


  });

  ws.on('close', function close() {
    const gameId = ws.gameId
    const game = games.find(g => g.gameId == gameId)
    if (!game) {
      console.log(`Connection closed, the game is already destroyed id = ${ws.gameId}`)
      return
    }
    console.log(`Connection closed, free up game id = ${ws.gameId}`)

    //console.log(game)
    for (let player of game.players) {
      if (player.webSock !== ws) {
        player.webSock.send(new GameMessage("SERVER", "GAMEOVER", "WON").toString())
        player.webSock.close()
      }
    }

    avaliableGameId.push(gameId);
    games = games.filter(function (g) {
      return g.gameId != gameId
    })

  })
});