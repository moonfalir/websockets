var ws = new WebSocket('ws://' + window.location.hostname + ':9007')
ws.binaryType = 'arraybuffer';
var splitpath = window.location.pathname.split("/");
var id = -1;

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

function stopGame() {
    window.location.href = 'http://localhost:9007/';
}

function endGame() {
    if (parseInt(youscorefield.innerHTML) > parseInt(opponentscorefield.innerHTML))
        alert("You won with a score of " + youscorefield.innerHTML)
    else {
        if (parseInt(opponentscorefield.innerHTML) > parseInt(youscorefield.innerHTML))
            alert("You lost with a score of " + youscorefield.innerHTML)
        else
            alert("It's a draw with a score of " + youscorefield.innerHTML)
    }

    setTimeout(function() {
        window.location.href = window.location.host
    }, 5000)
}

function sendChoice() {
    var choice = wordchoice.value
    ws.send(JSON.stringify({type: 'game', wordchoice: choice}))
    wordchoice.value = ""
    setWordToDraw(choice);
}

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