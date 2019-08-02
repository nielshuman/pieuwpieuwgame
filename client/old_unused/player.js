const steering_force = 0.75;
const friction = 0.95;
const maximum_velocity = 7;

class Player {
  constructor(x, y, w, h, c) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;
    this.vx = 0;
    this.vy = 0;
    this.prev_x = this.x;    
    this.prev_y = this.y;    
  }

  show() {
    fill(this.c);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
  }

  collides(other) {
    return collideRectRect(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h);
  }

  up() {
    this.vy = constrain(this.vy - steering_force, -maximum_velocity, maximum_velocity);
  }

  down() {
    this.vy = constrain(this.vy + steering_force, -maximum_velocity, maximum_velocity);    
  }

  left() {
    this.vx = constrain(this.vx - steering_force, -maximum_velocity, maximum_velocity);
  }

  right() {
    this.vx = constrain(this.vx + steering_force, -maximum_velocity, maximum_velocity);    
  }

  slowDown() {
    this.vy *= friction;
    this.vx *= friction;
    if (abs(this.vy) < 0.001) {
      this.vy = 0;
    }
    if (abs(this.vx) < 0.001) {
      this.vx = 0;
    }
  }

  update() {
    this.prev_x = this.x;    
    this.prev_y = this.y;    
    this.x += this.vx;
    this.y += this.vy;
  }
}