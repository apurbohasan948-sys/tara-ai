#include "AudioHardware.h"
#include <math.h>

AudioHardware::AudioHardware(int8_t bclk, int8_t lrc, int8_t dout, int8_t din)
    : bclkPin(bclk),
      lrcPin(lrc),
      doutPin(dout),
      dinPin(din),
      volume(80),
      micInitialized(false),
      speakerInitialized(false) {}

AudioHardware::~AudioHardware() {
    i2s_driver_uninstall(I2S_NUM_0);
}

bool AudioHardware::begin(uint32_t sampleRate) {
    // Configure standard ESP32 I2S driver for I2S_NUM_0
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX | I2S_MODE_RX),
        .sample_rate = sampleRate,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = 256,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = bclkPin,
        .ws_io_num = lrcPin,
        .data_out_num = doutPin,
        .data_in_num = dinPin
    };

    esp_err_t err = i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("[AudioHardware] Failed to install I2S driver: %d\n", err);
        return false;
    }

    err = i2s_set_pin(I2S_NUM_0, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("[AudioHardware] Failed to set I2S pins: %d\n", err);
        return false;
    }

    speakerInitialized = (doutPin >= 0);
    micInitialized = (dinPin >= 0);

    Serial.printf("[AudioHardware] I2S Audio ready (BCLK=%d, LRC=%d, DOUT=%d, DIN=%d)\n",
                  bclkPin, lrcPin, doutPin, dinPin);
    return true;
}

void AudioHardware::setVolume(uint8_t vol) {
    volume = (vol > 100) ? 100 : vol;
}

size_t AudioHardware::writeAudio(const uint8_t* pcmData, size_t bytes) {
    if (!speakerInitialized || !pcmData) return 0;
    size_t bytesWritten = 0;
    i2s_write(I2S_NUM_0, pcmData, bytes, &bytesWritten, portMAX_DELAY);
    return bytesWritten;
}

size_t AudioHardware::readMicrophone(int16_t* buffer, size_t samples) {
    if (!micInitialized || !buffer) return 0;
    size_t bytesRead = 0;
    i2s_read(I2S_NUM_0, (char*)buffer, samples * sizeof(int16_t), &bytesRead, 100 / portTICK_PERIOD_MS);
    return bytesRead / sizeof(int16_t);
}

void AudioHardware::playChirp(uint16_t freqHz, uint16_t durationMs) {
    if (!speakerInitialized) return;

    const uint32_t sampleRate = 16000;
    size_t totalSamples = (sampleRate * durationMs) / 1000;
    int16_t chunk[128 * 2]; // stereo buffer

    float phase = 0.0f;
    float phaseInc = (2.0f * 3.14159265f * freqHz) / sampleRate;
    float gain = (float)volume / 100.0f * 12000.0f;

    size_t sent = 0;
    while (sent < totalSamples) {
        size_t toWrite = fminf(128, totalSamples - sent);
        for (size_t i = 0; i < toWrite; i++) {
            int16_t s = (int16_t)(sinf(phase) * gain);
            chunk[i * 2] = s;     // Left
            chunk[i * 2 + 1] = s; // Right
            phase += phaseInc;
            if (phase > 2.0f * 3.14159265f) phase -= 2.0f * 3.14159265f;
        }
        writeAudio((const uint8_t*)chunk, toWrite * 2 * sizeof(int16_t));
        sent += toWrite;
    }
}

void AudioHardware::playStateSound(uint8_t soundId) {
    switch (soundId) {
        case 1: // Listening wake beep
            playChirp(880, 80);
            delay(40);
            playChirp(1320, 100);
            break;
        case 2: // Happy chirp
            playChirp(587, 60);
            playChirp(740, 60);
            playChirp(880, 120);
            break;
        case 3: // Error boop
            playChirp(350, 150);
            delay(50);
            playChirp(260, 200);
            break;
        default:
            playChirp(1000, 50);
            break;
    }
}
