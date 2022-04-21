export class Game {
  constructor(id) {
    this.gameId = id;
    this.players = [];
  }

  AddPlayer(player) {
    player.gameId = this.gameId
    this.players.push(player)
  }
}