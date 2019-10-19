const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const path = require('path');

const app = express();

//initialize a simple http server
const server = http.createServer(app);

app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res) {
    res.sendFile(path.join(__dirname+'/public/index.html'));
});
app.post('/rooms',function(req,res) {
    var id = createRoom();
    res.redirect('/rooms/' + id);
});

app.get('/rooms', function(req, res) {
    res.send(getRooms());
})

app.get('/rooms/:id', function(req, res) {
    if (rooms[req.params.id].clients.length < 2)
        res.sendFile(path.join(__dirname+'/public/room.html'));
    else
        res.redirect('/');
})

var rooms = new Array();
//initialize the WebSocket server instance
const webs = new WebSocket.Server({ server });

//Create room for 2 players
function createRoom() {
    var room = {
        clients: new Array(),
        counter: 0,
        drawId: '',
        wordToGuess: '',
        wordArray: new Array(),
        hintsArray: new Array(),
        timerId: undefined,
        round: 1
    }

    var id = rooms.push(room) - 1;
    return id;
}

//Get list of rooms
function getRooms() {
    var room_info = new Array();
    rooms.forEach(function(room, index) {
        room_info.push({id: index, players: room.clients.length})
    })
    return room_info;
}

webs.on('connection', (ws, req) => {
    
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        var conn_info = req.connection.remoteAddress + "_" + req.connection.remotePort;
        var roomindex = findRoomIndex(conn_info)
        var room = rooms[roomindex];
        if (typeof message === 'string') {
            var detMsg = JSON.parse(message)
            if (detMsg.type === 'ice') {
                room.clients.find(client => client.conn_info !== conn_info).sock.send(message)
            }
            if (detMsg.type === 'chat') {
                room.clients.find(client => client.conn_info !== conn_info).sock.send(message)
                //Check if answer is correct
                if (detMsg.msg !== undefined && detMsg.msg === room.wordToGuess) {
                    clearInterval(room.timerId);
                    sendScore(room);
                    room.clients.forEach(e => {
                        e.sock.send(JSON.stringify({type: "chat", msg: room.wordToGuess + " was the correct guess!", name: "Game"}))
                    })
                    switchRoles(room);
                    pauseGame(room.clients);
                }
            }
            if (detMsg.type == 'game') {
                //Set word that will be drawn and start round
                if (detMsg.wordchoice !== undefined){
                    room.wordToGuess = detMsg.wordchoice
                    room.wordArray = room.wordToGuess.split("")
                    room.hintsArray = new Array(room.wordArray.length); 
                    for (var i = 0; i < room.hintsArray.length; i++)
                        room.hintsArray[i] = '_';
                    room.clients.find(client => client.conn_info !== conn_info).sock.send(JSON.stringify({type:'game', wordchoice: room.hintsArray}))
                    sendTimerInfo(room);
                }
                else {
                    room.clients.find(client => client.conn_info !== conn_info).sock.send(message)
                }
            }
            if (detMsg.type == 'room') {
                //Add client to room
                if (detMsg.action !== undefined && detMsg.action === 'join') {
                    rooms[detMsg.roomnr].clients.push({conn_info: req.connection.remoteAddress + "_" + req.connection.remotePort, sock: ws})
                    var id = rooms[detMsg.roomnr].clients.length;
                    ws.send(JSON.stringify({id: id})); 

                    if (rooms[detMsg.roomnr].clients.length == 1)
                        rooms[detMsg.roomnr].drawId = conn_info
                    sendDrawerGuesserInfo(ws, rooms[detMsg.roomnr].drawId === conn_info)
                    if (rooms[detMsg.roomnr].clients.length == 2) {
                        sendStart(detMsg.roomnr);
                    }
                }
            }
        }
        else {
            room.clients.find(client => client.sock !== ws).sock.send(message)
        }
    });

    ws.on('close', () => {
        const index = findRoomIndex(req.connection.remoteAddress + "_" + req.connection.remotePort);
        //if there is other user in room
        if (index > -1 && rooms[index].clients.length > 1) {
            if (rooms[index].timerId !== undefined)
                clearInterval(rooms[index].timerId);
            var clientindex = rooms[index].clients.findIndex(client => client.sock === ws);
            rooms[index].clients.splice(clientindex, 1);
            rooms[index].clients[0].sock.close()
        }
        //Remove room
        if (index > -1)
            rooms.splice(index, 1);
    })
});

