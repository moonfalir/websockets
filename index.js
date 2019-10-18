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

function createRoom() {
    var room = {
        clients: new Array(),
        count: 0,
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
        if (index > -1) {
            if (rooms[index].timerId !== undefined)
                clearInterval(rooms[index].timerId);
            var clientindex = rooms[index].clients.findIndex(client => client.sock === ws);
            rooms[index].clients.splice(clientindex, 1);
            rooms[index].clients[0].sock.close()
            rooms.splice(index, 1);
        }
    })
});

function findRoomIndex(client_conn_info) {
    return rooms.findIndex(room => room.clients.findIndex(client => client.conn_info === client_conn_info) > -1);
}

function sendRoundInfo(room) {
    room.clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", round: room.round}))
    })
}

function sendStart(roomnr) {
    const room = rooms[roomnr];
    sendRoundInfo(room);
    room.clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", start: true}))
    })
}

function sendDrawerGuesserInfo(sock, isdrawing){
    sock.send(JSON.stringify({type: "game", drawing: isdrawing}))
}

function sendScore(room) {
    var id = room.drawId === room.clients[0].conn_info ? 2 : 1;
    room.clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", score: counter, id: id}))
    })
}

function sendTimerInfo(room) {
    // repeat with the interval of 1 second
    counter = 121
    var seconds = ""
    room.clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", wordchosen: true}))
    })
    room.timerId = setInterval(() => {
        counter--
        if (counter === 80 || counter === 40)
            sendHint(room);
        if (((counter % 60) + "").length < 2)
            seconds = "0" + (counter % 60)
        else
            seconds = (counter % 60) + ""
        room.clients.forEach(cl => {
            cl.sock.send(JSON.stringify({type: "game", timer: Math.floor(counter / 60) + ":" + seconds}))
        })
    }, 1000);

    // after 120 seconds stop
    setTimeout(() => { 
        clearInterval(room.timerId); 
        pauseGame(room.clients);
        room.clients.forEach(e => {
            e.sock.send(JSON.stringify({type: "chat", msg: room.wordToGuess + " was the word to guess!", name: "Game"}))
        })
        switchRoles(room);
    }, (counter + 1) * 1000);
}

function pauseGame(clients) {
    clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", wordchosen: false}))
    })
}

function sendHint(room) {
    //handle words with 2 characters | don't allow word with 1 letter
    var index = Math.floor(Math.random() * room.hintsArray.length)
    while(room.hintsArray[index] !== '_')
        index = Math.floor(Math.random() * room.hintsArray.length)
    room.hintsArray[index] = room.wordArray[index]
    room.clients.find(client => client.conn_info !== room.drawId).sock.send(JSON.stringify({type:'game', wordchoice: room.hintsArray}))
}

function switchRoles(room) {
    if (room.drawId === room.clients[0].conn_info)
        room.drawId = room.clients[1].conn_info 
    else {
        room.drawId = room.clients[0].conn_info;
        room.round += 1;
        if (room.round < 6)
            sendRoundInfo(room);
        else
            sendEndGame(room);
    }
    room.clients.forEach(cl => {
        sendDrawerGuesserInfo(cl.sock, cl.conn_info === room.drawId);
    })
}

function sendEndGame(room) {
    room.clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", start: false}))
    })
}

//start our server
server.listen(9007, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});