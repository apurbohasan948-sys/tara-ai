#ifndef TARA_VOICEMANAGER_H
#define TARA_VOICEMANAGER_H

#include <Arduino.h>
#include "STT.h"
#include "TTS.h"
#include "VAD.h"
#include "AudioBuffer.h"
#include "AudioDecoder.h"
#include "VoiceQueue.h"
#include "AudioManager.h"
#include "../core/TaraConfig.h"

class StorageManager;
class AudioHardware;
class FaceManager;

typedef void (*TranscriptCallback)(const String& transcript, float confidence, void* userData);

class VoiceManager {
public:
    VoiceManager(StorageManager* storage, AudioHardware* audioHw);
    ~VoiceManager();

    bool begin();
    void update();

    // Listening / Speech-to-Text
    void startListening();
    void stopListening();
    bool isListening() const;
    STTState getSTTState() const;
    const char* getLastTranscript() const { return lastTranscript; }

    // Speech synthesis / Playback
    bool speak(const char* text, const char* language = nullptr, uint8_t priority = 1, VoiceMode mode = VoiceMode::NORMAL_SPEECH);
    void stopSpeaking();
    bool isSpeaking() const;
    TTSState getTTSState() const;

    // Volume & Configuration
    void setVolume(uint8_t volume);
    uint8_t getVolume() const;
    VoiceConfig getConfig() const { return config; }
    bool updateConfig(const VoiceConfig& newConfig);

    // Audio amplitude for Face / Mouth synchronization
    float getCurrentAmplitude() const;
    void setFaceManager(FaceManager* faceMgr);
    void setTranscriptCallback(TranscriptCallback cb, void* userData);

    // Hardware Diagnostics
    bool testMicrophone(uint16_t durationMs, float& outRms, int16_t& outPeak);
    bool testSpeaker(uint16_t freqHz = 1000, uint16_t durationMs = 250);
    bool testTTS(const char* testText);
    STTResult testSTT(uint16_t recordMs = 3000);

    // Diagnostics Telemetry for Web Dashboard Audio Debug Panel
    String getAudioDiagnosticsJson() const;

    // Accessors
    AudioManager* getAudio() { return audioMgr; }
    AudioHardware* getHardware() { return audioHw; }
    VADDetector* getVAD() { return vad; }
    AudioDecoder* getDecoder() { return decoder; }
    ISTTProvider* getSTT() { return stt; }
    ITTSProvider* getTTS() { return tts; }
    VoiceQueue* getQueue() { return &queue; }

private:
    StorageManager* storage;
    AudioHardware* audioHw;
    AudioManager* audioMgr;
    AudioBuffer* audioBuffer;
    VADDetector* vad;
    AudioDecoder* decoder;
    ISTTProvider* stt;
    ITTSProvider* tts;
    VoiceQueue queue;
    VoiceConfig config;

    FaceManager* face;
    TranscriptCallback transcriptCb;
    void* transcriptUserData;

    char lastTranscript[128];
    uint32_t totalSamplesCaptured;
    uint32_t lastMicReadMs;
    bool isProcessingSTT;

    void handleListeningLoop();
    void handleSpeechQueue();
};

#endif // TARA_VOICEMANAGER_H
