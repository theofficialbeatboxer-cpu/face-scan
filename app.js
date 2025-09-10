const video = document.getElementById('video');
const attendanceLog = document.getElementById('attendanceLog');

async function loadModels() {
  const MODEL_URL = '/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  console.log('Models loaded');
}

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (error) {
    console.error('Error accessing webcam:', error);
  }
}

video.addEventListener('play', () => {
  console.log('Video started');
});

document.getElementById('markAttendance').addEventListener('click', async () => {
  const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
  if (!detections.length) {
    alert('No face detected!');
    return;
  }
  attendanceLog.innerHTML += `<p>Attendance marked at ${new Date().toLocaleTimeString()}</p>`;
});

async function init() {
  await loadModels();
  startVideo();
}

init();
