var ws = new WebSocket('wss://' + window.location.hostname + ':8107')
ws.binaryType = 'arraybuffer';
var splitpath = window.location.pathname.split("/");
var id = -1;

//Send join message to server
ws.onopen = async function(msg) {
    ws.send(JSON.stringify({type: 'room', roomnr: splitpath[splitpath.length - 1], action: 'join'}))
}

ws.onclose = function(msg) {
    stopGame();
}

ws.onmessage = async function(msg) {
    if (typeof msg.data === 'string') {
        var data = JSON.parse(msg.data)
        if (data.type && data.type === 'ice') {
            if (data.candidate)
                await pc.addIceCandidate(data.candidate)
            if (data.offer) {
                await pc.setRemoteDescription(data.offer);
            }
            return;
        }
        if (data.type && data.type === 'chat') {
            receivedMsg(data.name, data.msg)
            return;
        }
        if (data.type && data.type === 'game') {
            if (data.start !== undefined) {
                if (data.start)
                    startGame();
                else
                    endGame();
                return;
            }
            if (data.drawing !== undefined){
                isDrawing = data.drawing;
                return;
            }
            if (data.wordchoice !== undefined){
                var hint = data.wordchoice.join(' ')
                setWordToDraw(hint)
                return;
            }
            if (data.timer !== undefined) {
               timer.innerHTML = data.timer
               return;
            }
            if (data.wordchosen !== undefined) {
                configGameWordChosen(data.wordchosen);
                return;
            }
            if (data.score !== undefined) {
                setScore(data.id, data.score);
                return;
            }
            if (data.canvas !== undefined) {
                if (data.canvas === 'clear')
                    clearCanvas();
                return;
            }
            if (data.round !== undefined) {
                document.getElementById("rounds").innerHTML = "Round: " + data.round + "/5"
            }
        }       
        if (data.id !== undefined) {
            id = data.id;
            document.getElementById("playername").innerHTML = "You're player" + id;  
        }
    }
    else
        receivedCoords(msg.data);
}

//prepare game, give control to users
function startGame() {
    document.getElementById("call-remote").disabled = false;
    gameStarted = true;
    document.getElementById("waiting-conn").hidden = true;
    timer.hidden = true;
    hints.hidden = true;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawhistory = new Array();
    if (isDrawing)
        document.getElementById("choose-draw").hidden = false;
    else
        document.getElementById("waiting-choice").hidden = false;

    setScore(1, 0);
    setScore(2, 0);
    youscorefield.hidden = false;
    opponentscorefield.hidden = false;
    input.disabled = false;
}

//If game ends, redirect to home page
function stopGame() {
    window.location.href = 'https://' + window.location.host;
}

//Ends game, shows winner/loser message
function endGame() {
    if (parseInt(youscorefield.innerHTML) > parseInt(opponentscorefield.innerHTML)) {
        var alertcont = document.createElement("div");
        alertcont.id = "alert";
        alertcont.className = "alert alert-success";
        var alertmsg = document.createElement("h3");
        alertmsg.innerHTML = "You won with a score of " + youscorefield.innerHTML;
        alertcont.appendChild(alertmsg);
        document.body.appendChild(alertcont);
    }
    else {
        if (parseInt(opponentscorefield.innerHTML) > parseInt(youscorefield.innerHTML)) {
            var alertcont = document.createElement("div");
            alertcont.id = "alert";
            alertcont.className = "alert alert-warning";
            var alertmsg = document.createElement("h3")
            alertmsg.innerHTML = "Your opponent won with a score of " + opponentscorefield.innerHTML
            alertcont.appendChild(alertmsg);
            document.body.appendChild(alertcont);
        }
        else{
            var alertcont = document.createElement("div");
            alertcont.id = "alert";
            alertcont.className = "alert alert-primary";
            var alertmsg = document.createElement("h3")
            alertmsg.innerHTML = "It's a draw with a score of " + opponentscorefield.innerHTML
            alertcont.appendChild(alertmsg);
            document.body.appendChild(alertcont);
        }
    }

    setTimeout(function() {
        stopGame();
    }, 5000)
}

//Send word that will be drawn
function sendChoice() {
    var choice = wordchoice.value
    ws.send(JSON.stringify({type: 'game', wordchoice: choice}))
    wordchoice.value = ""
    setWordToDraw(choice);
}

//Set word to draw, guesser only see underscores
function setWordToDraw(value) {
    document.getElementById("waiting-choice").hidden = true;
    document.getElementById("choose-draw").hidden = true;
    timer.hidden = false;
    timer.innerHTML = "0:00"
    var word = document.getElementById("hints");
    word.hidden = false;
    word.innerHTML = value;

    if (isDrawing)
        document.getElementById("clear-canvas").hidden = false
}

function configGameWordChosen(isChosen) {
    if (isChosen) {
        wordchosen = true
    }
    else {
        wordchosen = false;
        document.getElementById("clear-canvas").hidden = true
        startGame();
    }
}

function resize() {
    resizeCanvas();
    resizeChat();
}
window.addEventListener('resize', resize, false);
resize();