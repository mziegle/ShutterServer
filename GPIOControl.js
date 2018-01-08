var Gpio = require('onoff').Gpio;

initialize = (shutters) => {

  for(var i = 0; i < shutters.length; i++) {

    // Initilize gpio up
    var gpioUp = shutters[i].gpioUp;
    console.log(gpioUp.number);
    gpioUp.gpioObject = new Gpio(gpioUp.number, 'out');

    // gpioUp.gpioObject.watch( (err, value) => {
    //    console.log("Ok something changed at gpio " + gpioUp.number + " the new value is " + value);
    // });

    // Initilize gpio down
    var gpioDown = shutters[i].gpioDown;
    console.log(gpioDown.number);
    gpioDown.gpioObject = new Gpio(gpioDown.number, 'out');

    // gpioDown.gpioObject.watch( (err, value) => {
    //   led.writeSync(value);
    // });

  }

}


shutdown = (shutters) => {
  for(var i = 0; i < shutters.length; i++) {
    shutters[i].gpioUp.gpioObject.unexport();
    shutters[i].gpioDown.gpioObject.unexport();
  }
}

stop = (shutter) => {
  shutter.gpioDown.gpioObject.writeSync(0);
  shutter.gpioUp.gpioObject.writeSync(0);
}

down = (shutter) => {
  shutter.gpioDown.gpioObject.writeSync(1);
  console.log(shutter.gpioDown.gpioObject.readSync());
}

up = (shutter) => {
  shutter.gpioUp.gpioObject.writeSync(1);
}

exports.up = up;
exports.down = down;
exports.stop = stop;
exports.initialize = initialize;
exports.shutdown = shutdown;