#ifndef TARA_PROVISIONING_H
#define TARA_PROVISIONING_H

#include <Arduino.h>
#include <WiFi.h>
#include "../core/TaraConfig.h"

class StorageManager;

class Provisioning {
public:
    Provisioning(StorageManager* storage);
    
    bool startAP(const char* customSSID = nullptr, const char* password = nullptr);
    void stopAP();
    bool isAPActive() const { return apActive; }
    
    String getAPSSID() const { return currentAPSSID; }
    IPAddress getAPIP() const { return apIP; }

    bool testAndSaveCredentials(const char* ssid, const char* password, String& outError);

private:
    StorageManager* storage;
    bool apActive;
    String currentAPSSID;
    IPAddress apIP;

    String generateDefaultSSID();
};

#endif // TARA_PROVISIONING_H
