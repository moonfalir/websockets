var canvas = document.getElementById('canvas');
var context= canvas.getContext("2d");
var container = document.getElementById('canvas-container')
var isDrawing = false;
var gameStarted = false;
var wordchosen = false;
var isClicking = false;
var drawhistory = new Array();

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);
canvas.addEventListener("mousedown", (evt) => {startDraw(evt); });
canvas.addEventListener("mousemove", (evt) => {continueDraw(evt); });
canvas.addEventListener("mouseup", () => { stopDraw(); });

function resizeCanvas() {
        canvas.width = container.clientWidth;

        drawhistory.forEach(evt => {
            switch (evt.type) {
                case 'start':
                    context.beginPath();
                    context.moveTo(evt.coords.x, evt.coords.y);
                    break;
                case 'line':
                    context.lineTo(evt.coords.x, evt.coords.y);
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
resizeCanvas();

function startDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen)
        return;
    isClicking = true;
    context.beginPath();
    context.moveTo(evt.offsetX / canvas.innerWidth, evt.offsetY / canvas.innerHeight);
    drawhistory.push({type: 'start', coords:{x: evt.offsetX / canvas.innerWidth, y: evt.offsetY / canvas.innerHeight}})
    ws.send(new Int32Array([evt.offsetX, evt.offsetY]))
}

function continueDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen || !isClicking)
        return;
    context.lineTo(evt.offsetX / canvas.innerWidth, evt.offsetY / canvas.innerHeight);
    context.stroke();
    drawhistory.push({type: 'line', coords:{x: evt.offsetX / canvas.innerWidth, y: evt.offsetY / canvas.innerHeight}})
    ws.send(new Int32Array([evt.offsetX, evt.offsetY]))
}

function stopDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen)
        return;
    context.closePath();
    isClicking = false;
    drawhistory.push({type: 'stop', coords: {x:-1, y:-1}})
    ws.send(new Int32Array([-1, -1]))
}

function receivedCoords(data) {
    var coords = new Int32Array(data)
    if (coords[0] === -1 && coords[1] === -1) {
        isDrawing = false;
        context.closePath();
        drawhistory.push({type: 'stop', coords:{x: -1, y: -1}})
    }
    else {
        if (!isDrawing) {
            isDrawing = true;
            context.beginPath();
            context.moveTo(coords[0], coords[1]);
            drawhistory.push({type: 'start', coords:{x: coords[0], y: coords[1]}})
        }
        else {
            context.lineTo(coords[0], coords[1]);
            context.stroke();
            drawhistory.push({type: 'line', coords:{x: coords[0], y: coords[1]}})
        }
    }
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawhistory = new Array();
    if (isDrawing)
        ws.send(JSON.stringify({type: 'game', canvas: 'clear'}))
}