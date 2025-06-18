// frontend-service/public/js/tts-utility.js
document.addEventListener('DOMContentLoaded', () => {
    const ttsForm = document.getElementById('ttsAppForm');
    const textInput = document.getElementById('textToSynthesizeApp');
    const voiceSelect = document.getElementById('voiceIdApp');
    const engineSelect = document.getElementById('engineApp');
    const statusMessage = document.getElementById('statusMessageApp');
    const audioPlayerContainer = document.getElementById('audioPlayerContainerApp');
    const synthesizeBtn = document.getElementById('synthesizeBtnApp');

    const TTS_SERVICE_BASE_URL = 'http://localhost:4020'; // Port of your tts-service

    if (ttsForm) {
        ttsForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const text = textInput.value;
            const voiceId = voiceSelect.value;
            const engine = engineSelect.value;

            if (!text.trim()) {
                statusMessage.textContent = 'Please enter some text to synthesize.';
                statusMessage.className = 'error-message'; 
                return;
            }

            if (synthesizeBtn) synthesizeBtn.disabled = true;
            statusMessage.textContent = 'Synthesizing speech, please wait...';
            statusMessage.className = 'info-message';
            audioPlayerContainer.innerHTML = ''; 

            try {
                const response = await fetch(`${TTS_SERVICE_BASE_URL}/api/tts/synthesize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text, voiceId, engine }),
                });

                const data = await response.json();

                if (response.ok) {
                    statusMessage.textContent = data.message || 'Speech synthesized successfully!';
                    statusMessage.className = 'success-message';

                    if (data.audioUrl) {
                        const audioPlayer = document.createElement('audio');
                        audioPlayer.controls = true;
                        audioPlayer.src = data.audioUrl; 
                        audioPlayer.onerror = () => {
                            statusMessage.textContent = 'Error: Could not load the audio file. Check TTS service, its logs, and network.';
                            statusMessage.className = 'error-message';
                        };
                        audioPlayerContainer.appendChild(audioPlayer);
                        audioPlayer.play().catch(playError => {
                            console.warn("Audio autoplay was prevented or failed:", playError);
                            statusMessage.textContent += " (Audio ready. Click play if it doesn't start automatically)";
                        });
                    } else {
                         statusMessage.textContent = 'Synthesis successful, but no audio URL was returned.';
                         statusMessage.className = 'warning-message';
                    }
                } else {
                    statusMessage.textContent = `Error: ${data.message || 'Failed to synthesize. Check TTS service logs.'}`;
                    statusMessage.className = 'error-message';
                }
            } catch (error) {
                console.error('TTS request failed:', error);
                statusMessage.textContent = `Request to TTS service failed. Ensure it's running at ${TTS_SERVICE_BASE_URL}. Check console.`;
                statusMessage.className = 'error-message';
            } finally {
                if (synthesizeBtn) synthesizeBtn.disabled = false;
            }
        });
    } else {
        console.error("TTS form 'ttsAppForm' not found on the page.");
    }
});
