class World {
  constructor(w) {
    this.players = [];
    this.walls = [];
    for (let wall of w.walls) {
      this.walls.push(Rect.from_obj(wall));
    }
    this.bullets = [];
    this.age = w.age;
    this.start_time = Date.now();
  }

  now() { return this.age + Date.now() - this.start_time; }

}
