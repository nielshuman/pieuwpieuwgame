let walls = [], player, ready, world, socket;
let W, H, W2, H2, fps = 0;


function preload() {
  soundFormats('wav');
  shootSound = loadSound('assets/shoot.wav');
  hitSound = loadSound('assets/hit.wav');
  wallHitSound = loadSound('assets/hitwall.wav');
}

function setup() {
  frameRate(10);
  createCanvas(windowWidth, windowHeight);
  W = width; H = height; W2 = W / 2; H2 = H / 2;
  socket = io();
  socket.on('server_update', on_server_update);
  socket.on('server_welcome', on_server_welcome);
  socket.emit('player_join');
}

function on_server_welcome(p, w) {
  // start signal from server
  w.start_time + p.join_time

  world = new World(w);

  player = SolidRect.from_obj(p);
  player.hit_list = world.walls;
  player.color = p.color;
  ready = true;
  hbar = new Bar(width -220, height - 50, 200, 30)
}

function on_server_update(players, bullets) {
  world.players = players;
  world.bullets = bullets;
  socket.emit('player_update', player)
}

function draw() {
  background("#214");
  if (!ready) {return};
  // controls and movement
  let speed = 7;
  if (keyIsDown(UP_ARROW)) {player.move(0, -speed); player.dir = 'up';}
  if (keyIsDown(DOWN_ARROW)) {player.move(0, speed); player.dir = 'down';}
  if (keyIsDown(LEFT_ARROW)) {player.move(-speed, 0); player.dir = 'left';}
  if (keyIsDown(RIGHT_ARROW)) {player.move(speed, 0); player.dir = 'right';}

  // rendering world
  push();
  translate(W2 - player.x - player.w / 2, H2 - player.y - player.h / 2);
  for (let wall of world.walls) wall.show();

  // rendering players
  world.showBullets();
  player.show();
  world.showPlayers();
  pop();

  hbar.updateval(frameCount / 10);
  hbar.show();
  // Draw FPS (rounded to 2 decimal places) at the bottom left of the screen
  if (frameCount % 50 == 0) fps = frameRate();
  fill(255);
  stroke(0);
  text("FPS: " + fps.toFixed(2), 10, height - 10);
}

function keyPressed() {
  if (key == 'r') {
    socket.emit('player_reset')
    console.log("---------RESET--------");
  } else if (key == 'q') {
    console.log("---------EXIT--------");
    noLoop();
  } else if (key == 'm') {
    if (getMasterVolume() == 0) {
      masterVolume(1);
      console.log('Unmuted');
    } else {
      masterVolume(0);
      console.log('Muted')
    }
  } else if (key == ' ') {
    let vx = 0, vy = 0, x, y;
      switch (player.dir) {
        case 'up':
          x = player.x + (player.w / 2) -5;
          y = player.y;
          vy = - 1;
          break;
        case 'down':
          x = player.x + (player.w / 2) -5;
          y = (player.y + player.h) - 10;
          vy = 1;
          break;
        case 'left':
          x = player.x;
          y = player.y + (player.h / 2) -5;
          vx = -1;
          break;
        case 'right':
          x = (player.x + player.w) - 10;
          y = player.y + (player.h / 2) -5;
          vx = 1;
          break;
    }
    socket.emit('bullet', x, y, vx, vy);
    shootSound.play();
  }
}
