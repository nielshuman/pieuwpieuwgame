const particles = [];

// call to create particle explosion
// tip: call multiple times with differnt colours
function particle_fx(x0, y0, c="#fff") {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x0, y0, c));
  }
}

// call every frame
function do_particles(dt) {
  for (let p of particles) {
    p.update(dt);
    p.show();
  }
}

class Particle {
  constructor(x, y, c="#fff") {
    this.x = x;
    this.y = y;
    this.radius = random(3, 8);
    this.vx = random(-0.5, 0.5);
    this.vy = random(-0.5, 0.5);
    this.age = random(100, 200) ;
    this.c = c;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age -= dt;
    if (this.age < 0) this.remove();
  }
  show() {
    noStroke(); fill(this.c);
    circle(this.x, this.y, this.radius);
  }
  remove() {
    particles.splice(particles.indexOf(this), 1);
  }
}
