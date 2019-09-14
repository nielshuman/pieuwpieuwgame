const particles = [];

// call to create particle explosion
// tip: call multiple times with differnt colours
function particle_fx(N, x0, y0, c, t=100, j=0.1, dx=0, dy=0, r=0.02) {
  for (let i = 0; i < N; i++) {
    particles.push(new Particle(x0, y0, c, t, j, dx, dy, r));
  }
}

function fx_explosion(x0, y0) {
  particle_fx(20, x0, y0, "#000", 80);
  particle_fx(20, x0, y0, "#f00", 60);
  particle_fx(20, x0, y0, "#f0f", 45);
  particle_fx(20, x0, y0, "#fff", 30);
}

function fx_big_explosion(x0, y0) {
  particle_fx(20, x0, y0, "#000", 120);
  particle_fx(20, x0, y0, "#f00", 80);
  particle_fx(20, x0, y0, "#f0f", 60);
  particle_fx(20, x0, y0, "#fff", 40);
}

function fx_shoot(x, y, dx, dy) {
  particle_fx(5, x, y, "#fff", 30, 0.1, dx * 0.2, dy * 0.2);
}

// call every frame
function do_particles(dt) {
  for (let p of particles) {
    p.update(dt);
    p.show();
  }
}

class Particle {
  constructor(x, y, c, t, j, dx, dy, r) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1) * j + dx;
    this.vy = random(-1, 1) * j + dy;
    this.timer = random(1, 2) * t * 5;
    this.c = c;
    this.r = r;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.timer -= dt;
    if (this.timer < 0) this.remove();
  }
  show() {
    noStroke(); fill(this.c);
    circle(this.x, this.y, this.timer * this.r);
  }
  remove() {
    particles.splice(particles.indexOf(this), 1);
  }
}
