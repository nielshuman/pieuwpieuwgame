# p5 GAME DING
Coole game dinges met [p5.js](https://p5js.org/), [socket.io](http://socket.io/), [node.js](https://nodejs.org) enzo.

## Installen?????
1. Doe maar even de git clone of de download zip
2. Open terminal in de goede map
3. doe maar even `npm i`

## opties/voorbeeld dingetjes
Command: `node server`

| Flag                | Beschrijving                                                                         | Default |
| ------------------- | ------------------------------------------------------------------------------------ | ------- |
| `--help`            | Doet help                                                                            | false   |
| `-p`, `--port`      | De poort voor de game                                                                | 3000    |
| `-i`, `--interval`  | Interval in miliseconds of sending data (AAAaaaAAa tegenwoordig pls niet aanpassen)  | 100     |
| `-l`, `--log_level` | Amount of log, 4=everything, 3=normal, 2=only join/error/system, 1=only error/system | 3       |
| `--world-radius`    | Hoe groot wereld                                                                     | 1000    |