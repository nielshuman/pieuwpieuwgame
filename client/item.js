class Item extends Rect {
	constructor(x, y, type, color) {
		super(x, y, 16, 16, (color) ? color : random(['#66FF66', '#50BFE6', '#FD3A4A']));
		this.type = type;
	}

	// #ikwilgraageengloweffect (https://www.openprocessing.org/sketch/138189/)
}