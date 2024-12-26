p5.disableFriendlyErrors = true; // disables FES

const pre_names = ["super", "mad ", "mega", "ultra", "hyper", "power", "giga",
"insane ", "bad ", "zombie ", "robot ", "ninja ", "pirate ",
"screaming ", "angry ", "happy ", "danger "];

const names = ["pluisje", "vlekje", "kruimel", "poekie", "fluffie", "muffin",
"diesel", "spike", "simba", "lucky", "spoekie", "tijger", "snuf",
"woezel", "pip", "puck", "nugget"];

const post_names = ["the destroyer", "the great", "the fool", "the conqueror",
"of death", "doom", "the insane", "the indestructable", "the wicked",
"the brutal", "frost", "the foul", "the pirate"];

let username_box, messages_box;
let walls = [], player, ready, world, socket;
let W, H, W2, H2, fps = 0, screen_rect;
let time, show_debug_info = false;
let shootSounds, font;
let playerHitSounds, dedSound;
let log_level = 0;
let accuracy_multiplier = 10;

let touch_device = false;
let gui;
let shootButton, joyStick;

function touchStarted() {
  touch_device = true;
  fullscreen(true);
}

const log = (level, ...text) => { if (level <= log_level) console.log(`[${level}]`, ...text); }

function preload() {
  log(2, '=== PRELOAD ===');
  soundFormats('mp3');
  shootSounds = [];
  for (var i = 1; i <= 6; i++) shootSounds.push(loadSound(`assets/piew-0${i}.mp3`));
  playerHitSounds = [];
  for (var i = 1; i <= 8; i++) playerHitSounds.push(loadSound(`assets/playerhit-0${i}.mp3`));
  dedSound = loadSound('assets/ded.mp3', ()=>log(2, 'dedSound loaded'))
  // hitSound = loadSound('assets/hit.wav');
  // wallHitSound = loadSound('assets/hitwall.wav');
  font = loadFont('assets/gamer.ttf', ()=>log(2, 'font loaded'));
}

let canvasje;
let zoom = 1, vertical_view = 960;
function setup() {
  // frameRate(30);
  log(2, '=== SETUP ===');
  canvasje = createCanvas(windowWidth, windowHeight);
  zoom = windowHeight / vertical_view;
  canvasje.parent('#game_canvas')
  socket = io();
  socket.on('server_update', on_server_update);
  socket.on('server_welcome', on_server_welcome);
  socket.on('damage', on_damage);
  socket.emit('player_join');
  username_box = select("#username");
  username_box.value((random() < 0.5) ? random(names) + ' ' + random(post_names) : random(pre_names) + random(names));
  messages_box = select("#messages");
  masterVolume(0);
  window.focus();
  gui = createGui('Controls');
  shootButton = createButton('PIEUW!', 0, 0, 100, 50);
  soundToggle = createToggle('SOUND', 0, 0, 100, 25, false);
  soundToggle.onPress = () => toggleMute();
  shootButton.onPress = () => player.shoot(2.5);
  joyStick = createJoystick("Joystick", 0, 0, 125, 125, -1, 1, 1, -1);
}

function on_damage(amount, author) {
  player.energy = max(0, player.energy - amount);
  if (player.energy <= 0) {
    log(1, '=== DEAD ===')
    socket.emit('server_message', `${author.username} KILLED ${player.username}`);
    player.hit_list = [];
    dedSound.play();
  }
}

function on_server_welcome(p, w) {
  // start signal from server
  // bullets are not initialized so any bullets flying when the player joins
  // are not visible. but maybe hit the player?
  log(2, '=== SERVER_WELCOME ===');
  world = new World(w);
  time = world.now();
  player = Player.from_obj(p);
  player.hit_list = world.walls;
  player.color = p.color;
  ready = true;
}

function on_server_update(players, new_bullets, bullet_hits, items, new_messages) {
  if (!ready) return;
  // update the players except if it's the player then use the player with the energy update
  world.players = players.map(o => (o.id == player.id) ? player : Player.from_obj(o));
  for (let b of new_bullets) {
    if (b.author != player.id) world.bullets.push(Bullet.from_obj(b));
  }
  for (let bh of bullet_hits) {
    let b = bh.b, target = bh.target;
    for (let i = world.bullets.length - 1; i >= 0; i--) {
      if (world.bullets[i].id == b.id && b.author != player.id) {
        log(2, "bullet_hit_event", bullet_hits);
        world.bullets[i].hit_obj(target);
      }
    }
  }
  world.items = items.map(o => Item.from_obj(o));
  if (new_messages.length > 0) {
    messages_box.html(new_messages.join("<br />"));
    // for (let msg of new_messages) messages_box.innerHTML (msg);
    log(1, 'New message:', new_messages);
  }
}

