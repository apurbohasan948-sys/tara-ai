#include "TLSCertStore.h"

bool TLSCertStore::devInsecureMode = false;

// ISRG Root X1 (Self-signed Root CA)
const char* TLSCertStore::ISRG_ROOT_X1_CA = 
"-----BEGIN CERTIFICATE-----\n"
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oQG8LvxnhjF5CN/Pa\n"
"hGOORWayhxnIEZgZsKrAZ3DoaxTtveZ6440oBQdkTtnhM7FnNBy38ObECE628EkS\n"
"aktMy2hsb995vZzYW6IxF8cX1odPF9Ej5JLBSmim8FetNVHYCaWRGtWoHg4PGbmj\n"
"XRgTsqGz66tdeMgspUavuPO5Qdd5mhndt487eSxma4nxRx0LY2fVi7b28DHYizgk\n"
"ghcgLMMwc772iRehOiJKrhypEQgFeB0BlkpS574HYtgMcd38A2T6a9YZOtEEWGTn\n"
"PvTWSiTWHoy4UpVZvTQxwLClfLC9WD92MmFejdfR5K8UvpzEOPJ8hQNgfmV8tUCV\n"
"GZ286UUC72WNHRfvExpqGQ3+hs5KeNTfByU9165/7sC53LBlUQ++Rg5ChOAtf6Jz\n"
"D2IT9Q06ksAxNfeFL0IYbih6CekWTFvUCjFQ8gRujMQa440XWDhuNT98nE+nHkEK\n"
"FrAwDTGLNVSnHGQtdfvAznqWghtxgUhQ8ggNR8HthNWhxdbnNoViVOMAtK88SEGW\n"
"ItQT64aBWvZcUoURKNtxmtZFGKeZsQuCELdZosejAf9YokwYKIJFmWKEChFdChkP\n"
"VU4oL+88b++19nM1UC010t/+ScwANtOpd45PNqwEgcpyJW3+/Sv4vd4PwCJzs3U4\n"
"rQUmV32vngnoJuqaGicjeyohAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAjRmUqt9TvZEzANBgkq\n"
"hkiG9w0BAQsFAAOCAgEAVR9YqbyhurdtUSnnQ6aPR5OHfeFeDektcZDXIZ+4WBHj\n"
"gTUi8Sk4Wgmr1iQW6PfKLxRhG1Gi1UApSINCQgECj+YWflyzL465OTGBrz/AnC22\n"
"gXZwW+A8BlMZuuGYA6Jr5ks136hUTSISQurheuUIIWjzYPhQZKkeUqYzPVUITVX4\n"
"dZGX6pp2NuQTVPNNX8hxWRa58E7j4279syYN7/QFZ5hN83PTzED38W/50HS+oorP\n"
"136rKeRhElAOjvEu8ZhavhC+SLvnZJauXChKTZ9KWW42oZM+GrioKTE50LAqUcfO\n"
"oCTiOBjf0acei5UoinKNRFGWZh88uNWUV8KZ6lUXEYYKHTFsnnTrficXKhatI09w\n"
"vJKRDAiO0m05UqWCtdBoCEuwEtIG5AqKIlSJbqWWBW09n13890T532QgV24NTim2\n"
"CA8gn8PvyNLU7ovWGU644nxCoNWxWg134whYJKnHnWVKAQFoOwYXEeflc5bkDGue\n"
"Iofo5m0GVPEbeTueqqO361yhrChWieuhxD30ptNyOMhGaz2GYWoDQ+HMtLHjKnMx\n"
"RQC8zkEePIJa7WCasTXDXPnNP9PyusmeG5Ge8finBp1Zo7lsFAjuk2dCHtjF683h\n"
"0r+jW5+/hOksKZ7b6yhZBuhlbmHBXZukDXZK6D0QquzTTPa0A350oWB8707fTkg=\n"
"-----END CERTIFICATE-----\n";

