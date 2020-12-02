'use strict';

let isChannelReady = false;// channel room이 2명의 사용자를 불러와 연결준비가 된 상태 (수정 필요)
let isInitiator = false; // 개시인이 room을 만든 상태 
let isStarted = false; // 영상채팅을 시작한 상태 
let turnReady; 
let localStream; // 로컬 스트리밍을 담을 객체 
let remoteStream; // 상대방 스트리밍을 담는 객체 
let pc; // 로컬 peerConnection 객체 

const pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'// sturn server 설정 
  }]
};

// Set up audio and video regardless of what devices are present.
const sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

/////////////////////////////////////////////

let room; // room name 
// Could prompt for room name:
room = prompt('Enter room name:');

const socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
} else {
  // room의 이름이 입력되지 않을 경우 처리할 로직 구현 
}

// room에 들어온 사람이 1명일 경우 새로운 룸을 만듬 
socket.on('created', (room) => {
  console.log('Created room ' + room);
  isInitiator = true;
});

// 2명 이상일 땐 꽉 찬 상태로 처리 (수정 필요)
socket.on('full', (room) => {
  console.log('Room ' + room + ' is full');
});

//1명일 경우 room에 들어가고 연결
socket.on('join', (room) => {
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});
//1명일 경우 room에 들어가고 연결
socket.on('joined', (room) => {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket.on('log', (array) => {
  console.log.apply(console, array);
});

////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', (message) => {
  console.log('Client received message:', message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');

// 로컬 유저 video audio 스트림을 받는 함수 
navigator.mediaDevices.getUserMedia({
  audio: true,
  video: true
})
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

// 로컬 유저 video audio 스트림을 받는 함수
function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

const constraints = {
  video: true
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

// 유저스트림을 받아올 때 호출됨
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  // 화상통화를 시작하지 않았고 localStream이 있고 연결 준비가 되었을 때  
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection(); // 로컬 PeerConnection 생성
    pc.addStream(localStream); // 로컬 PeerConnection 객체에 로컬 스트림 추가 
    isStarted = true; // 영상스트림이 시작되었음을 표시 
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall(); // 연결 요청을 한다 (송신)
    }
  }
}

window.onbeforeunload = () => {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try { 
    pc = new RTCPeerConnection(null); // PeerConnection 객체를 생성
    pc.onicecandidate = handleIceCandidate; // 다른 사람과 연결되었을 때 처리할 핸들러
    pc.onaddstream = handleRemoteStreamAdded; // 스트림을 설정할 때 처리할 핸들러 
    pc.onremovestream = handleRemoteStreamRemoved; // 스트림을 삭제하는 핸들러 
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  // createOffer 함수로 로컬 PeerConnection에서 송신 
  // 미디어정보를 교환할 수 있는 session description 생성 
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

// 생성된 session description을 처리하는 핸들러
function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


// turn 서버로 요청을 보내는 함수 
async function requestTurn(turnURL) {
  let turnExists = false;
  for (let i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    const res = await axios.get(turnURL);
    const turnServer = JSON.parse(res.data);
    console.log('Got TURN server: ', turnServer);
    pcConfig.iceServers.push({
      'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
      'credential': turnServer.password
    });
    turnReady = true;
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
