#include "VoiceManager.h"
#include "AudioBuffer.h"
#include "VAD.h"
#include "AudioDecoder.h"
#include "../storage/StorageManager.h"
#include "../hardware/AudioHardware.h"
#include "../face/FaceManager.h"
#include <math.h>

VoiceManager::VoiceManager(StorageManager* storageMgr, AudioHardware* hardware)
    : storage(storageMgr),
      audioHw(hardware),
      audioMgr(nullptr),
      audioBuffer(nullptr),
      vad(nullptr),
      decoder(nullptr),
      stt(nullptr),
      tts(nullptr),
      face(nullptr),
      transcriptCb(nullptr),
      transcriptUserData(nullptr),
      totalSamplesCaptured(0),
      lastMicReadMs(0),
      isProcessingSTT(false) {
    memset(lastTranscript, 0, sizeof(lastTranscript));
    audioMgr = new AudioManager(audioHw);
    audioBuffer = new AudioBuffer();
    vad = new VADDetector();
    decoder = new AudioDecoder(audioHw);
    stt = new CloudSTTProvider(audioHw);
    tts = new GttsTTSProvider(audioHw, decoder);
}

VoiceManager::~VoiceManager() {
    if (audioMgr) delete audioMgr;
    if (audioBuffer) delete audioBuffer;
    if (vad) delete vad;
    if (decoder) delete decoder;
    if (stt) delete stt;
    if (tts) delete tts;
}

bool VoiceManager::begin() {
    if (storage) {
        storage->loadVoiceConfig(config);
    }

    if (audioMgr) {
        audioMgr->begin();
        audioMgr->setVolume(config.volume);
    }

    if (decoder) {
        decoder->begin();
        decoder->setVolume(config.volume);
    }

    if (vad) {
        VADConfig vadCfg;
        vadCfg.speechThresholdRms = config.vadThreshold;
        vadCfg.silenceThresholdRms = config.vadThreshold / 2;
        vadCfg.minSpeechMs = 200;
        vadCfg.silenceTimeoutMs = config.silenceTimeoutMs;
        vadCfg.maxRecordingMs = config.maxRecordingMs;
        vad->setConfig(vadCfg);
    }

    if (stt) {
        stt->begin();
        ((CloudSTTProvider*)stt)->setEndpoint(config.sttEndpoint);
    }

    if (tts) {
        tts->begin();
        ((GttsTTSProvider*)tts)->setEndpoint(config.ttsEndpoint);
        
        // Connect real audio amplitude to FaceManager for synchronized mouth animation
        tts->setAmplitudeListener([](float amp, void* udata) {
            VoiceManager* self = (VoiceManager*)udata;
            if (self && self->face) {
                self->face->setMouthAmplitude(amp);
            }
        }, this);
    }

    Serial.println("[VoiceManager] Production voice pipeline online (I2S Mic + VAD + STT + gTTS + I2S Spk).");
    return true;
}

void VoiceManager::setFaceManager(FaceManager* faceMgr) {
    face = faceMgr;
}

void VoiceManager::setTranscriptCallback(TranscriptCallback cb, void* userData) {
    transcriptCb = cb;
    transcriptUserData = userData;
}

void VoiceManager::startListening() {
    if (isSpeaking()) {
        stopSpeaking();
    }

    if (audioBuffer) {
        audioBuffer->clear();
    }

    if (vad) {
        vad->startListening();
    }

    if (stt) {
        stt->startListening();
    }

    Serial.println("[VoiceManager] Listening mode activated.");
}

void VoiceManager::stopListening() {
    if (vad) {
        vad->stop();
    }
    if (stt) {
        stt->stopListening();
    }
    isProcessingSTT = false;
    Serial.println("[VoiceManager] Listening mode stopped.");
}

bool VoiceManager::isListening() const {
    return (vad && (vad->getState() == VADState::LISTENING || vad->getState() == VADState::RECORDING)) || isProcessingSTT;
}

STTState VoiceManager::getSTTState() const {
    return stt ? stt->getState() : STTState::IDLE;
}

TTSState VoiceManager::getTTSState() const {
    return tts ? tts->getState() : TTSState::IDLE;
}

float VoiceManager::getCurrentAmplitude() const {
    if (isSpeaking() && decoder) {
        return decoder->getLastRms();
    }
    if (isListening() && vad) {
        return vad->getCurrentRms();
    }
    return 0.0f;
}

bool VoiceManager::speak(const char* text, const char* language, uint8_t priority, VoiceMode mode) {
    if (!text || strlen(text) == 0) return false;

    // Enqueue message into multi-message voice queue
    const char* lang = (language && strlen(language) > 0) ? language : config.ttsLanguage;
    return queue.enqueue(text, lang, priority, mode);
}

