#ifndef TARA_STT_H
#define TARA_STT_H

#include <Arduino.h>

class AudioHardware;

struct STTResult {
    bool success;
    String transcript;
    float confidence;
    String errorMessage;
};

class STTProvider {
public:
    virtual ~STTProvider() {}
    virtual bool begin() = 0;
    virtual void startListening() = 0;
    virtual void stopListening() = 0;
    virtual bool isListening() const = 0;
    virtual STTResult processAudio() = 0;
};

class CloudSTTProvider : public STTProvider {
public:
    CloudSTTProvider(AudioHardware* audioHw);
    virtual ~CloudSTTProvider();

    bool begin() override;
    void startListening() override;
    void stopListening() override;
    bool isListening() const override { return listening; }
    STTResult processAudio() override;

private:
    AudioHardware* audio;
    bool listening;
    uint32_t listeningStartMs;
};

#endif // TARA_STT_H
