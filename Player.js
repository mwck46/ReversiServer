export class Player {
  constructor(playerId, webSock) {
    this.playerId = playerId
    this.webSock = webSock
  }

  setGameId(gameId) {
    this.gameId = gameId
  }
  
  setColor(colorCode) {
    this.colorCode = colorCode 
  }
}