//Chat message field
var input = document.getElementById("inputmsg")
var sendbtn = document.getElementById("sendbtn")
//Word to draw input field
var wordchoice = document.getElementById("drawchoice")
var confirmbtn = document.getElementById("confirmchoice")
//Container for chat messages
var msgcontainer = document.getElementById("messages")
//timer field
var timer = document.getElementById("timer")
//
var youscore = 0;
var opponentscore = 0;
var youscorefield = document.getElementById("you-score");
var opponentscorefield = document.getElementById("opponent-score");
var msginputcontainer = document.getElementById("msginputcont")

input.onkeyup = function (evt) {
    //Keep send button disabled until there is atleast 1 letter
    if (input.value.length > 0) {
        sendbtn.disabled = false
        //On hitting enter, send message
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

//Send message to other client and display in message container
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
//display received message in container
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


//Increase the score of the guesser
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