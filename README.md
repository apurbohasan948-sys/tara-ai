# TARA - Modular AI Companion Robot Framework (v0.1.0)

> Physical AI Companion Robot Framework engineered specifically for standard dual-core ESP32.

## Quick Links
- **ESP32 Firmware Source:** `/firmware/`
- **Firmware README & Pinout:** `/firmware/README.md`
- **PlatformIO Config:** `/firmware/platformio.ini`
- **Arduino Sketch Entry:** `/firmware/TARA.ino`

## Key Capabilities
- **Strict Standard ESP32 Target:** Tailored for 520KB SRAM, dual-core Xtensa LX6 @ 240MHz. No ESP32-S3 or PSRAM dependencies.
- **First-Boot AP Provisioning:** Automatic SoftAP mode when unconfigured (`192.168.4.1`) -> transition to home Wi-Fi station mode (`http://<ESP32_LOCAL_IP>`).
- **Web Configuration System:** Onboard responsive companion UI across 11 modules (Dashboard, Wi-Fi, Brain, Voice, Personality, Memory, Face, Hardware, Cloud, System, OTA).
- **Expressive Procedural Face:** 128x64 OLED eye animations with blinking eyelids, natural saccadic glances, smiling/sad arcs, thinking orbits, listening sound waves.
- **Decoupled Architecture:** EventBus decouples the RobotState engine from Face, Voice, Brain, Emotion, and Web subsystems.
- **Voice Pipeline:** I2S Audio Hardware abstraction (INMP441 + MAX98357A) + gTTS streaming synthesis interface.
- **Model Router:** Cloud Model Provider (OpenAI / Gemini / Custom proxy) and Local Network LLM (Ollama) support with non-volatile secret storage.
