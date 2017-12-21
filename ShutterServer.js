const WebSocket = require('ws');
const datasource = require('./ShutterConfiguration');

const wsServer = new WebSocket.Server({ port: 3000 }, () => {console.log('WebSocket Server is listening on port 3000')});

const SECOND_IN_MILLIS = 1000;
const SHUTTER_UPDATE_INTERVAL_MILLIS = 500;
const TICK_OFFSET = 200;


wsServer.on('connection', function connection(socket) {

    socket.on('message', data => {

        const message = JSON.parse(data);

        switch (message.type) {

            case 'GET_SHUTTERS': {

                socket.send(JSON.stringify({type: 'SHUTTERS', data: datasource.getShutters()}));

                break;
            }
            case 'UP': {

                var shutterId = message.shutterId;
                var shutter = datasource.getShutterById(shutterId);
                moveShutterUp(SHUTTER_UPDATE_INTERVAL_MILLIS, shutter);

                break;

            } case 'DOWN': {

                var shutterId = message.shutterId;
                var shutter = datasource.getShutterById(shutterId);
                moveShutterDown(SHUTTER_UPDATE_INTERVAL_MILLIS, shutter);
            
                break;

            }

        }

    });

    moveShutterUp = (interval, shutter) => {

        clearInterval(shutter.currentInterval);
        clearTimeout(shutter.currentTimeout);
        
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
                clearInterval(shutter.currentInterval);
            },
            actualClosingDuration * SECOND_IN_MILLIS + TICK_OFFSET
        );       
        
    };

    moveShutterDown = (interval, shutter) => {


        clearInterval(shutter.currentInterval);
        clearTimeout(shutter.currentTimeout);

        var distance = 1 - shutter.closingState;
        var actualClosingDuration =  distance * shutter.closingDuration;
        var increment = distance / (actualClosingDuration / (interval / SECOND_IN_MILLIS));

        shutter.currentInterval = setInterval(() => {
                shutter.closingState = shutter.closingState + increment;
                sendShutterUpdate(shutter);
            }
            ,
            interval
        );

        shutter.currentTimeout = setTimeout(() => {
                clearInterval(shutter.currentInterval);
            },
            actualClosingDuration * SECOND_IN_MILLIS + TICK_OFFSET
        );  
    
    };

    sendShutterUpdate = (shutter) => {
        socket.send(JSON.stringify(
            { type: "UPDATE", data: {shutterId: shutter.id, progress: shutter.closingState}} )
        )
    }

});


/*

websocket = new WebSocket('ws://localhost:3000')

websocket.onmessage = (message) => console.log(message)

websocket.send(JSON.stringify({type: 'cntl'}))

*/