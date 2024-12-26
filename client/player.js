class Player extends SolidRect {
  constructor(x, y, w, h, c, e, id, hit_list=[]) {
    super(x, y, w, h, c, hit_list);
    this.energy = e;
    this.id = id;
    this.speed = 1;
    this.standard_size = w;
    this.itemExpirationTime = -1;
    this.activeItem = 0;
  }

  static from_obj(o) {
    const p = new Player(o.x, o.y, o.w, o.h, o.color, o.energy, o.id);
    p.join_time = o.join_time;
    p.username = o.username;
    p.dx = o.dx;
    p.dy = o.dy;
    p.activeItem = o.activeItem;
    p.itemExpirationTime = o.itemExpirationTime;
    return p;
  }

  move(dx, dy) {
    super.move(dx*this.speed, dy*this.speed);
    this.dx = Math.sign(dx);
    this.dy = Math.sign(dy);
  }

  move2(dx, dy) {
    super.move(dx*this.speed, 0);
    super.move(0, dy*this.speed);
    this.dx = dx > dy? Math.sign(dx) : 0;
    this.dy = dy > dx? Math.sign(dy) : 0;
  }

  shoot(bullet_cost=2.5) {
    let dx = this.dx, dy = this.dy;
    let x = this.mx + dx * this.w / 2;
    let y = this.my + dy * this.h / 2;
    if (this.energy > bullet_cost) {
      this.energy -= bullet_cost;
      let bullet_power = 17 - 0.1 * this.energy;
      let b = new Bullet(x, y, dx, dy, bullet_power, this.id);
      socket.emit('bullet_new', b);
      world.bullets.push(b);
      let snd = random(shootSounds);
      snd.rate(random(0.8, 1.2));
      snd.play();
      fx_shoot(x, y, dx, dy);
    }

  }

  show() {
    push();
    rectMode(CENTER);
    const w2 = this.w / 2, h2 = this.h / 2;
    translate(this.x + w2 , this.y + h2);
    // wobbly square
    let wob = sin((Date.now() - this.join_time) * 0.01) * 2;
    if (this.energy > 0) {
      noStroke(); fill(this.color);
    } else {
      noFill(); stroke(this.color);
    }
    rect(0, 0, this.w + 2 * wob, this.h - 2 * wob, 8, 8);
    noFill(); stroke("#0006"); strokeWeight(3.0);
    circle((w2 + wob) * this.dx * 0.5, (h2 - wob) * this.dy * 0.5, w2 * 0.6);
    // health circle
    noFill(); strokeWeight(3.0);
    let c = "#0f08";
    if (this.energy < 67) c = "#ff08";
    if (this.energy < 25) c = "#f008";
    stroke(c);
    let r = this.energy * TAU / 100;
    if (r > 0) arc(0, 0, this.w * 2, this.h * 2, 1.5 * PI, 1.5 * PI + r);
    r = this.itemExpirationTime - world.now();
    if (this.activeItem && r > 0) {
      r *= TAU / this.activeItem.duration;
      stroke(this.activeItem.color);
      arc(0, 0, this.w * 2.5, this.h * 2.5, 1.5 * PI, 1.5 * PI + r);
    }
    // username
    textAlign(CENTER);
    textFont(font, 24);
    fill(this.energy > 0 ? "#fffa" : "#fff6"); stroke("#0008"); strokeWeight(1.0);
    text(this.username, 0, h2 + 36);
    pop();
  }

  useItem(item) {
    if (this.itemExpirationTime > 0) return;
    if (this.energy <= 0) return;
    this.itemExpirationTime = world.now() + item.duration;
    this.activeItem = item;
    log(1, 'using', item.type, 'item');
    if (item.type == 'size') {
      this.w *= random([1, 0.5, 2]);
      this.h *= random([1, 0.5, 2]);
    }
    if (item.type == 'speed') {
      this.speed *= 1.5;
    }
    if (item.type == 'health') {
      this.energy = min(100, this.energy+50);
    }
    socket.emit('item_used', item.id);
    item.remove();
  }

  clearEffects() {
    this.w = this.standard_size;
    this.h = this.standard_size;
    this.speed = 1;
    this.itemExpirationTime = -1;
    this.activeItem = 0;
  }
}