let screenshake = 0, screen_shake_size = 4;
let next_update_time = 0;

function draw() {
  background(player && player.energy <= 0 ? "#311" : "#123");
  if (!ready) {return};

  let prev_time = time;
  time = world.now();
  dt = time - prev_time;

  // controls and movement
  let speed = 0.42 / accuracy_multiplier * dt;
  for (let i = 0; i < accuracy_multiplier; i++) { // super accurate physics time resolution
    if (!touch_device) {
      if (keyIsDown(87 /*W*/) || keyIsDown(UP_ARROW))    player.move(0, -speed);
      if (keyIsDown(83 /*S*/) || keyIsDown(DOWN_ARROW))  player.move(0, speed);
      if (keyIsDown(65 /*A*/) || keyIsDown(LEFT_ARROW))  player.move(-speed, 0);
      if (keyIsDown(68 /*D*/) || keyIsDown(RIGHT_ARROW)) player.move(speed, 0);
    }
    if (touch_device && (joyStick.valX || joyStick.valY)) player.move2(joyStick.valX * speed, joyStick.valY * speed);
    // player.move(0,0) // super raar
  }

  // rendering world
  push();
  scale(zoom);
  translate(width / 2 / zoom - player.mx, height / 2 / zoom - player.my);
  screen_rect = new Rect(player.mx - width / 2 / zoom, player.my - height / 2 / zoom, width / zoom, height / zoom);
  if (screenshake > 0) {
    screenshake--;
    translate(random(-1, 1) * screen_shake_size, random(-1, 1) * screen_shake_size);
  }
  for (let wall of world.walls) {
    if (wall.hit(screen_rect)) wall.show();
  }
  for (let p of world.players) {
    if (p.hit(screen_rect)) (p.id == player.id ? player : p).show();
  }
  for (let i = world.bullets.length - 1; i >= 0; i--) {
    const bullet = world.bullets[i];
    bullet.update();
    if (bullet.hit(screen_rect)) bullet.show();
  }
  for (let i = world.items.length - 1; i >= 0; i--) {
    const item = world.items[i];
    if (item.hit(screen_rect)) {
      item.show();
      if (player.hit(item)){
        player.useItem(item);
      }
    }
  }
  do_particles(dt);
  pop();

  if (time > next_update_time) {
    socket.emit('player_update', player);
    next_update_time = time + 100; // upadet every 100ms
  }
  if (player.itemExpirationTime != -1 && player.itemExpirationTime < time) player.clearEffects();

  if (frameCount % 20 == 0) fps = frameRate();
  if (player.energy > 0) player.energy = min(100, player.energy + 3 * dt / 1000);
  player.username = username_box.value().substring(0, 26).toUpperCase();
  

  joyStick.x = width - joyStick.w - 10;
  joyStick.y = height - joyStick.h - 60;
  shootButton.x = soundToggle.x
  shootButton.y = soundToggle.y - shootButton.h - 10
  soundToggle.x = 10;
  soundToggle.y = height - soundToggle.h - 60;
  if (touch_device) drawGui();
  
  if (!log_level) return;
  fill(255);
  stroke(0);
  text(`FPS: ${fps.toFixed(2)}`, 10, height - 10);
  text(`NOW: ${world.now()}`, 10, height - 30);
  text(`IET: ${player.itemExpirationTime}`, 10, height - 50)
  text(`LOG: ${log_level}`, 10, height - 70);


}

function toggleMute() {
  if (getMasterVolume() == 0) {
    masterVolume(1);
    log(1, 'Unmuted');
    soundToggle.val = true;
    return 1;
  } else {
    masterVolume(0);
    log(1, 'Muted');
    soundToggle.val = false;
    return 0;
  }
}

function keyPressed() {
  touch_device = false;
  if (key == 'm') {
    toggleMute();
  } else if (key == ' ' || key == 'j') {
      player.shoot(key == 'j'? 0 : 2.5) // "easter egg"
  } else if (key == 'x') {
      player.energy = max(0, player.energy - random(10,30));
  } else if (key == 'l') {
    log_level++;
    log_level %= 3;
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  zoom = windowHeight / vertical_view;
}
