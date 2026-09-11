#ifndef TARA_STT_H
#define TARA_STT_H

#include <Arduino.h>

class AudioHardware;

enum class STTState : uint8_t {
    IDLE = 0,
    LISTENING,
    RECORDING,
    PROCESSING,
    COMPLETED,
    ERROR
};

const char* sttStateToString(STTState state);

struct STTResult {
    bool success;
    String transcript;
    float confidence;
    String errorCode;
    String errorMessage;
};

class ISTTProvider {
public:
    virtual ~ISTTProvider() {}
    virtual bool begin() = 0;
    virtual void startListening() = 0;
    virtual void stopListening() = 0;
    virtual bool isListening() const = 0;
    virtual STTResult processAudio(const int16_t* pcmBuffer, size_t sampleCount, uint32_t sampleRate = 16000, const char* language = "en-US") = 0;
    virtual STTState getState() const = 0;
    virtual const char* getName() const = 0;
};

// Real Cloud-based Speech-to-Text Provider
class CloudSTTProvider : public ISTTProvider {
public:
    CloudSTTProvider(AudioHardware* audioHw, const char* endpoint = nullptr);
    virtual ~CloudSTTProvider();

    bool begin() override;
    void startListening() override;
    void stopListening() override;
    bool isListening() const override { return state == STTState::LISTENING || state == STTState::RECORDING; }
    STTResult processAudio(const int16_t* pcmBuffer, size_t sampleCount, uint32_t sampleRate = 16000, const char* language = "en-US") override;
    STTState getState() const override { return state; }
    const char* getName() const override { return "CloudSTTProvider"; }

    void setEndpoint(const char* url);
    void setApiKey(const char* key);

private:
    AudioHardware* audio;
    STTState state;
    char sttEndpoint[128];
    char apiKey[96];

    STTResult parseCloudResponse(int httpCode, const String& responseBody);
};

#endif // TARA_STT_H
