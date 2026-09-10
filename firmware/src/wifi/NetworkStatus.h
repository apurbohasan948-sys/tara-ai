#ifndef TARA_NETWORKSTATUS_H
#define TARA_NETWORKSTATUS_H

#include <Arduino.h>
#include <WiFi.h>

enum class WiFiState : uint8_t {
    DISCONNECTED = 0,
    CONNECTING,
    CONNECTED_STA,
    AP_MODE,
    ERROR
};

struct NetworkInfo {
    WiFiState state;
    IPAddress localIP;
    IPAddress gatewayIP;
    IPAddress subnetMask;
    int32_t rssi;
    char ssid[33];
    char bssid[18];
    char macAddress[18];
    bool hasInternet;
};

const char* wifiStateToString(WiFiState state);

#endif // TARA_NETWORKSTATUS_H
