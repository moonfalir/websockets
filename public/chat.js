var input = document.getElementById("inputmsg")
var wordchoice = document.getElementById("drawchoice")
var msgcontainer = document.getElementById("messages")
var sendbtn = document.getElementById("sendbtn")
var confirmbtn = document.getElementById("confirmchoice")
var timer = document.getElementById("timer")
var youscore = 0;
var opponentscore = 0;
var youscorefield = document.getElementById("you-score");
var opponentscorefield = document.getElementById("opponent-score");

input.onkeyup = function (evt) {
    if (input.value.length > 0)
        sendbtn.disabled = false
    else
        sendbtn.disabled = true
}

wordchoice.onkeyup = function (evt) {
    if (wordchoice.value.length > 0)
        confirmbtn.disabled = false
    else
        confirmbtn.disabled = true
}

function sendMsg(){ 
    ws.send(JSON.stringify({type: 'chat', msg: input.value, name: "Player" + id}))
    var newmsg = document.createElement("p")
    newmsg.className = "border mb-0 bg-secondary"
    newmsg.innerHTML = "Player" + id + ": " + input.value;
    msgcontainer.append(newmsg)
    input.value = "";
    sendbtn.disabled = true
    msgcontainer.scrollTop = msgcontainer.scrollHeight;
}

function receivedMsg(text) {
    var newmsg = document.createElement("p")
    newmsg.className = "border mb-0 bg-secondary"
    newmsg.innerHTML = text;
    msgcontainer.append(newmsg)
    msgcontainer.scrollTop = msgcontainer.scrollHeight;
}

function setScore(idplayer, score) {
    if (idplayer === id) {
        youscore += score;
        youscorefield.innerHTML = "You: " + (youscore);
    }
    else {
        opponentscore += score;
        opponentscorefield.innerHTML = "Opponent: " + (opponentscore);
    }
}