#include "WiFiManager.h"
#include "../storage/StorageManager.h"
#include "../core/EventBus.h"

WiFiManager::WiFiManager(StorageManager* storageMgr)
    : storage(storageMgr),
      provisioning(nullptr),
      currentState(WiFiState::DISCONNECTED),
      lastCheckMs(0),
      connectionAttempts(0),
      internetReachable(false) {
    provisioning = new Provisioning(storageMgr);
}

WiFiManager::~WiFiManager() {
    if (provisioning) {
        delete provisioning;
    }
}

bool WiFiManager::begin() {
    Serial.println("[WiFiManager] Initializing Wi-Fi...");

    if (!storage->hasWiFiCredentials()) {
        Serial.println("[WiFiManager] No saved credentials found. Starting Provisioning AP mode.");
        startProvisioningAP();
        return true;
    }

    if (storage->loadWiFiConfig(config) && strlen(config.ssid) > 0) {
        Serial.printf("[WiFiManager] Found saved credentials for SSID: '%s'\n", config.ssid);
        return connectSTA(config.ssid, config.password);
    } else {
        startProvisioningAP();
        return true;
    }
}

void WiFiManager::startProvisioningAP() {
    updateNetworkState(WiFiState::AP_MODE);
    provisioning->startAP();
    
    EventData data;
    data.type = EventType::WIFI_AP_STARTED;
    data.message = provisioning->getAPSSID().c_str();
    GlobalEventBus.publish(data);
}

bool WiFiManager::connectSTA(const char* ssid, const char* password) {
    updateNetworkState(WiFiState::CONNECTING);
    provisioning->stopAP();

    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false); // Disable Wi-Fi modem sleep for lower latency
    WiFi.begin(ssid, password);

    Serial.printf("[WiFiManager] Connecting to '%s'", ssid);
    uint32_t startMs = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startMs < 10000) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        updateNetworkState(WiFiState::CONNECTED_STA);
        Serial.printf("[WiFiManager] Connected! Local IP: %s\n", WiFi.localIP().toString().c_str());

        EventData data;
        data.type = EventType::WIFI_CONNECTED;
        data.message = WiFi.localIP().toString().c_str();
        GlobalEventBus.publish(data);
        return true;
    } else {
        connectionAttempts++;
        Serial.printf("[WiFiManager] Connection attempt %d failed.\n", connectionAttempts);
        if (connectionAttempts >= 3) {
            Serial.println("[WiFiManager] Max attempts reached. Falling back to Provisioning AP.");
            startProvisioningAP();
        } else {
            updateNetworkState(WiFiState::ERROR);
        }
        return false;
    }
}

void WiFiManager::disconnect() {
    WiFi.disconnect(true);
    updateNetworkState(WiFiState::DISCONNECTED);
}

void WiFiManager::update() {
    uint32_t now = millis();
    if (now - lastCheckMs > 5000) {
        lastCheckMs = now;
        checkConnectionHealth();
    }
}

void WiFiManager::checkConnectionHealth() {
    if (currentState == WiFiState::CONNECTED_STA) {
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[WiFiManager] Lost connection to router!");
            updateNetworkState(WiFiState::DISCONNECTED);
            
            EventData data;
            data.type = EventType::WIFI_DISCONNECTED;
            data.message = "Lost connection";
            GlobalEventBus.publish(data);

            // Try auto-reconnect
            connectSTA(config.ssid, config.password);
        }
    }
}

void WiFiManager::updateNetworkState(WiFiState newState) {
    if (currentState != newState) {
        Serial.printf("[WiFiManager] State: %s -> %s\n",
                      wifiStateToString(currentState),
                      wifiStateToString(newState));
        currentState = newState;
    }
}

String WiFiManager::getLocalIPString() const {
    if (currentState == WiFiState::CONNECTED_STA) {
        return WiFi.localIP().toString();
    } else if (currentState == WiFiState::AP_MODE) {
        return WiFi.softAPIP().toString();
    }
    return "0.0.0.0";
}

NetworkInfo WiFiManager::getNetworkInfo() {
    NetworkInfo info;
    info.state = currentState;
    
    if (currentState == WiFiState::CONNECTED_STA) {
        info.localIP = WiFi.localIP();
        info.gatewayIP = WiFi.gatewayIP();
        info.subnetMask = WiFi.subnetMask();
        info.rssi = WiFi.RSSI();
        strncpy(info.ssid, WiFi.SSID().c_str(), sizeof(info.ssid) - 1);
        strncpy(info.bssid, WiFi.BSSIDstr().c_str(), sizeof(info.bssid) - 1);
        strncpy(info.macAddress, WiFi.macAddress().c_str(), sizeof(info.macAddress) - 1);
        info.hasInternet = (info.localIP[0] != 0);
    } else if (currentState == WiFiState::AP_MODE) {
        info.localIP = WiFi.softAPIP();
        info.gatewayIP = WiFi.softAPIP();
        info.subnetMask = IPAddress(255, 255, 255, 0);
        info.rssi = 0;
        if (provisioning) {
            strncpy(info.ssid, provisioning->getAPSSID().c_str(), sizeof(info.ssid) - 1);
        }
        strncpy(info.macAddress, WiFi.macAddress().c_str(), sizeof(info.macAddress) - 1);
        info.hasInternet = false;
    } else {
        info.localIP = IPAddress(0, 0, 0, 0);
        info.rssi = -100;
        info.hasInternet = false;
    }
    return info;
}

int WiFiManager::scanNetworks() {
    return WiFi.scanNetworks();
}

String WiFiManager::getScannedNetworkSSID(int index) {
    return WiFi.SSID(index);
}

int32_t WiFiManager::getScannedNetworkRSSI(int index) {
    return WiFi.RSSI(index);
}

bool WiFiManager::isScannedNetworkOpen(int index) {
    return (WiFi.encryptionType(index) == WIFI_AUTH_OPEN);
}
