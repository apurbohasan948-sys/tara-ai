#include "OTAManager.h"

OTAManager::OTAManager()
    : status(OTAStatus::IDLE),
      progressPercent(0),
      expectedBytes(0),
      writtenBytes(0) {
    lastError[0] = '\0';
}

bool OTAManager::begin() {
    Serial.printf("[OTAManager] OTA manager ready. Running firmware: %s\n", TARA_VERSION_STRING);
    return true;
}

void OTAManager::update() {}

bool OTAManager::startStreamUpdate(size_t totalBytes) {
    status = OTAStatus::FLASHING;
    expectedBytes = totalBytes;
    writtenBytes = 0;
    progressPercent = 0;
    lastError[0] = '\0';

    if (!Update.begin(totalBytes, U_FLASH)) {
        status = OTAStatus::FAILED;
        snprintf(lastError, sizeof(lastError), "Update.begin failed: %s", Update.errorString());
        Serial.printf("[OTAManager] %s\n", lastError);
        return false;
    }

    Serial.printf("[OTAManager] Starting OTA flash of %u bytes...\n", totalBytes);
    return true;
}

bool OTAManager::writeStreamChunk(const uint8_t* data, size_t len) {
    if (status != OTAStatus::FLASHING) return false;

    size_t written = Update.write((uint8_t*)data, len);
    if (written != len) {
        status = OTAStatus::FAILED;
        snprintf(lastError, sizeof(lastError), "Flash write error: %s", Update.errorString());
        Serial.printf("[OTAManager] %s\n", lastError);
        return false;
    }

    writtenBytes += written;
    if (expectedBytes > 0) {
        progressPercent = (uint8_t)((writtenBytes * 100) / expectedBytes);
    }
    return true;
}

bool OTAManager::endStreamUpdate() {
    if (status != OTAStatus::FLASHING) return false;

    if (!Update.end(true)) {
        status = OTAStatus::FAILED;
        snprintf(lastError, sizeof(lastError), "Update finalize failed: %s", Update.errorString());
        Serial.printf("[OTAManager] %s\n", lastError);
        return false;
    }

    if (!Update.isFinished()) {
        status = OTAStatus::FAILED;
        strncpy(lastError, "Update not finished properly", sizeof(lastError) - 1);
        return false;
    }

    status = OTAStatus::SUCCESS;
    progressPercent = 100;
    Serial.println("[OTAManager] Firmware flashed successfully! Ready to restart.");
    return true;
}
