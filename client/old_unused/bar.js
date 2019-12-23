class Bar {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.col1 = color('#23e');
    this.col2 = color('#222');
    this.val = 0;
    this.oldval = 0;
    this.timer;
  }

  updateval(newval) {
    this.oldval = this.val;
    this.val = newval;
    this.timer = 0;
  }

  show(opacity=1) {
    this.timer = min(1, this.timer + 0.05);
    noStroke();
    fill(this.col2);
    rect(this.x, this.y, this.w, this.h); // background bar
    fill(this.col1);
    let a = lerp(this.oldval, this.val, this.timer)
    rect(this.x, this.y, map(a, 0, 100, 0, this.w), this.h)
  }
}