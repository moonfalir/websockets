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
var msginputcontainer = document.getElementById("msginputcont")

input.onkeyup = function (evt) {
    if (input.value.length > 0) {
        sendbtn.disabled = false
        if (evt.keyCode === 13) {
            sendbtn.click();
        }
    }
    else
        sendbtn.disabled = true
}

wordchoice.onkeyup = function (evt) {
    if (wordchoice.value.length > 0) {
        confirmbtn.disabled = false
        if (evt.keyCode === 13) {
            confirmbtn.click();
        }
    }
    else
        confirmbtn.disabled = true
}

function sendMsg(){ 
    ws.send(JSON.stringify({type: 'chat', msg: input.value, name: "Player" + id}))
    var newmsg = document.createElement("p")
    newmsg.className = "border mb-0 text-secondary"
    newmsg.innerHTML = "Player" + id + ": " + input.value;
    msgcontainer.append(newmsg)
    input.value = "";
    sendbtn.disabled = true
    msgcontainer.scrollTop = msgcontainer.scrollHeight;
}

function receivedMsg(sender, msg) {
    var newmsg = document.createElement("p")
    var msgcolor = ''

    if (sender.includes("Player"))
        msgcolor = 'text-primary'
    else
        msgcolor ='text-info'

    newmsg.className = "border mb-0 " + msgcolor
    newmsg.innerHTML = sender + ": " + msg;
    msgcontainer.append(newmsg)
    msgcontainer.scrollTop = msgcontainer.scrollHeight;
}

function setScore(idplayer, score) {
    if (idplayer === id) {
        youscore += score;
        youscorefield.innerHTML = youscore;
    }
    else {
        opponentscore += score;
        opponentscorefield.innerHTML = opponentscore;
    }
}

function resizeChat() {
    var height = msgcontainer.parentElement.clientHeight - msginputcontainer.clientHeight - 8
    msgcontainer.style = "height: " + height + "; overflow: scroll;";
}