//Find room where client is in
function findRoomIndex(client_conn_info) {
    return rooms.findIndex(room => room.clients.findIndex(client => client.conn_info === client_conn_info) > -1);
}

//Send round information
function sendRoundInfo(room) {
    room.clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", round: room.round}))
    })
}

//Start a game
function sendStart(roomnr) {
    const room = rooms[roomnr];
    sendRoundInfo(room);
    room.clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", start: true}))
    })
}

//Send role to client
function sendDrawerGuesserInfo(sock, isdrawing){
    sock.send(JSON.stringify({type: "game", drawing: isdrawing}))
}

//Send gained score to clients
function sendScore(room) {
    var id = room.drawId === room.clients[0].conn_info ? 2 : 1;
    room.clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", score: room.counter, id: id}))
    })
}

//Send timer information to clients
function sendTimerInfo(room) {
    room.counter = 121
    var seconds = ""
    room.clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", wordchosen: true}))
    })
    //At half time remaining, start sending hints till 50% of letters are given
    var halftime = Math.floor(room.counter / 2);
    var hintinterval = Math.floor(halftime  / Math.floor(room.hintsArray.length / 2))
    room.timerId = setInterval(() => {
        room.counter--
        //Send a new letter every interval
        if (room.counter <= halftime && room.counter > 0 && (room.counter % hintinterval) === 0)
            sendHint(room);
        if (((room.counter % 60) + "").length < 2)
            seconds = "0" + (room.counter % 60)
        else
            seconds = (room.counter % 60) + ""
        room.clients.forEach(cl => {
            cl.sock.send(JSON.stringify({type: "game", timer: Math.floor(room.counter / 60) + ":" + seconds}))
        })
    }, 1000);

    // after timer expires stop round
    setTimeout(() => { 
        clearInterval(room.timerId);
        if (room.clients.length > 2) {
            room.clients.forEach(e => {
                e.sock.send(JSON.stringify({type: "chat", msg: room.wordToGuess + " was the word to guess!", name: "Game"}))
            })
            switchRoles(room);
            pauseGame(room.clients);
        }
    }, (room.counter + 1) * 1000);
}

// pause game to wait for a new word to be drawn
function pauseGame(clients) {
    clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", wordchosen: false}))
    })
}

//Send a hint to the guesser
function sendHint(room) {
    //Select a letter that hasn't been picked yet
    var index = Math.floor(Math.random() * room.hintsArray.length)
    while(room.hintsArray[index] !== '_')
        index = Math.floor(Math.random() * room.hintsArray.length)
    room.hintsArray[index] = room.wordArray[index]
    room.clients.find(client => client.conn_info !== room.drawId).sock.send(JSON.stringify({type:'game', wordchoice: room.hintsArray}))
}

//Switch roles of clients
function switchRoles(room) {
    if (room.drawId === room.clients[0].conn_info)
        room.drawId = room.clients[1].conn_info 
    else {
        room.drawId = room.clients[0].conn_info;
        //player1's turn again, increase round
        room.round += 1;
        //stop when 5 rounds are done
        if (room.round < 6)
            sendRoundInfo(room);
        else
            sendEndGame(room);
    }
    room.clients.forEach(cl => {
        sendDrawerGuesserInfo(cl.sock, cl.conn_info === room.drawId);
    })
}

//End current game
function sendEndGame(room) {
    room.clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", start: false}))
    })
}

//start server
server.listen(9007, () => {
    console.log(`Server started on port ${server.address().port}`);
});