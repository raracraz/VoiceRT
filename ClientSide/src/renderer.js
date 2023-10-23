let mediaRecorder;
let audioChunks = [];
let socket;
let audioContext;
let scriptNode;
let audioQueue = [];

function setupWebSocket() {
    socket = new WebSocket('ws://127.0.0.1:3001');
    socket.binaryType = 'arraybuffer'; // Use binary frames for audio data

    socket.onopen = () => {
        console.log('WebSocket connection opened');
        setupDevices();
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

}

// Utility function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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

// Start Streaming
document.getElementById('start').addEventListener('click', () => {
    console.log('Start button clicked');

    const inputDeviceId = document.getElementById('inputDevice').value;

    navigator.mediaDevices.getUserMedia({ audio: { deviceId: inputDeviceId } })
        .then(stream => {

            // Set up the MediaRecorder to record the stream
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.onerror = (event) => console.error('MediaRecorder Error:', event.error);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    console.log("event data:", event.data);
                    socket.send(event.data);
                }
            };

            mediaRecorder.start(500); // Start with a 1 second timeslice

            // When a message is received from the server
            socket.onmessage = (event) => {
                console.log('WebSocket Message received:', event.data);
                const data = JSON.parse(event.data);
                if (data.type == 'processed-audio') {
                    try {
                        const audioDataURL = data.audioDataURL;
                        console.log('Received audioDataURL:', audioDataURL);

                        const base64String = audioDataURL.split(",")[1];
                        if (!base64String) throw new Error('Invalid audioDataURL');

                        const audioData = base64ToArrayBuffer(base64String);
                        console.log('Received audioData:', audioData)

                        const audioBlob = new Blob([audioData], { type: 'audio/wav' });

                        const audioURL = URL.createObjectURL(audioBlob);
                        console.log('Received audioURL:', audioURL);

                        // Play audio using Howler
                        const sound = new Howl({
                            src: [audioURL],
                            format: ['wav'],
                            html5: true,
                        });

                        sound.play();

                    } catch (error) {
                        console.error('Error decoding and playing audio:', error);
                    }
                } else {
                    console.log('Unknown message type received from server:', data.type);
                }
            };
        })
        .catch(err => console.error('Error accessing the microphone', err));
});

document.getElementById('stop').addEventListener('click', () => {
    console.log('Stop button clicked');

    if (mediaRecorder) {
        mediaRecorder.stop();

        // Nullify the ondataavailable event handler.
        mediaRecorder.ondataavailable = null;
        console.log('ondataavailable nullified');

        // Stop all MediaStreamTracks.
        mediaRecorder.stream.getTracks().forEach(track => {
            track.stop();
            console.log('Track readyState after stop:', track.readyState); // It should log 'ended'
        });

        // Set mediaRecorder to null.
        mediaRecorder = null;
        console.log('MediaRecorder set to null');
    } else {
        console.error('MediaRecorder is not active or not defined');
    }
});



// Call only setupWebSocket on load. The rest will be set up once the socket is open.
setupWebSocket();