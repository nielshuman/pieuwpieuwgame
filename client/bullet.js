class Bullet extends Rect {
  constructor (cx, cy, vx, vy, power, author) {
    if (vx != 0) {
      super(cx - 15, cy - 5, 30, 10);
    } else if (vy != 0) {
      super(cx - 5, cy - 10, 10, 30);
    }
    this.vx = vx;
    this.vy = vy;
    this.x0 = this.x;
    this.y0 = this.y;
    this.power = power;
    this.author = author;
    this.spawn_time = world.now();
    this.id = `${author}:${this.spawn_time}`;
    this.color = '#e2b';
    this.update();
  }
  static from_obj(o) {
    const b = new Bullet(o.x0, o.y0, o.vx, o.vy, o.power, o.author);
    b.id = o.id;
    b.spawn_time = o.spawn_time;
    return b;
  }
  update() {
    const age = world.now() - this.spawn_time;
    if (age >= Bullet.max_age) { // if old
        this.remove();
        return;
    }
    this.x = this.x0 + this.vx * age;
    this.y = this.y0 + this.vy * age;
    for (let wall of world.walls) { // if hit wall
      if (this.hit(wall)) {
        log(2, "hit wall");
        this.hit_obj(wall);
        return;
      }
    }
    for (let p of world.players) { // if hit a player
      if (this.hit(p) && this.author != p.id && p.energy > 0) {
        log(2, "hit player", this.author, p.id, player.id);
        this.hit_obj(p);
        let snd = random(playerHitSounds);
        snd.rate(random(0.8, 1.2));
        snd.play();    
        return;
      }
    }
  }
  hit_obj(target) {
    log(2, "hit_obj", target);
    this.explode();
    this.remove();
    if (this.author == player.id) socket.emit('bullet_hit', this, target);
  }
  remove() {
    world.bullets.splice(world.bullets.indexOf(this), 1);
  }
  explode() {
    const mx = this.mx, my = this.my;
    fx_explosion(mx, my);
    if (this.hit(screen_rect)) screenshake = 2;
  }
  show() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.w, this.h, 5, 5);
    fill("#fff");
    rect(this.x + 3, this.y + 3, this.w - 6, this.h - 6, 5, 5);
    // particle_fx(this.mx, this.my, 50, 1, random([this.color, "#fff"]));
  }
}

Bullet.MIN_DT = 10;
Bullet.speed = 0.75;
Bullet.max_age = 8000 / Bullet.speed;