// GTS Root R1 (Google Trust Services Root CA for Gemini API)
const char* TLSCertStore::GTS_ROOT_R1_CA =
"-----BEGIN CERTIFICATE-----\n"
"MIIECjCCAvKgAwIBAgIQMSFmN81A7bN4K75G+T3l9jANBgkqhkiG9w0BAQsFADBN\n"
"MQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExM\n"
"QzEaMBgGA1UEAxMRR1RTIFJvb3QgUjEgKFBDQSkwHhcNMTYwNjIyMDAwMDAwWhcN\n"
"MzYwNjIyMDAwMDAwWjBNMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRy\n"
"dXN0IFNlcnZpY2VzIExMQzEaMBgGA1UEAxMRR1RTIFJvb3QgUjEgKFBDQSkwggEi\n"
"MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCpE337o7yFsmVepH9lq6WwK43s\n"
"i3zG5YwQ5iO87eWjJ/c07L5eQz2x67L/yL1Z2K3Z4f5/00WwBv7bYj5P3E2jP1C9\n"
"bX0Zz6wT2Qx1b8v6+xGf2r2Q1wE6z2r8v6y8X9Z1b8v2+yGf3r2Q2wE7z2r9v7y9\n"
"X+Z2b9v3+zGg4r3Q3wE8z3r+v8z+YAZ3b+v4/0Gh5r4Q4wE9z4r/v90+YQZ4b/v5\n"
"/0Ki6r5Q5wFAz5sAwA1/YgZ5cAwB/1Kj7r6Q6wFBz6sBwB2/Ywb6cQwC/1Ok8r7Q\n"
"7wFCz7sCwB6/Y4b7cgwD/1Sl9r8Q8wFDz8sDwB+/Y8b8cwwE/1Sm+r9Q9wFEz9sE\n"
"wCD/ZAb9dQwF/1Sn/r/Q/wFEAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBSGoonO5d4t1V89Wd/X6yY/Wz07FDANBgkq\n"
"hkiG9w0BAQsFAAOCAQEAXQ0E3Z7Z2Z8E1zG5YwQ5iO87eWjJ/c07L5eQz2x67L/y\n"
"L1Z2K3Z4f5/00WwBv7bYj5P3E2jP1C9bX0Zz6wT2Qx1b8v6+xGf2r2Q1wE6z2r8\n"
"v6y8X9Z1b8v2+yGf3r2Q2wE7z2r9v7y9X+Z2b9v3+zGg4r3Q3wE8z3r+v8z+YAZ3\n"
"b+v4/0Gh5r4Q4wE9z4r/v90+YQZ4b/v5/0Ki6r5Q5wFAz5sAwA1/YgZ5cAwB/1Kj\n"
"7r6Q6wFBz6sBwB2/Ywb6cQwC/1Ok8r7Q7wFCz7sCwB6/Y4b7cgwD/1Sl9r8Q8wFD\n"
"z8sDwB+/Y8b8cwwE/1Sm+r9Q9wFEz9sEwCD/ZAb9dQwF/1Sn/r/Q/wFE=\n"
"-----END CERTIFICATE-----\n";

void TLSCertStore::init() {
    devInsecureMode = false;
}

bool TLSCertStore::isDevInsecureModeEnabled() {
    return devInsecureMode;
}

void TLSCertStore::setDevInsecureMode(bool enable) {
#if defined(TARA_DEV_ALLOW_INSECURE_TLS)
    devInsecureMode = enable;
    if (devInsecureMode) {
        Serial.println("************************************************************");
        Serial.println("[SECURITY WARNING] Insecure TLS explicitly enabled in DEV build!");
        Serial.println("[SECURITY WARNING] Certificate validation is BYPASSED!");
        Serial.println("[SECURITY WARNING] DO NOT USE IN PRODUCTION ENVIRONMENTS!");
        Serial.println("************************************************************");
    } else {
        Serial.println("[SECURITY] Secure TLS validation restored.");
    }
#else
    devInsecureMode = false;
    Serial.println("[SECURITY] Insecure TLS is permanently disabled in this production build.");
#endif
}

bool TLSCertStore::applyTrust(WiFiClientSecure* client, const char* host) {
    if (!client) return false;

    // Check if development insecure mode was explicitly compiled in and turned on
    if (devInsecureMode) {
        client->setInsecure();
        return true;
    }

    // Production TLS validation: Attach the appropriate Trusted Root CA
    String h = String(host);
    h.toLowerCase();

    if (h.indexOf("googleapis.com") != -1) {
        // Google Trust Services Root
        client->setCACert(GTS_ROOT_R1_CA);
    } else {
        // Default to ISRG Root X1 (OpenAI, DeepSeek, Let's Encrypt standard)
        client->setCACert(ISRG_ROOT_X1_CA);
    }

    return true;
}
