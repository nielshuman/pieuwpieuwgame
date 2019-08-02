let hw, hh, ready;
let socket;
let world, me;

function update(w) {
  world.players = w.players;
  world.walls = w.walls;
}

function start(p) {
  me = new Player(p.x, p.y, p.w, p.h, p.c);
  ready = true;
  loop();
}

function setup() {
  socket = io();
  socket.on('update', update);
  socket.on('start', start);
  createCanvas(windowWidth, windowHeight);
  hw = width/2;
  hh = height/2;
  world = new World();
  socket.emit('ready');
  noLoop();
}

function draw() {
  background(0);
  // translate(0, 0);
  if (!ready) {return};
  let r = 0;
  if (keyIsDown(UP_ARROW) || keyIsDown(87)){ // 87 = w
    me.up();
  } 
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // 83 == s
    me.down();
  } 
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 65 = a
    me.left();
  } 
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 68 = d
    me.right();
  } 
  
  me.slowDown();
  // todo: betere manier vinden voor: (if, if, if, if) else

  for (let wall of world.walls) {
    if (me.collides(wall)) {      
      wall.c = 'red';
      me.x = me.prev_x;
      me.y = me.prev_y;
      me.vx = 0;
      me.vy = 0;
    }
  }

  me.show();
  me.update();
  world.drawWalls();
  world.drawPlayers();
  socket.emit('update', {x: me.x, y: me.y});

}
