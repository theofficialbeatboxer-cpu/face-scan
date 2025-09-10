const video = document.getElementById('video');
const attendanceList = document.getElementById('attendanceList');
const markBtn = document.getElementById('markBtn');

let knownDescriptors = [];
let knownNames = [];

// Load face-api models from /models
async function loadModels() {
  const MODEL_URL = '/models';
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  console.log('Models loaded');
}

// Start webcam
async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
  } catch (err) {
    console.error('Error accessing webcam:', err);
    alert('Could not access webcam. Please allow camera access.');
  }
}

// Save attendance log to localStorage
function saveAttendanceLog() {
  const items = [];
  attendanceList.querySelectorAll('li').forEach(li => items.push(li.textContent));
  localStorage.setItem('attendanceLog', JSON.stringify(items));
}

// Load attendance log from localStorage
function loadAttendanceLog() {
  const items = JSON.parse(localStorage.getItem('attendanceLog')) || [];
  attendanceList.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    attendanceList.appendChild(li);
  });
}

// Register a new face with a name
async function registerFace() {
  const name = prompt('Enter your name for registration:');
  if (!name) return;

  const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
  if (!detection) {
    alert('No face detected. Please try again.');
    return;
  }

  knownDescriptors.push(detection.descriptor);
  knownNames.push(name);
  alert(`Face registered for ${name}`);
}

// Mark attendance by recognizing face
async function markAttendance() {
  const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();

  if (!detection) {
    alert('No face detected. Please try again.');
    return;
  }

  if (knownDescriptors.length === 0) {
    alert('No registered faces found. Please register first.');
    return;
  }

  const faceMatcher = new faceapi.FaceMatcher(knownDescriptors.map(desc => new faceapi.LabeledFaceDescriptors('', [desc])));
  
  // Find best match
  const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

  let matchedName = 'Unknown';

  if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.6) {
    // Since our labeledFaceDescriptors label is empty string, we match by index manually:
    // So we find which descriptor in knownDescriptors matches best
    let bestIndex = 0;
    let minDistance = Infinity;
    for (let i = 0; i < knownDescriptors.length; i++) {
      const dist = faceapi.euclideanDistance(detection.descriptor, knownDescriptors[i]);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = i;
      }
    }
    if (minDistance < 0.6) {
      matchedName = knownNames[bestIndex];
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleString();

  const li = document.createElement('li');
  li.textContent = `${matchedName} - ${timeStr}`;
  attendanceList.prepend(li);

  saveAttendanceLog();

  if (matchedName === 'Unknown') {
    if (confirm('Unknown face detected. Would you like to register?')) {
      await registerFace();
    }
  }
}

// Initialization
async function init() {
  await loadModels();
  await startVideo();
  loadAttendanceLog();
}

markBtn.addEventListener('click', markAttendance);

init();
