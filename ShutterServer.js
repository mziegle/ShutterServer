const WebSocket = require('ws');
const datasource = require('./ShutterConfiguration');
const GPIOCntl = require('./GPIOControl');

GPIOCntl.initialize(datasource.getShutters());

const wsServer = new WebSocket.Server({ port: 3000 }, () => {console.log('WebSocket Server is listening on port 3000')});

const SECOND_IN_MILLIS = 1000;
const SHUTTER_UPDATE_INTERVAL_MILLIS = 500;
const TICK_OFFSET = 200;

wsServer.on('connection', function connection(socket) {

    socket.on('message', data => {

        const message = JSON.parse(data);

        switch (message.type) {

            case 'GET_SHUTTERS': {

                socket.send(JSON.stringify({type: 'SHUTTERS', data: datasource.getShutterTransferObjects()}));

                break;
            }
            case 'UP': {

                var shutterId = message.shutterId;
                var shutter = datasource.getShutterById(shutterId);
                if(shutter.state === 'idle'){
                    moveShutterUp(SHUTTER_UPDATE_INTERVAL_MILLIS, shutter);
                } else if (shutter.state == 'down') {
                    stopShutter(shutter);
                    moveShutterUp(SHUTTER_UPDATE_INTERVAL_MILLIS, shutter);
                } else if (shutter.state === 'up') {
                    stopShutter(shutter);
                } else {
                    console.log("Illegal shutter state");
                }

                break;

            } case 'DOWN': {

                var shutterId = message.shutterId;
                var shutter = datasource.getShutterById(shutterId);

                if(shutter.state === 'idle'){
                    moveShutterDown(SHUTTER_UPDATE_INTERVAL_MILLIS, shutter);
                } else if (shutter.state == 'up'){
                    stopShutter(shutter);
                    moveShutterDown(SHUTTER_UPDATE_INTERVAL_MILLIS, shutter);
                } else if (shutter.state === 'down') {
                    stopShutter(shutter);
                } else {
                    console.log("Illegal shutter state");
                }

                break;

            }

        }

    });

    socket.onerror = (error) => {
        console.log("An Error occured! \n I need to make sure that the shutters stop running");
        stopShuttersIfNoOneIsConnected();
    };

    /*
    socket.on('close', (code, reason) => {
        console.log("Connnection has been closed. I'm stopping all actions if nobody is there anymore");
        stopShuttersIfNoOneIsConnected();
    });
    */

    stopShuttersIfNoOneIsConnected = () => {

        console.log("I'm checking now, if someone else is still connected");
        var noOneConnected = true;

        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                noOneConnected = false;
            }
        });

        if(noOneConnected){
            console.log("Ok, no one is connected anymore. Now we stop all running shutters");
            datasource.applyOnEveryShutter(stopShutter);
        } else {
            console.log("Oh, there is still somebody. I keep the shutters running");
        }

    }

    moveShutterUp = (interval, shutter) => {
        
        shutter.state = 'up';
        GPIOCntl.up(shutter);

        var distance = shutter.closingState;
        var actualClosingDuration =  distance * shutter.closingDuration;
        var increment = distance / (actualClosingDuration / (interval / SECOND_IN_MILLIS));

        shutter.currentInterval = setInterval(() => {
                shutter.closingState = shutter.closingState - increment;
                sendShutterUpdate(shutter);
            }
            ,
            interval
        );

        shutter.currentTimeout = setTimeout(() => {
                stopShutter(shutter);
            },
            actualClosingDuration * SECOND_IN_MILLIS + TICK_OFFSET
        );       
        
    };

    moveShutterDown = (interval, shutter) => {

        shutter.state = 'down';
        GPIOCntl.down(shutter);

        var distance = 1 - shutter.closingState;
        var actualClosingDuration =  distance * shutter.closingDuration;
        var increment = distance / (actualClosingDuration / (interval / SECOND_IN_MILLIS));

        shutter.currentInterval = setInterval(() => {
                shutter.closingState = shutter.closingState + increment;
                sendShutterUpdate(shutter);
            },
            interval
        );

        shutter.currentTimeout = setTimeout(() => {
                stopShutter(shutter);
            },
            actualClosingDuration * SECOND_IN_MILLIS + TICK_OFFSET
        );
    
    };

    sendShutterUpdate = (shutter) => {
        wsServer.clients.forEach((client) => {

            if (client.readyState === WebSocket.OPEN) {

                client.send(JSON.stringify(
                    {type: "UPDATE", data: {shutterId: shutter.id, progress: shutter.closingState}}),
                    (error) => {
                        if (typeof error !== "undefined") {
                            console.log("Lost Connection while sending update");
                            console.log(error);
                            stopShutter(shutter);
                        }
                    }
                )

            }
          }
        );
    }

    resetInterval = (shutter) => {
        if(shutter.currentInterval != null) {
            console.log("Oh shutter " + shutter.id + " is running. We stop its interval now!");
            clearInterval(shutter.currentInterval);
            shutter.currentInterval = null;
        }
    }

    resetTimeout = (shutter) => {
        if(shutter.currentTimeout != null) {
            console.log("Oh shutter " + shutter.id + " is running. We stop its timeout now!");
            clearTimeout(shutter.currentTimeout);
            shutter.currentTimeout = null;
        }
    }

    stopShutter = (shutter) => {
        resetInterval(shutter);
        resetTimeout(shutter);
        shutter.state = 'idle';
        GPIOCntl.stop(shutter);
    }

});


/*

websocket = new WebSocket('ws://localhost:3000')

websocket.onmessage = (message) => console.log(message)

websocket.send(JSON.stringify({type: 'cntl'}))

*/