class Bullet extends Rect {
	constructor (x, y, vx, vy) {
		if (vx != 0) {
			super(x, y, 30, 10)
		} else if (vy != 0) {
			super(x, y, 10, 30)
		}
		this.vx = vx;
		this.vy = vy;
	}
	update() {
		this.x += this.vy;
		this.y += this.vy;
	}
}