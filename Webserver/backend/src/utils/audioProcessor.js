const { PythonShell } = require('python-shell');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function processAudioChunk(audioChunkBase64) {
  return new Promise((resolve, reject) => {
    // Create a temporary file to write the audio data
    const tempFile = path.join(os.tmpdir(), 'audio_chunk.wav');
    fs.writeFile(tempFile, audioChunkBase64, { encoding: 'base64' }, (err) => {
      if (err) return reject(err);

      let pyshell = new PythonShell('./models/voiceModel.py', {
        args: [tempFile] // Pass the filename as an argument
      });
      
      pyshell.on('message', function (message) {
        try {
          // Convert the base64 string to Buffer
          const processedAudioBuffer = Buffer.from(message, 'base64');
          resolve(processedAudioBuffer);
        } catch(err) {
          reject('Error converting base64 to Buffer: ' + err);
        }
      });

      pyshell.end(function (err) {
        if (err) reject(err);
        // Optionally, delete the temporary file after processing
        fs.unlink(tempFile, () => { });
      });
    });
  });
}

module.exports = { processAudioChunk };
