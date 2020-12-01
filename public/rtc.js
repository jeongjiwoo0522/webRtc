let localVideo = document.querySelector("#localVideo");
let remoteVideo = document.querySelector("#remoteVideo");
console.dir(localVideo);

const caller = new RTCPeerConnection(); // RTCPeerConnection을 통해 연결 객체를 생성
const callee = new RTCPeerConnection(); 

console.dir(caller, callee);

const BASE_URL = "http://localhost:8005";

const socket = io.connect(`${BASE_URL}/rtc`, {
  path: "/socket.io"
});

function sendAnswer(sdp) {
  caller.setRemoteDescription(sdp); // 전달받은 sdp를 RemoteDescription으로 설정 
  // 여기까지 로컬 sdp, RemoteDescription 설정 완료
  // 이후에 상대와 통신할 수 있는 candidate를 찾는다 (iceCandidate로 설정)
}

function createAnswerSuccess(sdp) {
  callee.setRemoteDescription(sdp); // caller와 마찬가지로 로컬 sdp로 설정해주고 caller에게 전달
  sendAnswer(sdp);  // send to Caller
}

function createAnswer() {
  callee.createAnswer()  // caller에게 보낼 sdp를 생성 
  .then(createAnswerSuccess)
  .catch(console.error);
}

function sendOffer(sdp) {
  console.dir(sdp);
  callee.setRemoteDescription(sdp); // 전달받은 sdp를 RemoteDescription으로 설정 
  createAnswer();
}

function createOfferSuccess(sdp) {
  console.log(sdp);
  caller.setLocalDescription(sdp); // 로컬 sdp로 설정 나중에 callee로 sdp와 candidate를 전달(signaling)
  sendOffer(sdp);
}

function createOffer() {
  caller.createOffer() // 수신자에게 전달할 session description protocol 생성 
  .then(createOfferSuccess)
  .catch(console.error);
}

function sendStream(stream) {
  socket.emit("stream", stream);
}

function sendMessage(message) {
  console.log("clent sendgin message", message);
  socket.emit("message", message);
}

function gotStream(stream) {
  console.log("adding local stream ", stream);
  localVideo.srcObject = stream; // video, audio를 뜨게 한다 
  sendMessage("got user media"); // socket으로 메세지 전송
  sendStream(stream);
  caller.addStream(stream); // 콜백으로 받은 스트림을 RTCPeerConnection에 입력
  createOffer();
}

function getUserMedia() {
  navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false,
  })
  .then(gotStream)
  .catch(console.error);
}

function init() {
  getUserMedia(); // 유저의 video, audio 스트림을 받아온다 
}

init();


// -------------------- 

function handleCallerOnIcecandidate(e) {
  if(e.candidate) {
    callee.addIceCandidate(e.candidate);
  }
}

function handleCalleeOnIcecandidate(e) {
  if(e.candidate) {
    caller.addIceCandidate(e.candidate);
  }
}

caller.onicecandidate = handleCallerOnIcecandidate;
callee.onicecandidate = handleCalleeOnIcecandidate;

function handleCalleeOnAddStream(e) {
  remoteVideo.srcObject = e.stream;
}

callee.onaddsteam = handleCalleeOnAddStream; 


socket.on("stream", (stream) => {
  remoteVideo.srcObject = stream;
});