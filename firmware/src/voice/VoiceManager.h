#ifndef TARA_VOICEMANAGER_H
#define TARA_VOICEMANAGER_H

#include <Arduino.h>
#include "STT.h"
#include "TTS.h"
#include "AudioManager.h"
#include "../core/TaraConfig.h"

class StorageManager;
class AudioHardware;

class VoiceManager {
public:
    VoiceManager(StorageManager* storage, AudioHardware* audioHw);
    ~VoiceManager();

    bool begin();
    void update();

    void startListening();
    void stopListening();
    bool isListening() const;

    bool speak(const char* text);
    void stopSpeaking();
    bool isSpeaking() const;

    void setVolume(uint8_t volume);
    uint8_t getVolume() const;

    VoiceConfig getConfig() const { return config; }
    bool updateConfig(const VoiceConfig& newConfig);

    AudioManager* getAudio() { return audioMgr; }

private:
    StorageManager* storage;
    AudioHardware* audioHw;
    AudioManager* audioMgr;
    STTProvider* stt;
    TTSProvider* tts;
    VoiceConfig config;
};

#endif // TARA_VOICEMANAGER_H
