#ifndef TARA_DISPLAYDRIVER_H
#define TARA_DISPLAYDRIVER_H

#include <Arduino.h>
#include <Wire.h>
#include "HardwareConfig.h"

class DisplayDriver {
public:
    static constexpr uint16_t WIDTH = 128;
    static constexpr uint16_t HEIGHT = 64;

    DisplayDriver(int8_t sdaPin = TaraPins::OLED_SDA, 
                  int8_t sclPin = TaraPins::OLED_SCL, 
                  uint8_t i2cAddr = TaraPins::OLED_I2C_ADDR);

    bool begin();
    void clear();
    void display();

    void drawPixel(int16_t x, int16_t y, uint8_t color);
    void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint8_t color);
    void fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint8_t color);
    void drawCircle(int16_t x0, int16_t y0, int16_t r, uint8_t color);
    void fillCircle(int16_t x0, int16_t y0, int16_t r, uint8_t color);
    void drawLine(int16_t x0, int16_t y0, int16_t x1, int16_t y1, uint8_t color);
    void drawString(int16_t x, int16_t y, const char* str, uint8_t size = 1);

    bool isReady() const { return initialized; }

private:
    int8_t sda;
    int8_t scl;
    uint8_t address;
    bool initialized;
    uint8_t buffer[WIDTH * HEIGHT / 8]; // 1024 bytes framebuffer

    void sendCommand(uint8_t cmd);
    void sendData(const uint8_t* data, size_t size);
};

#endif // TARA_DISPLAYDRIVER_H
