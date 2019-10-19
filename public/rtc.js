var pc = new RTCPeerConnection ({
    "iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]
});
var localstream;
var localVid = document.getElementById('local-video');
var remoteVid = document.getElementById('remote-video');
var remotemutebtn = document.getElementById('mute-remote');

pc.onicecandidate = async function(event) {
    if (event.candidate)
        await ws.send(JSON.stringify({type: 'ice', id: id, candidate: event.candidate}))
}

pc.addEventListener('track', gotStream);

//Display local stream and notify other client
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

//Display remote stream and send answer to other client
async function gotStream(event) {
    if (event.streams[0] !== remoteVid.srcObject){
        remoteVid.srcObject = event.streams[0];
        remoteVid.muted = true;
        document.getElementById("remote-group").hidden = false
        
        var answer = await pc.createAnswer()
        await pc.setLocalDescription(answer);
        await ws.send(JSON.stringify({type: 'ice', id: id, offer: answer}))
    }
}

//Get audio/video stream
async function startStreaming() {
    //catch errors
    try {
        localstream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
        localVideo(localstream);
        document.getElementById("call-remote").hidden = true;
    } catch(err) {
        console.log("Could not retrieve video and audio stream");
        try {
            localstream = await navigator.mediaDevices.getUserMedia({audio: true})
            localVideo(localstream);
            document.getElementById("call-remote").hidden = true;
        } catch(err2) {
            console.log("Could not retrieve audio stream")
            document.getElementById("call-remote").disabled = true;
        }
    }
}

//Mute remote stream and display correct button
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