void VoiceManager::stopSpeaking() {
    queue.clear();
    if (tts) {
        tts->stop();
    }
    if (face) {
        face->setMouthAmplitude(0.0f);
    }
    Serial.println("[VoiceManager] Speech stopped and queue flushed.");
}

bool VoiceManager::isSpeaking() const {
    return tts ? tts->isPlaying() : false;
}

void VoiceManager::setVolume(uint8_t vol) {
    config.volume = (vol > 100) ? 100 : vol;
    if (audioMgr) audioMgr->setVolume(config.volume);
    if (decoder) decoder->setVolume(config.volume);
    if (storage) storage->saveVoiceConfig(config);
}

uint8_t VoiceManager::getVolume() const {
    return config.volume;
}

bool VoiceManager::updateConfig(const VoiceConfig& newConfig) {
    config = newConfig;
    if (storage) storage->saveVoiceConfig(config);
    if (audioMgr) audioMgr->setVolume(config.volume);
    if (decoder) decoder->setVolume(config.volume);
    if (stt) ((CloudSTTProvider*)stt)->setEndpoint(config.sttEndpoint);
    if (tts) ((GttsTTSProvider*)tts)->setEndpoint(config.ttsEndpoint);
    return true;
}

void VoiceManager::handleListeningLoop() {
    if (!audioHw || !vad || !audioBuffer || !stt) return;
    if (!isListening() || isProcessingSTT) return;

    // Read real microphone PCM samples in non-blocking chunks of 256 samples (16ms @ 16kHz)
    int16_t micChunk[256];
    size_t samplesRead = audioHw->readMicrophone(micChunk, 256);

    if (samplesRead > 0) {
        totalSamplesCaptured += samplesRead;
        lastMicReadMs = millis();

        // Process audio energy through Voice Activity Detection
        VADState prevVadState = vad->getState();
        VADState vadState = vad->processFrame(micChunk, samplesRead, config.sampleRate);

        if (vadState == VADState::RECORDING || vadState == VADState::SPEECH_DETECTED) {
            audioBuffer->pushSamples(micChunk, samplesRead);
        }

        // Silence detected after speech: conclude recording and trigger STT
        if (vadState == VADState::SILENCE_DETECTED || audioBuffer->isFull()) {
            if (audioBuffer->getSampleCount() > (config.sampleRate / 4)) { // At least 250ms recorded
                isProcessingSTT = true;
                vad->stop();

                Serial.printf("[VoiceManager] Speech recording complete: %u samples. Invoking STT...\n",
                              audioBuffer->getSampleCount());

                STTResult result = stt->processAudio(
                    audioBuffer->getSamples(),
                    audioBuffer->getSampleCount(),
                    config.sampleRate,
                    config.sttLanguage
                );

                if (result.success) {
                    strncpy(lastTranscript, result.transcript.c_str(), sizeof(lastTranscript) - 1);
                    Serial.printf("[VoiceManager] STT transcription: '%s' (confidence: %.2f)\n",
                                  result.transcript.c_str(), result.confidence);

                    if (transcriptCb) {
                        transcriptCb(result.transcript, result.confidence, transcriptUserData);
                    }
                } else {
                    Serial.printf("[VoiceManager] STT error: [%s] %s\n",
                                  result.errorCode.c_str(), result.errorMessage.c_str());
                }

                audioBuffer->clear();
                isProcessingSTT = false;
            } else {
                // False trigger or ambient bump: reset and resume listening
                audioBuffer->clear();
                vad->startListening();
            }
        }
    }
}

void VoiceManager::handleSpeechQueue() {
    if (!tts || isSpeaking() || queue.isEmpty()) return;

    VoiceQueueItem item;
    if (queue.dequeue(item)) {
        if (!item.cancelled && strlen(item.text) > 0) {
            tts->speak(item.text, item.language, item.mode);
        }
    }
}

void VoiceManager::update() {
    // 1. Process active speech synthesis queue
    handleSpeechQueue();

    // 2. Process microphone recording and VAD if in listening mode
    handleListeningLoop();
}

// -----------------------------------------------------------------------------
// Hardware Diagnostics (Testing real audio paths)
// -----------------------------------------------------------------------------

