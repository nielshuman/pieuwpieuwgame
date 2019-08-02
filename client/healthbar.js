class HealthBar() {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.col1 = '#23e';
    this.col2 = '#222';
    this.val = 0;
  }

  updateval(newval) {
    this.val = newval;
  }

  show() {
    nosStroke();
    fill(this.col2);
    rect(this.x, this.y, this.w, this.h); // background bar
    fill(this.col1);
    rect(this.x, this.y, map(this.val, 0, 100, 0, this.w), this.h)
  }
}