class World {
  constructor(w) {
    this.players = [];
    this.walls = [];
    for (let wall of w.walls) {
      this.walls.push(Rect.from_obj(wall));
    }
    this.bullets = [];
    this.server_start_time = w.start_time;
    this.start_time = Date.now();
  }

  showPlayers() {
    noStroke();
      for (let player of this.players) {
        if (player.id != socket.id) {
          noStroke();
          fill(str(player.color));
          rect(player.x, player.y, player.w, player.h, 10);
          }
      }

  }

  showWalls() {
    noStroke();
    for (let wall of this.walls) {
     fill(str(wall.c));
     rect(wall.x, wall.y, wall.w, wall.h)
    }
  }

  showBullets() {
    for (let bullet of world.bullets){
      noStroke();
      fill(str(bullet.color));
      rect(bullet.x, bullet.y, bullet.w, bullet.h, 10);
      }
  }
}