bool VoiceManager::testMicrophone(uint16_t durationMs, float& outRms, int16_t& outPeak) {
    if (!audioHw || !audioHw->isMicReady()) {
        outRms = 0.0f;
        outPeak = 0;
        return false;
    }

    uint32_t start = millis();
    int64_t sumSq = 0;
    size_t totalSamples = 0;
    int16_t peak = 0;

    int16_t chunk[256];
    while (millis() - start < durationMs) {
        size_t readCount = audioHw->readMicrophone(chunk, 256);
        for (size_t i = 0; i < readCount; i++) {
            int16_t val = chunk[i];
            sumSq += (int32_t)val * val;
            int16_t absVal = abs(val);
            if (absVal > peak) peak = absVal;
        }
        totalSamples += readCount;
        delay(5);
    }

    outPeak = peak;
    outRms = (totalSamples > 0) ? sqrtf((float)sumSq / (float)totalSamples) : 0.0f;

    Serial.printf("[VoiceManager] TEST_MICROPHONE: read %u samples, RMS=%.1f, Peak=%d\n",
                  totalSamples, outRms, outPeak);
    return (totalSamples > 0);
}

bool VoiceManager::testSpeaker(uint16_t freqHz, uint16_t durationMs) {
    if (!audioHw || !audioHw->isSpeakerReady()) return false;
    Serial.printf("[VoiceManager] TEST_SPEAKER: emitting %uHz calibration tone for %ums\n", freqHz, durationMs);
    audioHw->playChirp(freqHz, durationMs);
    return true;
}

bool VoiceManager::testTTS(const char* testText) {
    if (!tts) return false;
    const char* text = (testText && strlen(testText) > 0) ? testText : "TARA hardware audio pipeline operational.";
    Serial.printf("[VoiceManager] TEST_TTS: requesting speech for '%s'\n", text);
    return tts->speak(text, config.ttsLanguage, VoiceMode::NORMAL_SPEECH);
}

STTResult VoiceManager::testSTT(uint16_t recordMs) {
    STTResult res;
    res.success = false;

    if (!audioHw || !audioHw->isMicReady() || !stt || !audioBuffer) {
        res.errorCode = "MIC_UNAVAILABLE";
        res.errorMessage = "Audio hardware or STT provider not ready";
        return res;
    }

    Serial.printf("[VoiceManager] TEST_STT: capturing %ums from microphone...\n", recordMs);
    audioBuffer->clear();

    uint32_t start = millis();
    int16_t chunk[256];
    while (millis() - start < recordMs && !audioBuffer->isFull()) {
        size_t count = audioHw->readMicrophone(chunk, 256);
        if (count > 0) {
            audioBuffer->pushSamples(chunk, count);
        }
        delay(5);
    }

    Serial.printf("[VoiceManager] TEST_STT: captured %u samples. Uploading to STT service...\n",
                  audioBuffer->getSampleCount());

    res = stt->processAudio(audioBuffer->getSamples(), audioBuffer->getSampleCount(), config.sampleRate, config.sttLanguage);
    if (res.success) {
        strncpy(lastTranscript, res.transcript.c_str(), sizeof(lastTranscript) - 1);
    }
    audioBuffer->clear();
    return res;
}

String VoiceManager::getAudioDiagnosticsJson() const {
    String json = "{";
    json += "\"microphone\":\"" + String(audioHw && audioHw->isMicReady() ? "CONNECTED" : "ERROR") + "\",";
    json += "\"i2s_input\":\"" + String(isListening() ? "ACTIVE" : "IDLE") + "\",";
    json += "\"samples_captured\":" + String(totalSamplesCaptured) + ",";
    json += "\"sample_rate\":" + String(config.sampleRate) + ",";
    json += "\"vad_state\":\"" + String(vad ? vadStateToString(vad->getState()) : "IDLE") + "\",";
    json += "\"vad_rms\":" + String(vad ? vad->getCurrentRms() : 0.0f, 1) + ",";
    json += "\"stt_state\":\"" + String(sttStateToString(getSTTState())) + "\",";
    json += "\"last_transcript\":\"" + String(lastTranscript) + "\",";
    json += "\"tts_state\":\"" + String(ttsStateToString(getTTSState())) + "\",";
    json += "\"decoder_state\":\"" + String(decoder ? decoderStateToString(decoder->getState()) : "IDLE") + "\",";
    json += "\"detected_format\":\"" + String(decoder ? audioFormatToString(decoder->getDetectedFormat()) : "UNKNOWN") + "\",";
    json += "\"speaker\":\"" + String(audioHw && audioHw->isSpeakerReady() ? "CONNECTED" : "ERROR") + "\",";
    json += "\"current_amplitude\":" + String(getCurrentAmplitude(), 2) + ",";
    json += "\"voice_queue_size\":" + String(queue.size());
    json += "}";
    return json;
}
