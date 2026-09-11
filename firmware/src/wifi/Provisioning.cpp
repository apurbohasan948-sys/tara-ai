#include "Provisioning.h"
#include "../storage/StorageManager.h"
#include <esp_wifi.h>
#include <esp_system.h>
#include <Preferences.h>

Provisioning::Provisioning(StorageManager* storageMgr) 
    : storage(storageMgr), apActive(false), apIP(192, 168, 4, 1) {}

String Provisioning::generateDefaultSSID() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char buf[32];
    snprintf(buf, sizeof(buf), "TARA-Setup-%02X%02X", mac[4], mac[5]);
    return String(buf);
}

String Provisioning::generateSecurePassphrase() {
    // Read or generate a secure, non-predictable 10-char WPA2 passphrase
    Preferences prefs;
    prefs.begin("tara_sec", false);
    String pass = prefs.getString("ap_pass", "");
    if (pass.length() >= 8) {
        prefs.end();
        return pass;
    }

    // Generate random alphanumeric passphrase (using hardware RNG)
    const char charset[] = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    char gen[11];
    for (int i = 0; i < 10; i++) {
        uint32_t r = esp_random() % (sizeof(charset) - 1);
        gen[i] = charset[r];
    }
    gen[10] = '\0';
    pass = String(gen);

    prefs.putString("ap_pass", pass);
    prefs.end();
    return pass;
}

bool Provisioning::startAP(const char* customSSID, const char* customPass) {
    if (customSSID && strlen(customSSID) > 0) {
        currentAPSSID = String(customSSID);
    } else {
        currentAPSSID = generateDefaultSSID();
    }

    if (customPass && strlen(customPass) >= 8) {
        currentAPPass = String(customPass);
    } else {
        currentAPPass = generateSecurePassphrase();
    }

    WiFi.disconnect(true);
    delay(100);

    WiFi.mode(WIFI_AP);
    IPAddress gateway(192, 168, 4, 1);
    IPAddress subnet(255, 255, 255, 0);
    WiFi.softAPConfig(apIP, gateway, subnet);

    // Strictly enforce WPA2 passphrase - never start an open unencrypted network!
    bool ok = WiFi.softAP(currentAPSSID.c_str(), currentAPPass.c_str(), 1, 0, 4); // WPA2-PSK

    if (ok) {
        apActive = true;
        Serial.println("=================================================");
        Serial.printf("[Provisioning] WPA2 Secure AP Started: %s\n", currentAPSSID.c_str());
        Serial.printf("[Provisioning] AP Password: %s\n", currentAPPass.c_str());
        Serial.printf("[Provisioning] Setup URL: http://%s\n", WiFi.softAPIP().toString().c_str());
        Serial.println("[Provisioning] (Credentials displayed locally on robot screen)");
        Serial.println("=================================================");
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
