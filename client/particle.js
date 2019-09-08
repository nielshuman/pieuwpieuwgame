const particles = [];

// call to create particle explosion
// tip: call multiple times with differnt colours
function particle_fx(x0, y0, a=100, N=20, c="#fff") {
  for (let i = 0; i < N; i++) {
    particles.push(new Particle(x0, y0, a, c));
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
  constructor(x, y, a, c="#fff") {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1) * 0.5 /5 ;
    this.vy = random(-1, 1) * 0.5 /5;
    this.timer = random(1, 2) * a * 5;
    this.c = c;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.timer -= dt;
    if (this.timer < 0) this.remove();
  }
  show() {
    noStroke(); fill(this.c);
    circle(this.x, this.y, this.timer * 0.1 /5);
  }
  remove() {
    particles.splice(particles.indexOf(this), 1);
  }
}
