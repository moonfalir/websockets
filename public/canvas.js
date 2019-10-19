//Drawing canvas + context
var canvas = document.getElementById('canvas');
var context= canvas.getContext("2d");
var container = document.getElementById('canvas-container')
//conditions to allow drawing
var isDrawing = false;
var gameStarted = false;
var wordchosen = false;
var isClicking = false;
//history of draw actions
var drawhistory = new Array();
var titlebar = document.getElementById('titlebar')
var infobar = document.getElementById('infobar')

// events for drawing
canvas.addEventListener("mousedown", (evt) => {startDraw(evt); });
canvas.addEventListener("mousemove", (evt) => {continueDraw(evt); });
canvas.addEventListener("mouseup", () => { stopDraw(); });

//Resize draw canvas
function resizeCanvas() {
        canvas.width = container.clientWidth;
        //calculate available height
        var height = titlebar.parentElement.clientHeight - (titlebar.clientHeight + infobar.clientHeight + 5)
        canvas.height = height

        //Re-apply draw actions
        drawhistory.forEach(evt => {
            switch (evt.type) {
                case 'start':
                    context.beginPath();
                    context.moveTo(evt.coords.x * canvas.clientWidth, evt.coords.y * canvas.clientHeight);
                    break;
                case 'line':
                    context.lineTo(evt.coords.x * canvas.clientWidth, evt.coords.y * canvas.clientHeight);
                    context.stroke();
                    break;
                case 'stop':
                    context.closePath();
                    break;
                default:
                    break;
            }
        })
}

//Start drawing
function startDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen)
        return;
    isClicking = true;
    context.beginPath();
    //Use normalized coords for scaling
    var coords = {x: evt.offsetX / canvas.clientWidth, y: evt.offsetY / canvas.clientHeight}
    context.moveTo(coords.x * canvas.clientWidth, coords.y * canvas.clientHeight);
    drawhistory.push({type: 'start', coords: coords})
    ws.send(new Float32Array([coords.x, coords.y]))
}

//Continue drawing
function continueDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen || !isClicking)
        return;
    var coords = {x: evt.offsetX / canvas.clientWidth, y: evt.offsetY / canvas.clientHeight}
    context.lineTo(coords.x * canvas.clientWidth, coords.y * canvas.clientHeight);
    context.stroke();
    drawhistory.push({type: 'line', coords: coords})
    ws.send(new Float32Array([coords.x, coords.y]))
}

//End drawing
function stopDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen)
        return;
    context.closePath();
    isClicking = false;
    drawhistory.push({type: 'stop', coords: {x:-1, y:-1}})
    ws.send(new Float32Array([-1, -1]))
}

//Apply received coords to canvas
function receivedCoords(data) {
    var coords = new Float32Array(data)
    //End drawing
    if (coords[0] === -1 && coords[1] === -1) {
        isClicking = false;
        context.closePath();
        drawhistory.push({type: 'stop', coords:{x: -1, y: -1}})
    }
    else {
        //Start drawing
        if (!isClicking) {
            isClicking = true;
            context.beginPath();
            context.moveTo(coords[0] * canvas.clientWidth, coords[1] * canvas.clientHeight);
            drawhistory.push({type: 'start', coords:{x: coords[0], y: coords[1]}})
        }
        //Continue drawing
        else {
            context.lineTo(coords[0] * canvas.clientWidth, coords[1] * canvas.clientHeight);
            context.stroke();
            drawhistory.push({type: 'line', coords:{x: coords[0], y: coords[1]}})
        }
    }
}

//Clear canvas of drawings
function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawhistory = new Array();
    if (isDrawing)
        ws.send(JSON.stringify({type: 'game', canvas: 'clear'}))
}