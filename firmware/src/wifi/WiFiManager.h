#ifndef TARA_WIFIMANAGER_H
#define TARA_WIFIMANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include "NetworkStatus.h"
#include "Provisioning.h"
#include "../core/TaraConfig.h"

class StorageManager;

class WiFiManager {
public:
    WiFiManager(StorageManager* storage);
    ~WiFiManager();

    bool begin();
    void update();

    bool connectSTA(const char* ssid, const char* password);
    void disconnect();
    void startProvisioningAP();

    NetworkInfo getNetworkInfo();
    WiFiState getState() const { return currentState; }
    String getLocalIPString() const;
    bool isConnected() const { return currentState == WiFiState::CONNECTED_STA; }
    bool isAPMode() const { return currentState == WiFiState::AP_MODE; }

    int scanNetworks();
    String getScannedNetworkSSID(int index);
    int32_t getScannedNetworkRSSI(int index);
    bool isScannedNetworkOpen(int index);

private:
    StorageManager* storage;
    Provisioning* provisioning;
    WiFiState currentState;
    WiFiConfig config;

    uint32_t lastCheckMs;
    uint8_t connectionAttempts;
    bool internetReachable;

    void checkConnectionHealth();
    void updateNetworkState(WiFiState newState);
};

#endif // TARA_WIFIMANAGER_H
