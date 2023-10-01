import torch
import librosa  # for audio processing
import numpy as np
import io
import soundfile as sf
import os
import sys
import base64

# Define or import your model class
class VoiceChangerModel(torch.nn.Module):
    def __init__(self):
        super(VoiceChangerModel, self).__init__()
        # Define your model layers and architecture here
        
    def forward(self, x):
        # Define forward pass
        return x  # For demonstration, we are not modifying the audio_data.
                  # Replace with your actual model's processing.


# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
# Construct the absolute path to the .pth file
model_path = os.path.join(script_dir, 'trained_voices', 'March7th', 'March7thEN.pth')
# Load the trained model
model = VoiceChangerModel()

model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')), strict=False)

state_dict = torch.load(model_path, map_location=torch.device('cpu'))
print(state_dict.keys())

model.eval()

def process_audio_chunk(audio_chunk):
    # Replace with actual processing logic
    # For demonstration, we are not modifying the audio_chunk
    return audio_chunk

def main():
    try:
        while True:  # Keep reading and processing chunks indefinitely

            base64_chunk = sys.stdin.readline().strip()  # Read a line from standard input

            if not base64_chunk:
                print("Received empty base64 chunk", file=sys.stderr)
                continue  # Skip empty lines

            # Decode the base64 string to bytes
            audio_chunk_bytes = base64.b64decode(base64_chunk)
            
            # Convert bytes to numpy array or any suitable format
            audio_chunk, sample_rate = sf.read(io.BytesIO(audio_chunk_bytes), dtype='int16')
            
            # Process the audio chunk
            with torch.no_grad():
                processed_audio_chunk = process_audio_chunk(audio_chunk)
            
            # Convert processed audio to bytes
            processed_audio_bytes = io.BytesIO()
            sf.write(processed_audio_bytes, processed_audio_chunk, sample_rate)
            
            # Encode the processed audio chunk to base64
            processed_base64_chunk = base64.b64encode(processed_audio_bytes.getvalue()).decode('ascii')
            
            # Write the processed base64 string to standard output
            print(processed_base64_chunk)
            sys.stdout.flush()  # Ensure the processed chunk is sent immediately
            
    except Exception as e:
        print(f"Error in main: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
