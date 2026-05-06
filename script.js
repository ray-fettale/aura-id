const video = document.getElementById('myVideo');
const statusText = document.getElementById('status');
const nameInput = document.getElementById('userName');

let enrolledUsers = JSON.parse(localStorage.getItem('enrolledUsers')) || [];

async function init() {
    statusText.innerText = "Connecting to AI Core...";
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
            faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'),
            faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights')
        ]);
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        statusText.innerText = "AuraID Active: Ready to Scan";
    } catch (err) {
        statusText.innerText = "CRITICAL ERROR: Models Missing or Camera Denied.";
        console.error(err);
    }
}

async function registerFace() {
    const name = nameInput.value;
    if (!name) return alert("System requires a name for enrollment.");
    statusText.innerText = "Mapping Facial Architecture...";
    statusText.style.color = "white";
    const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
    if (detection) {
        enrolledUsers.push({ name: name, descriptor: Array.from(detection.descriptor) });
        localStorage.setItem('enrolledUsers', JSON.stringify(enrolledUsers));
        statusText.innerText = `ENROLLMENT SUCCESS: ${name} Securely Stored`;
        statusText.style.color = "#00ff00";
        nameInput.value = "";
    } else {
        statusText.innerText = "FAILED: Subject Not Detected.";
        statusText.style.color = "#ff4444";
    }
}

async function verifyFace() {
    statusText.innerText = "Scanning Pattern...";
    statusText.style.color = "white";
    const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
    if (!detection) {
        statusText.innerText = "ERROR: No Subject Detected";
        statusText.style.color = "#ff4444";
        return;
    }
    let bestMatch = { name: "Unknown", distance: 1.0 };
    enrolledUsers.forEach(user => {
        const savedDescriptor = new Float32Array(user.descriptor);
        const distance = faceapi.euclideanDistance(detection.descriptor, savedDescriptor);
        if (distance < 0.45 && distance < bestMatch.distance) {
            bestMatch = { name: user.name, distance: distance };
        }
    });
    if (bestMatch.name !== "Unknown") {
        statusText.innerText = `ACCESS GRANTED: Welcome, ${bestMatch.name}`;
        statusText.style.color = "#00ff00";
    } else {
        statusText.innerText = "SECURITY ALERT: Identity Not Confirmed";
        statusText.style.color = "#ff4444";
    }
}

function clearData() {
    if (enrolledUsers.length === 0) return alert("No users enrolled.");
    localStorage.removeItem('enrolledUsers');
    enrolledUsers = [];
    statusText.innerText = "System Memory Cleared.";
    statusText.style.color = "white";
}

init();
