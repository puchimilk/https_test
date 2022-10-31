/**
 * WebSocketServerのURL
 * @type {string}
 */
const WSS_URL = 'wss://localhost:3000';
/**
 * @type {WebSocket | null}
 */
let server = null;
/**
 * @type {RTCPeerConnection | null}
 */
let peerConnection = null;

// videoタグやtextareaなどのHTML要素
const dom = {
  videos: {
    /**
     * @type {HTMLMediaElement | null}
     */
    local: document.getElementById('local_video'), // ローカル
    /**
     * @type {HTMLMediaElement | null}
     */
    remote: document.getElementById('remote_video'), // ローカル
  },
  sdp: {
    /**
     * @type {HTMLTextAreaElement | null}
     */
    send: document.getElementById('text_for_send_sdp'),
    /**
     * @type {HTMLTextAreaElement | null}
     */
    recv: document.getElementById('text_for_recv_sdp'),
  },
};

function prepare() {
  prepareWebSocket();
  prepareRTCPeerConnection();
  wakeUpVideo();
}

function connect() {
  createOffer();
}

function prepareWebSocket() {
  server = new WebSocket(WSS_URL);
  server.onopen = onOpen;
  server.onerror = onError;
  server.onmessage = onMessage;
}

/**
 * @param {Event} event
 */
function onOpen(event) {
  console.log('open web socket server.');
}

/**
 * @param {Event} event
 */
function onError(event) {
  console.error(event);
}

/**
 * @param {MessageEvent} event
 * @returns
 */
async function onMessage(event) {
  const text = await event.data.text();
  const msg = JSON.parse(text);

  if (msg.type === 'offer') {
    receiveSessionDescription(msg);
    await createAnswer();
    return;
  }

  if (msg.type === 'answer') {
    receiveSessionDescription(msg);
    return;
  }

  if (msg.type === 'candidate') {
    const candidate = new RTCIceCandidate(msg.ice);
    peerConnection.addIceCandidate(candidate);
  }
}

// RTCPeerConnectionの準備
function prepareRTCPeerConnection() {
  const config = { iceServers: [] };
  peerConnection = new RTCPeerConnection(config);

  peerConnection.ontrack = onTrack;
  peerConnection.onicecandidate = onIceCandidate;
}

// OfferのSessionDescriptionを作成・セット
async function createOffer() {
  const sessionDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(sessionDescription);
  sendSessionDescription(sessionDescription);
}

// AnswerのSessionDescriptionを作成・セット
async function createAnswer() {
  const sessionDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(sessionDescription);
  sendSessionDescription(sessionDescription);
}

function sendSessionDescription(description) {
  // JSONを文字列にして送信
  const data = JSON.stringify(description);
  server.send(data);

  // textareaに表示
  dom.sdp.send.value = description.sdp;
}

/**
 * @param {RTCSessionDescriptionInit} description
 */
async function receiveSessionDescription(description) {
  // コネクションに設定
  await peerConnection.setRemoteDescription(description);

  // textareaに表示
  dom.sdp.recv.value = description.sdp;
}

/**
 * @param {RTCTrackEvent} event
 */
function onTrack(event) {
  let stream = event.streams[0];

  dom.videos.remote.setAttribute('playsinline', true);
  playVideo(dom.videos.remote, stream);
}

/**
 * @param {RTCPeerConnectionIceEvent} event
 * @returns
 */
function onIceCandidate(event) {
  console.log('onicecandidate');

  if (event.candidate === null) return;

  const data = {
    type: 'candidate',
    ice: event.candidate,
  };
  server.send(JSON.stringify(data));
}

async function wakeUpVideo() {
  const config = { video: true, audio: true };

  const stream = await navigator.mediaDevices.getUserMedia(config);

  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });

  dom.videos.local.setAttribute('playsinline', true);
  playVideo(dom.videos.local, stream);
}

/**
 * @param {HTMLMediaElement} element
 * @param {MediaStream} stream
 */
function playVideo(element, stream) {
  element.srcObject = stream;
  element.play();
  element.volume = 50;
}
