// Elements
const video = document.getElementById('video');
const attendanceList = document.getElementById('attendanceList');
const markBtn = document.getElementById('markBtn');

let knownFaces = [];
let knownNames = [];

// Load face-api.js models
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri('https://unpkg.com/face-api.js@0.22.2/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://unpkg.com/face-api.js@0.22.2/weights');
  await faceapi.nets.faceRecognitionNet.loadFromUri('https://unpkg.com/face-api.js@0.22.2/weights');
}

// Initialize webcam video stream
async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam: ", err);
    alert("Could not access webcam. Please allow camera access.");
  }
}

// Save attendance log to localStorage
function saveAttendanceLog() {
  const items = [];
  attendanceList.querySelectorAll('li').forEach(li => {
    items.push(li.textContent);
  });
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

// Register new face
async function registerFace() {
  const name = prompt("Enter name for face registration:");
  if (!name) return;

  const detection = await faceapi.detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (detection) {
    knownFaces.push(detection.descriptor);
    knownNames.push(name);
    alert(`Face registered for ${name}`);
  } else {
    alert("No face detected. Please try again.");
  }
}

// Mark attendance function
async function markAttendance() {
  const detection = await faceapi.detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    alert("No face detected. Please ensure your face is visible.");
    return;
  }

  let matchedName = "Unknown";
  if (knownFaces.length > 0) {
    const faceMatcher = new faceapi.FaceMatcher(knownFaces);
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

    // faceMatcher returns label as string index, convert to int to access knownNames
    const labelIndex = parseInt(bestMatch.label);
    if (!isNaN(labelIndex) && bestMatch.distance < 0.6) {
      matchedName = knownNames[labelIndex];
    }
  }

  const now = new Date();
  const timeString = now.toLocaleString();

  const listItem = document.createElement('li');
  listItem.textContent = `${matchedName} - ${timeString}`;
  attendanceList.prepend(listItem);

  // Save attendance locally
  saveAttendanceLog();

  if (matchedName === "Unknown") {
    if (confirm("Unknown face detected. Register new face?")) {
      await registerFace();
    }
  }
}

// Initialize app
async function init() {
  await loadModels();
  await startVideo();
  loadAttendanceLog();
}

// Event listeners
markBtn.addEventListener('click', markAttendance);

// Run
init();
