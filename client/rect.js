class Rect {
  constructor(x, y, w, h, c='#000') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = c;
    this.dir = 'right'
  }
  static from_obj(o) {
    return new Rect(o.x, o.y, o.w, o.h, o.color);
  }
  show() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.w, this.h);
  }
  hit(other) {
    return (this.x + this.w >= other.x &&    // r1 right edge past r2 left
            this.x <= other.x + other.w &&   // r1 left edge past r2 right
            this.y + this.h >= other.y &&    // r1 top edge past r2 bottom
            this.y <= other.y + other.h);
  }
}

class SolidRect extends Rect {
  constructor(x, y, w, h, c, hit_list) {
    super(x, y, w, h, c);
    this.hit_list = hit_list;
    this.dx = 0;
    this.dy = 0;
  }
  move(dx, dy) {
    const px = this.x, py = this.y;
    const px2 = px + this.w, py2 = py + this.h;
    this.x += dx; this.y += dy;
    let min_t = 1, result = "ok";
    for (let o of this.hit_list) {
      if (!this.hit(o)) continue;
      const qx = o.x, qy = o.y, qx2 = qx + o.w, qy2 = qy + o.h;
      if (dy != 0) {
        let t, x;
        t = (qy - py2) / dy; // top edge
        x = px + t * dx;
        if (t >= 0 && t < min_t && x < qx2 && qx < x + this.w) {
          min_t = t;
          result = "top";
        }
        t = (qy2 - py) / dy; // bottom edge
        x = px + t * dx;
        if (t >= 0 && t < min_t && x < qx2 && qx < x + this.w) {
          min_t = t;
          result = "bottom";
        }
      }
      if (dx != 0) {
        let t, y;
        t = (qx - px2) / dx; // left edge
        y = py + t * dy;
        if (t >= 0 && t < min_t && y < qy2 && qy < y + this.h) {
          min_t = t;
          result = "left";
        }
        t = (qx2 - px) / dx; // right edge
        y = py + t * dy;
        if (t >= 0 && t < min_t && y < qy2 && qy < y + this.h) {
          min_t = t;
          result = "right";
        }
      }
    }
    this.x = px + min_t * dx;
    this.y = py + min_t * dy;
    this.dx = dx;
    this.dy = dy;
    return [result, min_t]
  }
}

class Player extends SolidRect {
  constructor(x, y, w, h, c, e, id, hit_list) {
    super(x, y, w, h, c, hit_list);
    this.energy = e;
    this.id = id;
  }
  static from_obj(o) {
    return new Player(o.x, o.y, o.w, o.h, o.color, o.energy, o.id);
  }

  show() {
    let wob = sin(Date.now() * 0.01) * 2;
    noStroke();
    fill(this.color);
    rect(this.x - wob, this.y + wob, this.w + 2 * wob, this.h - 2 * wob, 8, 8);
    noFill(); strokeWeight(3.0);
    let c = "#0f08";
    if (this.energy < 67) c = "#ff08";
    if (this.energy < 25) c = "#f008";
    stroke(c);
    const r = this.energy * TAU / 100;
    if (r > 0) arc(this.x + this.w / 2, this.y + this.h / 2, this.w * 2, this.h * 2, 1.5 * PI, 1.5 * PI + r);
  }
}

class Bullet extends Rect {
  constructor (x, y, vx, vy, author) {
    if (vx != 0) {
      super(x, y, 30, 10)
    } else if (vy != 0) {
      super(x, y, 10, 30)
    }
    this.author = author;
    this.color = '#e22';
    this.vx = vx;
    this.vy = vy;
  }
  static from_obj(o) {
    const b = new Bullet(o.x, o.y, o.vx, o.vy, o.author);
    b.x0 = o.x0;
    b.y0 = o.y0;
    b.spawn_time = o.spawn_time;
    b.color = o.color;
    return b;
  }
  update() {
    const age = world.now() - this.spawn_time;
    this.x = this.x0 + this.vx * age;
    this.y = this.y0 + this.vy * age;
  }
  show() {
    noStroke();
    fill(this.color);
    rect(this.x, this.y, this.w, this.h, 5, 5);
  }
}
