const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let mediaRecorder;
let audioChunks = [];
let socket;

function setupWebSocket() {
    socket = new WebSocket('ws://127.0.0.1:3001');
    socket.binaryType = 'arraybuffer'; // Use binary frames for audio data
    
    socket.onopen = () => {
        console.log('WebSocket connection opened');
    };
    
    socket.onmessage = (event) => {
        // Parse the incoming message
        const data = JSON.parse(event.data);
        console.log('Received audio data:', event.data); // log received audio data
        
        // Check the type of the message and play the audio if it's processed audio
        if (data.type === 'processed-audio') {
            playAudio(data.audioDataURL);
        }
    };
    
    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };
}


function playAudio(audioBinaryData) {
    try {
        const audioBlob = new Blob([audioBinaryData], { type: 'audio/wav' }); // Adjust the MIME type
        const audioURL = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioURL);
        const outputDeviceId = document.getElementById('outputDevice').value;
        
        audioElement.setSinkId(outputDeviceId);
        audioElement.play().catch(error => console.error('Error playing audio:', error));
    } catch (error) {
        console.error('Error in playAudio:', error);
    }
}

// Populate input and output device dropdowns
function setupDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            const inputDeviceSelect = document.getElementById('inputDevice');
            const outputDeviceSelect = document.getElementById('outputDevice');
            
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    const option = new Option(device.label || 'Microphone', device.deviceId);
                    inputDeviceSelect.appendChild(option);
                } else if (device.kind === 'audiooutput') {
                    const option = new Option(device.label || 'Speaker', device.deviceId);
                    outputDeviceSelect.appendChild(option);
                }
            });
        })
        .catch(err => console.error('Error enumerating devices', err));
}

// Start Recording
document.getElementById('start').addEventListener('click', () => {
    const inputDeviceId = document.getElementById('inputDevice').value;
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: inputDeviceId } })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    // Send the audio chunk to the server
                    socket.send(event.data);
                }
            };

            mediaRecorder.start();
        })
        .catch(err => console.error('Error accessing the microphone', err));
});

// Stop Recording
document.getElementById('stop').addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        audioChunks = [];
    }
});

setupWebSocket();
setupDevices(); // Setup input and output devices