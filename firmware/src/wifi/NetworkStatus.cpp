#include "NetworkStatus.h"

const char* wifiStateToString(WiFiState state) {
    switch (state) {
        case WiFiState::DISCONNECTED:   return "DISCONNECTED";
        case WiFiState::CONNECTING:     return "CONNECTING";
        case WiFiState::CONNECTED_STA:  return "CONNECTED_STA";
        case WiFiState::AP_MODE:        return "AP_MODE";
        case WiFiState::ERROR:          return "ERROR";
        default:                        return "UNKNOWN";
    }
}
