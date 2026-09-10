#ifndef TARA_OTAMANAGER_H
#define TARA_OTAMANAGER_H

#include <Arduino.h>
#include <Update.h>
#include "../../include/TaraCommon.h"

enum class OTAStatus : uint8_t {
    IDLE = 0,
    CHECKING,
    DOWNLOADING,
    FLASHING,
    SUCCESS,
    FAILED
};

class OTAManager {
public:
    OTAManager();

    bool begin();
    void update();

    const char* getFirmwareVersion() const { return TARA_VERSION_STRING; }
    OTAStatus getStatus() const { return status; }
    uint8_t getProgressPercent() const { return progressPercent; }
    const char* getLastError() const { return lastError; }

    bool startStreamUpdate(size_t totalBytes);
    bool writeStreamChunk(const uint8_t* data, size_t len);
    bool endStreamUpdate();

private:
    OTAStatus status;
    uint8_t progressPercent;
    char lastError[64];
    size_t expectedBytes;
    size_t writtenBytes;
};

#endif // TARA_OTAMANAGER_H
