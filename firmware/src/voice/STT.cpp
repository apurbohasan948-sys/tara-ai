#include "STT.h"
#include "../hardware/AudioHardware.h"

CloudSTTProvider::CloudSTTProvider(AudioHardware* audioHw)
    : audio(audioHw), listening(false), listeningStartMs(0) {}

CloudSTTProvider::~CloudSTTProvider() {}

bool CloudSTTProvider::begin() {
    Serial.println("[STT] Cloud Speech-to-Text provider ready.");
    return true;
}

void CloudSTTProvider::startListening() {
    listening = true;
    listeningStartMs = millis();
    if (audio) {
        audio->playStateSound(1); // Prompt chime
    }
    Serial.println("[STT] Started recording speech...");
}

void CloudSTTProvider::stopListening() {
    listening = false;
    Serial.println("[STT] Stopped recording speech.");
}

STTResult CloudSTTProvider::processAudio() {
    STTResult res;
    res.success = false;
    res.confidence = 0.0f;

    if (!listening) {
        res.errorMessage = "Not in listening mode";
        return res;
    }

    stopListening();
    // Placeholder pipeline for STT processing
    res.success = true;
    res.transcript = "Hello TARA";
    res.confidence = 0.95f;
    return res;
}
