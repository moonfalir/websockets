var pc = new RTCPeerConnection ({
    "iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]
});
var videoAnswerSent = false;
var localstream;
var localVid = document.getElementById('local-video');
var remoteVid = document.getElementById('remote-video');
var localmutebtn = document.getElementById('mute-local');
var remotemutebtn = document.getElementById('mute-remote');

pc.onicecandidate = async function(event) {
    if (event.candidate)
        await ws.send(JSON.stringify({type: 'ice', id: id, candidate: event.candidate}))
}

pc.addEventListener('track', gotStream);

async function localVideo(strm) {
    document.getElementById("local-group").hidden = false
    localVid.srcObject = strm;
    localVid.muted = true;
    for (const track of strm.getTracks()) {
        pc.addTrack(track, strm);
    }
    var offer = await pc.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
    await pc.setLocalDescription(offer);
    await ws.send(JSON.stringify({type: 'ice', id: id, offer: offer}))
}

async function gotStream(event) {
    if (event.streams[0] !== remoteVid.srcObject){
        remoteVid.srcObject = event.streams[0];
        remoteVid.muted = true;
        document.getElementById("remote-group").hidden = false
        
        if (!videoAnswerSent) {
            //TODO catch errors
            navigator.mediaDevices.getUserMedia({audio: true, video: true}).then((strm) => {localVideo(strm)})
            var answer = await pc.createAnswer()
            await pc.setLocalDescription(answer);
            await ws.send(JSON.stringify({type: 'ice', id: id, offer: answer}))
            videoAnswerSent = true;
        }
    }
}

async function startStreaming() {
    //catch errors
    localstream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
    localVideo(localstream);
}

function stopStreaming() {
    localVid.srcObject = undefined;
    videoAnswerSent = false;
    remoteVid.srcObject = undefined;
    pc = undefined
    for (const track of localstream.getTracks()) {
        track.stop()
    }
}

function muteLocal() {
    var inverse = localVid.muted ? false : true
    localVid.muted = inverse;
    if (inverse) {
        localmutebtn.className = "btn btn-primary float-left w-100"
        localmutebtn.innerHTML = "Unmute"
    }
    else {
        localmutebtn.className = "btn float-left w-100 btn-outline-primary"
        localmutebtn.innerHTML = "Mute"
    }
}

function muteRemote() {
    var inverse = remoteVid.muted ? false : true
    remoteVid.muted = inverse;
    if (inverse) {
        remotemutebtn.className = "btn btn-primary float-left w-100"
        remotemutebtn.innerHTML = "Unmute"
    }
    else {
        remotemutebtn.className = "btn float-left w-100 btn-outline-primary"
        remotemutebtn.innerHTML = "Mute"
    }
}