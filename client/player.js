class Player extends SolidRect {
  constructor(x, y, w, h, c, e, id, hit_list) {
    super(x, y, w, h, c, hit_list);
    this.energy = e;
    this.id = id;
    this.username = username;
  }
  static from_obj(o) {
    const p = new Player(o.x, o.y, o.w, o.h, o.color, o.energy, o.id);
    p.join_time = o.join_time;
    p.username = o.username;
    return p;
  }

  show() {
    push();
    translate(this.x, this.y);
    // wobbly square
    let wob = sin((Date.now() - this.join_time) * 0.01) * 2;
    if (this.energy > 0) {
      noStroke(); fill(this.color);
    } else {
      noFill(); stroke(this.color);
      this.hit_list = [];
    }
    rect(-wob, wob, this.w + 2 * wob, this.h - 2 * wob, 8, 8);
    // health circle
    noFill(); strokeWeight(3.0);
    let c = "#0f08";
    if (this.energy < 67) c = "#ff08";
    if (this.energy < 25) c = "#f008";
    stroke(c);
    const r = this.energy * TAU / 100;
    if (r > 0) arc(this.w / 2, this.h / 2, this.w * 2, this.h * 2, 1.5 * PI, 1.5 * PI + r);
    // username
    textAlign(CENTER);
    textFont(font, 24);
    fill(this.energy > 0 ? "#fffa" : "#fff6"); stroke("#0008"); strokeWeight(1.0);
    text(this.username, this.w / 2, this.h + 36);
    pop();
  }

  takeDamage(multiplier=1) {
    this.energy = max(0, this.energy - (random(10,30) * multiplier));
  }
}
