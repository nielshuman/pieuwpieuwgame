class Rect {
  constructor(x, y, w, h, c='#000') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = c;
    this.dir = 'right'
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
  constructor(x, y, w, h, hit_list) {
    super(x, y, w, h);
    this.hit_list = hit_list;
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
    return [result, min_t]
  }
  show() {
    let wob = sin(Date.now() * 0.01) * 2;
    noStroke();
    fill(this.color);
    rect(this.x - wob, this.y + wob, this.w + 2 * wob, this.h - 2 * wob, 8, 8);
  }  
}
