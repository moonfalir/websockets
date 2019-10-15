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
resizeCanvas();

function startDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen)
        return;
    isClicking = true;
    context.beginPath();
    var coords = {x: evt.offsetX / canvas.clientWidth, y: evt.offsetY / canvas.clientHeight}
    context.moveTo(coords.x * canvas.clientWidth, coords.y * canvas.clientHeight);
    drawhistory.push({type: 'start', coords: coords})
    ws.send(new Float32Array([coords.x, coords.y]))
}

function continueDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen || !isClicking)
        return;
    var coords = {x: evt.offsetX / canvas.clientWidth, y: evt.offsetY / canvas.clientHeight}
    context.lineTo(coords.x * canvas.clientWidth, coords.y * canvas.clientHeight);
    context.stroke();
    drawhistory.push({type: 'line', coords: coords})
    ws.send(new Float32Array([coords.x, coords.y]))
}

function stopDraw(evt) {
    if (!isDrawing || !gameStarted || !wordchosen)
        return;
    context.closePath();
    isClicking = false;
    drawhistory.push({type: 'stop', coords: {x:-1, y:-1}})
    ws.send(new Float32Array([-1, -1]))
}

function receivedCoords(data) {
    var coords = new Float32Array(data)
    if (coords[0] === -1 && coords[1] === -1) {
        isClicking = false;
        context.closePath();
        drawhistory.push({type: 'stop', coords:{x: -1, y: -1}})
    }
    else {
        if (!isClicking) {
            isClicking = true;
            context.beginPath();
            context.moveTo(coords[0] * canvas.clientWidth, coords[1] * canvas.clientHeight);
            drawhistory.push({type: 'start', coords:{x: coords[0], y: coords[1]}})
        }
        else {
            context.lineTo(coords[0] * canvas.clientWidth, coords[1] * canvas.clientHeight);
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