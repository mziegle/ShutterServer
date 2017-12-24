var Gpio = require('onoff').Gpio,

initialize = (shutters) => {

  for(var i = 0; i<shutters.length; i++) {

    // Initilize gpio up
    var gpioUp = shutters[i].gpioUp;
    gpioUp.gpioObject = new Gpio(gpioUp.number, 'both'),
    gpioUp.gpioObject.watch( (err, value) => {
      led.writeSync(value);
    });

    // Initilize gpio down
    var gpioDown = shutters[i].gpioDown;
    gpioDown.gpioObject = new Gpio(gpioDown.number, 'both'),
    gpioDown.gpioObject.watch( (err, value) => {
      led.writeSync(value);
    });

  }

}

stop = (shutter) => {
  shutter.gpioDown.writeSync(0);
  shutter.gpioUp.writeSync(0);
}

down = (shutter) => {
  shutter.gpioDown.writeSync(1);
}

up = (shutter) => {
  shutter.gpioUp.writeSync(1);
}

exports.up = up;
exports.down = down;
exports.stop = stop;
exports.initialize = initialize;