class Button {
	constructor(x, y, r, image) {
		this.image = image;
		this.x = x;
		this.y = y;
		this.r = r;
	}

	show() {
		fill('#aaaa')
		circle(this.x, this.y, this.r*2);
		tint(255, 180);
		if (this.image) image(this.image, this.x - this.r, this.y - this.r,this.r * 2, this.r * 2)
	}

	click() {
		let dx = this.x - mouseX;
		let dy = this.y - mouseY;
		if (dx ** 2 + dy ** 2 < this.r ** 2) player.shoot();
	}
}