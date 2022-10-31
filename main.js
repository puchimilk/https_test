let peerConnection = null;

const dom = {
  videos: {
    local: document.getElementById('local_video'),
    remote: document.getElementById('remote_video'),
  },
  sdp: {
    send: document.getElementById('text_for_send_sdp'),
    recv: document.getElementById('text_for_recv_sdp'),
  },
};

function createConnection() {
  console.log('called: createConnection');

  let pc_config = { iceServices: [] };

  pc = new RTCPeerConnection(pc_config);

  pc.ontrack = (e) => {
    console.log('called: ontrack');

    let stream = e.streams[0];

    playVideo(dom.videos.remote, stream);
  };

  pc.onicecandidate = (e) => {
    console.log('called: onicecandidate');

    if (e.candidate) {
      //
    } else {
      console.log('completed: ICE candidate');

      dom.sdp.send.value = pc.localDescription.sdp;
    }
  };

  peerConnection = pc;
}

async function startVideo() {
  console.log('called: startVideo');

  try {
    const config = { video: true, audio: false };
    const stream = await navigator.mediaDevices.getUserMedia(config);

    stream.getTracks().forEach(function (track) {
      peerConnection.addTrack(track, stream);
    });

    playVideo(dom.videos.local, stream);
  } catch (error) {
    console.error('getUserMedia error:', e);
  }
}

function playVideo(element, stream) {
  element.srcObject = stream;
  element.play();
  element.volume = 0;
}

async function createOffer() {
  console.log('called: createOffer');

  try {
    const sessionDescription = await peerConnection.createOffer();

    console.log(sessionDescription);

    await peerConnection.setLocalDescription(sessionDescription);

    console.log('setLocalDescription() success');
  } catch (error) {
    console.error(error);
  }
}

async function receiveRemoteSdpForAnswer() {
  console.log('called: receiveRemoteSdpForAnswer()');

  const sdp = dom.sdp.recv.value;
  const offer = new RTCSessionDescription({
    type: 'offer',
    sdp,
  });

  try {
    await peerConnection.setRemoteDescription(offer);
  } catch (error) {
    console.error(error);
  }
}

async function createAnswer() {
  console.log('called: createAnswer()');

  try {
    const sessionDescription = await peerConnection.createAnswer();

    console.log(sessionDescription);

    await peerConnection.setLocalDescription(sessionDescription);

    console.log('setLocalDescription() success');
  } catch (error) {
    console.error(error);
  }
}

async function receiveRemoteSdpForOffer() {
  console.log('called: receiveRemoteSdpForOffer()');

  const sdp = dom.sdp.recv.value;
  const answer = new RTCSessionDescription({
    type: 'answer',
    sdp,
  });

  try {
    await peerConnection.setRemoteDescription(answer);
  } catch (error) {
    console.error(error);
  }
}
