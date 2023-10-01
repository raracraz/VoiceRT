const WebSocket = require('ws');
const { processAudioChunk } = require('../utils/audioProcessor');
const { spawn } = require('child_process');
const pythonProcess = spawn('python', ['./models/voiceModel.py']);


module.exports.setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', (audioChunk) => {
            // console.log('Received:', audioChunk);
            // Convert the audio chunk to base64
            const base64AudioChunk = audioChunk.toString('base64');
            // console.log('Received audio data:', base64AudioChunk)
            // Write the base64 string to the Python process's standard input
            // try {
            //     pythonProcess.stdin.write(base64AudioChunk + '\n');
            // } catch (error) {
            //     if (error.code === 'EPIPE') {
            //         console.error('Cannot write to Python process, it might be closed.');
            //     } else {
            //         throw error; // Re-throw unhandled errors
            //     }
            // }
            console.log('Python process ready state:', pythonProcess.stdin.writable);
            ws.send(JSON.stringify({ type: 'processed-audio', audioDataURL: `data:audio/wav;base64,${base64AudioChunk.toString('base64')}` }), (err) => {
                if (err) console.error('Failed to send message', err);
                // else console.log('Message sent successfully');
            });
        });

        pythonProcess.stdout.on('data', (data) => {
            console.error('Python process wrote to stderr:', data.toString());
            // Read the processed base64 string from the Python process's standard output
            const processedBase64Chunk = data.toString().trim();

            // Convert the processed base64 string to Buffer
            const processedAudioBuffer = Buffer.from(processedBase64Chunk, 'base64');
            // console.log('Processed audio data:', processedAudioBuffer);

            // Send the processed audio buffer to the client
            ws.send(JSON.stringify({ type: 'processed-audio', audioDataURL: `data:audio/wav;base64,${processedAudioBuffer.toString('base64')}` }), (err) => {
                if (err) console.error('Failed to send message', err);
                // else console.log('Message sent successfully');
            });

            // Listen for the close event on the Python process to log its exit code
            pythonProcess.on('close', (code) => {
                console.log(`Python process exited with code ${code}`);
            });
        });
        console.log('WebSocket ready state:', ws.readyState);

    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};
