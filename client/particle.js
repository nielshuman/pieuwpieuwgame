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
  // remove dead particles
  particles = particles.filter(p => p.age >= 0);
}

class Particle {
  constructor(x, y, c="#fff") {
    this.x = x;
    this.y = y;
    this.radius = random(3, 8);
    this.vx = random(-15, 15);
    this.vy = random(-15, 15);
    this.age = random(20, 30);
    this.c = c;
  }
  update(dt) {
    if (this.age < 0) return;
    this.x += this.vx;
    this.y += this.vy;
    age -= dt;
  }
  show() {
    if (this.age < 0) return;
    noStroke(); fill(this.c);
    circle(this.x, this.y, this.radius);
  }
  remove() {

  }
}
