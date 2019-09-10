class Bullet extends Rect {
  constructor (x, y, vx, vy, author) {
    if (vx != 0) {
      super(x, y, 30, 10);
    } else if (vy != 0) {
      super(x, y, 10, 30);
    }
    this.author = author;
    this.color = '#e2b';
    this.color2 = lerpColor(color(this.color), color("#fff"), 0.5)
    this.color3 = lerpColor(color(this.color), color("#000f"), 0.5)
    this.vx = vx;
    this.vy = vy;
    this.max_age = Bullet.max_age;
  }
  static from_obj(o) {
    const b = new Bullet(o.x, o.y, o.vx, o.vy, o.author);
    b.x0 = o.x0;
    b.y0 = o.y0;
    b.id = o.id;
    b.spawn_time = o.spawn_time;
    b.max_age = o.max_age;
    b.color = o.color;
    return b;
  }
  update() {
    const age = world.now() - this.spawn_time;
    if (age >= this.max_age) { // if old
        this.remove();
        this.explode();
        return;      
    }
    this.x = this.x0 + this.vx * age;
    this.y = this.y0 + this.vy * age;
    for (let wall of world.walls) { // if hit wall
      if (this.hit(wall)) {
        this.remove();
        this.explode();
        return;
      }
    }
    for (let p of world.players) { // if hit a player
      if (this.hit(p) && p.id != player.id) {
        hitSound.play();
        this.explode();
        this.remove();
      }
    }
    if (this.hit(player) && this.author != player.id) { // if hit this player
      console.log('DOOD!');
      socket.emit('bullet_hitplayer', this.id);
      player.takeDamage(this.power);
      hitSound.play();
      this.explode();
      this.remove();
    }
  }
  remove() {
    world.bullets.splice(world.bullets.indexOf(this), 1);
  }
  explode() {
    const mx = this.mx, my = this.my;
    particle_fx(mx, my, 150, 20, "#000");
    particle_fx(mx, my, 100, 20, "#f00");
    particle_fx(mx, my, 75, 20, "#f0f");
    particle_fx(mx, my, 50, 20, "#fff");
    screenshake = 3;
  }
  show() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.w, this.h, 5, 5);
    fill(this.color2);
    rect(this.x + 3, this.y + 3, this.w - 6, this.h - 6, 5, 5);
    // particle_fx(this.mx, this.my, 50, 1, random([this.color, "#fff"]));
  }
}
Bullet.MIN_DT = 10;
Bullet.speed = 0.75;
Bullet.max_age = 2000 / bullet_speed;
