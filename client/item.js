class Item extends Rect {
	constructor(x, y, type, c, duration=30000) {
		super(x, y, 16, 16, c ? c : random(['#66FF66', '#50BFE6', '#FD3A4A']));
		this.type = type;
		let c1 = color(c); c1.setAlpha(64);
		let c2 = color(c); c2.setAlpha(32);
		let c3 = color(c); c3.setAlpha(16);
		this.pal = [c, c1, c2, c3];
		this.random = random() * TAU;
		this.duration = duration;
	}

    show() {
	    push();
	    const w2 = this.w / 2, h2 = this.h / 2;
	    translate(this.x + w2 , this.y + h2);
		const wob = 1 + 0.2 * sin(world.now() * 0.01 + this.random);
	    const glow_radius = 0.4;
	    fill(this.pal[3]);
	    circle(0, 0, this.w * (wob + 3 * glow_radius));
	    fill(this.pal[2]);
	    circle(0, 0, this.w * (wob + 2 * glow_radius));
	    fill(this.pal[1]);
	    circle(0, 0, this.w * (wob + 1 * glow_radius));
	    fill(this.pal[0]);
	    circle(0, 0, this.w * (wob + 0 * glow_radius));
	    pop();
    }

    remove() {
    	world.items.splice(world.items.indexOf(this), 1);
    }
}