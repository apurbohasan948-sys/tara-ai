#include "Provisioning.h"
#include "../storage/StorageManager.h"
#include <esp_wifi.h>

Provisioning::Provisioning(StorageManager* storageMgr) 
    : storage(storageMgr), apActive(false), apIP(192, 168, 4, 1) {}

String Provisioning::generateDefaultSSID() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char buf[32];
    snprintf(buf, sizeof(buf), "TARA-Setup-%02X%02X", mac[4], mac[5]);
    return String(buf);
}

bool Provisioning::startAP(const char* customSSID, const char* password) {
    if (customSSID && strlen(customSSID) > 0) {
        currentAPSSID = String(customSSID);
    } else {
        currentAPSSID = generateDefaultSSID();
    }

    WiFi.disconnect(true);
    delay(100);

    WiFi.mode(WIFI_AP);
    IPAddress gateway(192, 168, 4, 1);
    IPAddress subnet(255, 255, 255, 0);
    WiFi.softAPConfig(apIP, gateway, subnet);

    bool ok;
    if (password && strlen(password) >= 8) {
        ok = WiFi.softAP(currentAPSSID.c_str(), password);
    } else {
        ok = WiFi.softAP(currentAPSSID.c_str()); // Open network for easy initial setup
    }

    if (ok) {
        apActive = true;
        Serial.printf("[Provisioning] AP started: %s (IP: %s)\n",
                      currentAPSSID.c_str(),
                      WiFi.softAPIP().toString().c_str());
    } else {
        Serial.println("[Provisioning] Failed to start SoftAP!");
    }
    return ok;
}

void Provisioning::stopAP() {
    if (apActive) {
        WiFi.softAPdisconnect(true);
        apActive = false;
        Serial.println("[Provisioning] AP stopped.");
    }
}

bool Provisioning::testAndSaveCredentials(const char* ssid, const char* password, String& outError) {
    if (!ssid || strlen(ssid) == 0) {
        outError = "SSID cannot be empty";
        return false;
    }

    Serial.printf("[Provisioning] Testing connection to '%s'...\n", ssid);
    
    // Temporarily switch to AP+STA to test station credentials without dropping client AP
    WiFi.mode(WIFI_AP_STA);
    WiFi.begin(ssid, password);

    uint32_t startMs = millis();
    wl_status_t status = WiFi.status();
    while (status != WL_CONNECTED && millis() - startMs < 12000) {
        delay(300);
        status = WiFi.status();
        Serial.print(".");
    }
    Serial.println();

    if (status == WL_CONNECTED) {
        Serial.printf("[Provisioning] Connected successfully! LAN IP: %s\n",
                      WiFi.localIP().toString().c_str());

        // Save credentials to NVS
        WiFiConfig conf;
        memset(&conf, 0, sizeof(WiFiConfig));
        strncpy(conf.ssid, ssid, sizeof(conf.ssid) - 1);
        if (password) {
            strncpy(conf.password, password, sizeof(conf.password) - 1);
        }
        conf.autoConnect = true;
        conf.retryCount = 10;

        if (storage) {
            storage->saveWiFiConfig(conf);
        }

        return true;
    } else {
        outError = "Failed to connect to Wi-Fi. Check SSID/Password.";
        Serial.println("[Provisioning] Connection test failed.");
        return false;
    }
}
