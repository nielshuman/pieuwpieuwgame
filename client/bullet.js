class Bullet extends Rect {
  constructor (x, y, vx, vy, author) {
    if (vx != 0) {
      super(x, y, 30, 10);
    } else if (vy != 0) {
      super(x, y, 10, 30);
    }
    this.author = author;
    this.color = '#e22';
    this.color2 = lerpColor(color(this.color), color("#fff"), 0.5)
    this.vx = vx;
    this.vy = vy;
  }
  static from_obj(o) {
    const b = new Bullet(o.x, o.y, o.vx, o.vy, o.author);
    b.x0 = o.x0;
    b.y0 = o.y0;
    b.id = o.id;
    b.spawn_time = o.spawn_time;
    b.color = o.color;
    return b;
  }
  update() {
    const age = world.now() - this.spawn_time;
    this.x = this.x0 + this.vx * age;
    this.y = this.y0 + this.vy * age;
    for (let wall of world.walls) {
      if (this.hit(wall)) {
        this.remove();
        return;
      }
    }
    if (this.hit(player) && this.author != socket.id) {
      console.log('DOOD!');
      socket.emit('bullet_hitplayer', this.id);
      player.takeDamage();
      hitSound.play();
      this.remove();
    }
  }
  remove(explode=true) {
    world.bullets.splice(world.bullets.indexOf(this), 1);
    if (explode) {
      const mx = this.x + this.w / 2, my = this.y + this.h / 2;
      particle_fx(mx, my, 150, "#000");
      particle_fx(mx, my, 100, "#f00");
      particle_fx(mx, my, 75, "#f0f");
      particle_fx(mx, my, 50, "#fff");
    }
  }
  show() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.w, this.h, 5, 5);
    // fill(this.color2);
    // rect(this.x + 3, this.y + 3, this.w - 6, this.h - 6, 5, 5);
  }
}
Bullet.MIN_DT = 10;
Bullet.speed = 0.5;
Bullet.max_age = world_size / bullet_speed;
