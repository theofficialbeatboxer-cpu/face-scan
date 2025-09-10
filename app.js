const video = document.getElementById('video');
const attendanceList = document.getElementById('attendanceList');
const markBtn = document.getElementById('markBtn');

let knownFaces = [];
let knownNames = [];

async function loadModels() {
  if (typeof faceapi === 'undefined') {
    alert("face-api.js failed to load.");
    throw new Error("face-api.js not loaded");
  }

  await faceapi.nets.ssdMobilenetv1.loadFromUri('https://unpkg.com/face-api.js@0.22.2/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://unpkg.com/face-api.js@0.22.2/weights');
  await faceapi.nets.faceRecognitionNet.loadFromUri('https://unpkg.com/face-api.js@0.22.2/weights');
}

async function startVideo() {
  try {
    console.log("Requesting camera access...");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    console.log("Camera stream received");
  } catch (err) {
    console.error("Error accessing webcam: ", err);
    alert("Could not access webcam. Please allow camera access.");
  }
}

function saveAttendanceLog() {
  const items = [];
  attendanceList.querySelectorAll('li').forEach(li => {
    items.push(li.textContent);
  });
  localStorage.setItem('attendanceLog', JSON.stringify(items));
}

function loadAttendanceLog() {
  const items = JSON.parse(localStorage.getItem('attendanceLog')) || [];
  attendanceList.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    attendanceList.appendChild(li);
  });
}

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
    const labeledDescriptors = knownNames.map((name, i) => {
      return new faceapi.LabeledFaceDescriptors(name, [knownFaces[i]]);
    });
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

    if (bestMatch.label !== "unknown" && bestMatch.distance < 0.6) {
      matchedName = bestMatch.label;
    }
  }

  const now = new Date();
  const timeString = now.toLocaleString();

  const listItem = document.createElement('li');
  listItem.textContent = `${matchedName} - ${timeString}`;
  attendanceList.prepend(listItem);

  saveAttendanceLog();

  if (matchedName === "Unknown") {
    if (confirm("Unknown face detected. Register new face?")) {
      await registerFace();
    }
  }
}

async function init() {
  console.log("App loaded");
  await loadModels();
  console.log("Models loaded");
  await startVideo();
  loadAttendanceLog();
}

markBtn.addEventListener('click', markAttendance);
init();
