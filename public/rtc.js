var pc = new RTCPeerConnection ({
    "iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]
});
var videoAnswerSent = false;

pc.onicecandidate = async function(event) {
    if (event.candidate)
        await ws.send(JSON.stringify({type: 'ice', id: id, candidate: event.candidate}))
}

pc.addEventListener('track', gotStream);

async function localVideo(strm) {
    var vidElement = document.getElementById('local-video');
    vidElement.srcObject = strm;
    vidElement.muted = true;
    for (const track of strm.getTracks()) {
        pc.addTrack(track, strm);
    }
    var offer = await pc.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
    await pc.setLocalDescription(offer);
    await ws.send(JSON.stringify({type: 'ice', id: id, offer: offer}))
}

async function gotStream(event) {
    var vidElement = document.getElementById('remote-video');
    if (event.streams[0] !== vidElement.srcObject){
        vidElement.srcObject = event.streams[0];
        vidElement.muted = true;
        
        if (!videoAnswerSent) {
            navigator.mediaDevices.getUserMedia({audio: true, video: true}).then((strm) => {localVideo(strm)})
            var answer = await pc.createAnswer()
            await pc.setLocalDescription(answer);
            await ws.send(JSON.stringify({type: 'ice', id: id, offer: answer}))
            videoAnswerSent = true;
        }
    }
}

function startStreaming() {
    navigator.mediaDevices.getUserMedia({audio: true, video: true}).then((strm) => {localVideo(strm)})
}