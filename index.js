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
//initialize the WebSocket server instance
const webs = new WebSocket.Server({ server });
var clients =  new Array();
var count = 0;
var drawId = 1;
var wordToGuess = '';
var wordArray = new Array();
var hintsArray = new Array();
var timerId;
var counter = 0;
webs.on('connection', (ws, req) => {
    count++
    var id = count;
    clients.push({ sock: ws, id: id })
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        if (typeof message === 'string') {
            var detMsg = JSON.parse(message)
            if (detMsg.type === 'ice') {
                clients.find(client => client.id !== id).sock.send(message)
            }
            if (detMsg.type === 'chat') {
                clients.find(client => client.id !== id).sock.send(message)
                if (detMsg.msg !== undefined && detMsg.msg === wordToGuess) {
                    clearInterval(timerId);
                    sendScore(clients);
                    clients.forEach(e => {
                        e.sock.send(JSON.stringify({type: "chat", msg: wordToGuess + " was the correct guess!", name: "Game"}))
                    })
                    switchRoles(clients);
                    pauseGame(clients);
                }
            }
            if (detMsg.type == 'game') {
                if (detMsg.wordchoice !== undefined){
                    wordToGuess = detMsg.wordchoice
                    wordArray = wordToGuess.split("")
                    hintsArray = new Array(wordArray.length); 
                    for (var i = 0; i < hintsArray.length; i++)
                        hintsArray[i] = '_';
                    clients.find(client => client.id !== id).sock.send(JSON.stringify({type:'game', wordchoice: hintsArray}))
                    sendTimerInfo(clients);
                }
                else {
                    clients.find(client => client.id !== id).sock.send(message)
                }
            }
        }
        else {
            clients.find(client => client.sock !== ws).sock.send(message)
        }
    });

    ws.on('close', () => {
        console.log('closing')
        count--;
        var index = clients.findIndex(client => client.sock === ws);
        clients.splice(index, 1);
        id = count
        if (clients.length > 0) {
            clients[0].id = id;
            clients[0].sock.send(JSON.stringify({type:'game', start: false}))
            clients[0].sock.send(JSON.stringify({id: id}));
            sendDrawerGuesserInfo(clients[0].sock, drawId === count)
        }
    })
    //send immediatly a feedback to the incoming connection    
    ws.send(JSON.stringify({id: id})); 
    sendDrawerGuesserInfo(ws, drawId === count)

    if (count == 2) {
        sendStart();
    }
});

function sendStart() {
    clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", start: true}))
    })
}

function sendDrawerGuesserInfo(sock, isdrawing){
    sock.send(JSON.stringify({type: "game", drawing: isdrawing}))
}

function sendScore(clients) {
    var id = drawId === 1 ? 2 : 1;
    clients.forEach(e => {
        e.sock.send(JSON.stringify({type: "game", score: counter, id: id}))
    })
}

function sendTimerInfo(clients) {
    // repeat with the interval of 1 second
    counter = 121
    var seconds = ""
    clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", wordchosen: true}))
    })
    timerId = setInterval(() => {
        counter--
        if (counter === 80 || counter === 40)
            sendHint();
        if (((counter % 60) + "").length < 2)
            seconds = "0" + (counter % 60)
        else
            seconds = (counter % 60) + ""
        clients.forEach(cl => {
            cl.sock.send(JSON.stringify({type: "game", timer: Math.floor(counter / 60) + ":" + seconds}))
        })
    }, 1000);

    // after 120 seconds stop
    setTimeout(() => { clearInterval(timerId); pauseGame(clients)}, (counter + 1) * 1000);
}

function pauseGame(clients) {
    clients.forEach(cl => {
        cl.sock.send(JSON.stringify({type: "game", wordchosen: false}))
    })
}

function sendHint() {
    var index = Math.floor(Math.random() * hintsArray.length)
    while(hintsArray[index] !== '_')
        index = Math.floor(Math.random() * hintsArray.length)
    hintsArray[index] = wordArray[index]
    clients.find(client => client.id !== drawId).sock.send(JSON.stringify({type:'game', wordchoice: hintsArray}))
}

function switchRoles(clients) {
    drawId = drawId === 1 ? 2 : 1; 
    clients.forEach(cl => {
        sendDrawerGuesserInfo(cl.sock, cl.id === drawId);
    })
}

//start our server
server.listen(9007, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});