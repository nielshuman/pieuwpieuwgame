const particles = [];

function particle_fx(x0, y0, c="#fff") {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x0, y0, c));
    }

}

class Particle {
    constructor(x, y, c="#fff") {
        this.x = x;
        this.y = y;
        this.r = random(3, 8);
        this.vx = random(-15, 15);
        this.vy = random(-15, 15);
        this.age = 20;
        this.c = c;
    }
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        age -= dt;
        if (age < 0) this.remove();
    }
    show() {

    }
    remove() {

    }
}
