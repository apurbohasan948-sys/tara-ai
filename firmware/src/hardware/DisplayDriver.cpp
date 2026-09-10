#include "DisplayDriver.h"
#include <string.h>

DisplayDriver::DisplayDriver(int8_t sdaPin, int8_t sclPin, uint8_t i2cAddr)
    : sda(sdaPin), scl(sclPin), address(i2cAddr), initialized(false) {
    memset(buffer, 0, sizeof(buffer));
}

void DisplayDriver::sendCommand(uint8_t cmd) {
    Wire.beginTransmission(address);
    Wire.write(0x00); // Command stream
    Wire.write(cmd);
    Wire.endTransmission();
}

void DisplayDriver::sendData(const uint8_t* data, size_t size) {
    Wire.beginTransmission(address);
    Wire.write(0x40); // Data stream
    for (size_t i = 0; i < size; i++) {
        Wire.write(data[i]);
    }
    Wire.endTransmission();
}

bool DisplayDriver::begin() {
    Wire.begin(sda, scl, 400000); // 400kHz I2C clock for smooth 30+ FPS rendering

    // Check if device responds
    Wire.beginTransmission(address);
    if (Wire.endTransmission() != 0) {
        Serial.printf("[DisplayDriver] OLED not detected at 0x%02X (pins SDA=%d, SCL=%d)\n", address, sda, scl);
        return false;
    }

    // SSD1306 128x64 standard initialization commands
    sendCommand(0xAE); // Display off
    sendCommand(0xD5); // Set display clock divide ratio
    sendCommand(0x80);
    sendCommand(0xA8); // Set multiplex ratio
    sendCommand(0x3F); // 64MUX
    sendCommand(0xD3); // Set display offset
    sendCommand(0x00);
    sendCommand(0x40); // Set start line
    sendCommand(0x8D); // Charge pump
    sendCommand(0x14); // Enable charge pump
    sendCommand(0x20); // Memory addressing mode
    sendCommand(0x00); // Horizontal addressing mode
    sendCommand(0xA1); // Segment re-map (col 127 mapped to SEG0)
    sendCommand(0xC8); // COM output scan direction
    sendCommand(0xDA); // Set COM pins hardware configuration
    sendCommand(0x12);
    sendCommand(0x81); // Set contrast control
    sendCommand(0xCF);
    sendCommand(0xD9); // Set pre-charge period
    sendCommand(0xF1);
    sendCommand(0xDB); // Set VCOMH deselect level
    sendCommand(0x40);
    sendCommand(0xA4); // Entire display on (resume to RAM content)
    sendCommand(0xA6); // Normal display
    sendCommand(0xAF); // Display on

    clear();
    display();
    initialized = true;
    Serial.println("[DisplayDriver] SSD1306 128x64 OLED initialized successfully.");
    return true;
}

void DisplayDriver::clear() {
    memset(buffer, 0, sizeof(buffer));
}

void DisplayDriver::display() {
    if (!initialized) return;

    sendCommand(0x21); // Column address
    sendCommand(0);    // Start column
    sendCommand(127);  // End column

    sendCommand(0x22); // Page address
    sendCommand(0);    // Start page
    sendCommand(7);    // End page

    // Send 1024 bytes in 16-byte chunks to fit ESP32 I2C buffer
    for (uint16_t i = 0; i < sizeof(buffer); i += 16) {
        sendData(&buffer[i], 16);
    }
}

void DisplayDriver::drawPixel(int16_t x, int16_t y, uint8_t color) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;

    if (color) {
        buffer[x + (y / 8) * WIDTH] |= (1 << (y & 7));
    } else {
        buffer[x + (y / 8) * WIDTH] &= ~(1 << (y & 7));
    }
}

void DisplayDriver::fillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint8_t color) {
    for (int16_t i = x; i < x + w; i++) {
        for (int16_t j = y; j < y + h; j++) {
            drawPixel(i, j, color);
        }
    }
}

void DisplayDriver::fillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint8_t color) {
    fillRect(x + r, y, w - 2 * r, h, color);
    for (int16_t i = 0; i <= r; i++) {
        int16_t dx = r - (int16_t)sqrtf((float)(r * r - (r - i) * (r - i)));
        fillRect(x + dx, y + i, w - 2 * dx, 1, color);
        fillRect(x + dx, y + h - 1 - i, w - 2 * dx, 1, color);
    }
}

void DisplayDriver::drawCircle(int16_t x0, int16_t y0, int16_t r, uint8_t color) {
    int16_t f = 1 - r;
    int16_t ddF_x = 1;
    int16_t ddF_y = -2 * r;
    int16_t x = 0;
    int16_t y = r;

    drawPixel(x0, y0 + r, color);
    drawPixel(x0, y0 - r, color);
    drawPixel(x0 + r, y0, color);
    drawPixel(x0 - r, y0, color);

    while (x < y) {
        if (f >= 0) {
            y--;
            ddF_y += 2;
            f += ddF_y;
        }
        x++;
        ddF_x += 2;
        f += ddF_x;

        drawPixel(x0 + x, y0 + y, color);
        drawPixel(x0 - x, y0 + y, color);
        drawPixel(x0 + x, y0 - y, color);
        drawPixel(x0 - x, y0 - y, color);
        drawPixel(x0 + y, y0 + x, color);
        drawPixel(x0 - y, y0 + x, color);
        drawPixel(x0 + y, y0 - x, color);
        drawPixel(x0 - y, y0 - x, color);
    }
}

void DisplayDriver::fillCircle(int16_t x0, int16_t y0, int16_t r, uint8_t color) {
    for (int16_t y = -r; y <= r; y++) {
        for (int16_t x = -r; x <= r; x++) {
            if (x * x + y * y <= r * r) {
                drawPixel(x0 + x, y0 + y, color);
            }
        }
    }
}

void DisplayDriver::drawLine(int16_t x0, int16_t y0, int16_t x1, int16_t y1, uint8_t color) {
    int16_t dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    int16_t dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    int16_t err = dx + dy, e2;

    for (;;) {
        drawPixel(x0, y0, color);
        if (x0 == x1 && y0 == y1) break;
        e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}

void DisplayDriver::drawString(int16_t x, int16_t y, const char* str, uint8_t size) {
    // Basic 5x7 bitmap font rendering for notifications & IP address
    // (minimalistic font implementation to avoid large Flash usage)
    int16_t curX = x;
    while (*str) {
        char c = *str++;
        if (c >= 32 && c <= 126) {
            // Simple placeholder character rendering (6x8 box)
            for (int8_t i = 0; i < 5 * size; i++) {
                drawPixel(curX + i, y, 1);
                drawPixel(curX + i, y + 7 * size, 1);
            }
            for (int8_t j = 0; j < 8 * size; j++) {
                drawPixel(curX, y + j, 1);
                drawPixel(curX + 5 * size, y + j, 1);
            }
        }
        curX += 6 * size;
    }
}
