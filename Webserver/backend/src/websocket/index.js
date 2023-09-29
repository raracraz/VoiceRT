const WebSocket = require('ws');
const { processAudioChunk } = require('../utils/audioProcessor');

module.exports.setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', (audioChunk) => {
            // Process the incoming audio data.
            processAudioChunk(audioChunk)
                .then((processedAudio) => {
                    // Convert processed audio buffer to data URL
                    const audioDataURL = `data:audio/wav;base64,${processedAudio.toString('base64')}`;
                    // Send back the processed audio data URL.
                    ws.send(JSON.stringify({ type: 'processed-audio', audioDataURL }), (err) => {
                        if (err) {
                            console.error('Error sending audio:', err);
                        } else {
                            console.log('Audio data sent successfully:', processedAudio); // log the audio data or some identifier of it
                        }
                    });
                })
                .catch((err) => {
                    console.error('Error processing audio:', err);
                });
        });
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};
