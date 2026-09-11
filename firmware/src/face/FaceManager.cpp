#include "FaceManager.h"
#include "../hardware/DisplayDriver.h"
#include <math.h>

FaceManager::FaceManager(DisplayDriver* displayDriver)
    : display(displayDriver),
      lastRenderMs(0),
      notificationUntilMs(0),
      mouthAmplitude(0.0f) {
    notificationLine1[0] = '\0';
    notificationLine2[0] = '\0';
}

void FaceManager::setMouthAmplitude(float amplitude) {
    mouthAmplitude = (amplitude > 1.0f) ? 1.0f : ((amplitude < 0.0f) ? 0.0f : amplitude);
}

bool FaceManager::begin() {
    if (display && display->begin()) {
        setExpression(FaceExpression::NEUTRAL, true);
        return true;
    }
    return false;
}

void FaceManager::onStateChange(RobotState oldState, RobotState newState) {
    switch (newState) {
        case RobotState::IDLE:
            animation.setExpression(FaceExpression::NEUTRAL);
            break;
        case RobotState::LISTENING:
            animation.setExpression(FaceExpression::LISTENING);
            break;
        case RobotState::THINKING:
            animation.setExpression(FaceExpression::THINKING);
            break;
        case RobotState::SPEAKING:
            animation.setExpression(FaceExpression::SPEAKING);
            break;
        case RobotState::HAPPY:
            animation.setExpression(FaceExpression::HAPPY);
            break;
        case RobotState::SAD:
            animation.setExpression(FaceExpression::SAD);
            break;
        case RobotState::ANGRY:
            animation.setExpression(FaceExpression::ANGRY);
            break;
        case RobotState::SURPRISED:
            animation.setExpression(FaceExpression::SURPRISED);
            break;
        case RobotState::SLEEPING:
            animation.setExpression(FaceExpression::SLEEPY);
            break;
        case RobotState::CONNECTING:
            animation.setExpression(FaceExpression::THINKING);
            break;
        case RobotState::ERROR:
            animation.setExpression(FaceExpression::ERROR_FACE);
            break;
    }
}

void FaceManager::setExpression(FaceExpression expr, bool immediate) {
    animation.setExpression(expr, immediate);
}

void FaceManager::showTextNotification(const char* line1, const char* line2, uint32_t durationMs) {
    if (line1) strncpy(notificationLine1, line1, sizeof(notificationLine1) - 1);
    else notificationLine1[0] = '\0';

    if (line2) strncpy(notificationLine2, line2, sizeof(notificationLine2) - 1);
    else notificationLine2[0] = '\0';

    notificationUntilMs = millis() + durationMs;
}

void FaceManager::update() {
    uint32_t now = millis();
    uint32_t delta = now - lastRenderMs;

    // Render at ~30 FPS (33ms period) to keep ESP32 CPU free for Wi-Fi and audio
    if (delta >= 33) {
        lastRenderMs = now;
        animation.update(delta);

        if (display && display->isReady()) {
            display->clear();
            if (now < notificationUntilMs) {
                renderNotification();
            } else {
                renderFace();
            }
            display->display();
        }
    }
}

void FaceManager::renderEye(int16_t cx, int16_t cy, const EyeParameters& eye, int16_t lookX, int16_t lookY) {
    if (!display) return;

    int16_t w = eye.width;
    int16_t h = eye.height;
    int16_t r = eye.cornerRadius;
    int16_t x0 = cx - w / 2;
    int16_t y0 = cy - h / 2;

    if (eye.crescentUp) {
        // Happy smiling arch
        display->fillRoundRect(x0, y0 + 6, w, 12, 5, 1);
        display->fillRoundRect(x0 + 2, y0 + 12, w - 4, 10, 4, 0);
        return;
    }

    if (eye.crescentDown) {
        // Sad droop arch
        display->fillRoundRect(x0, y0, w, 12, 5, 1);
        display->fillRoundRect(x0 + 2, y0, w - 4, 8, 4, 0);
        return;
    }

    // Draw eye outer rounded body
    display->fillRoundRect(x0, y0, w, h, r, 1);

    // Apply upper eyelid (blinking / squinting)
    if (eye.upperEyelid > 0.05f) {
        int16_t lidH = (int16_t)(h * eye.upperEyelid);
        display->fillRect(x0 - 2, y0 - 2, w + 4, lidH + 2, 0);
    }

    // Apply lower eyelid
    if (eye.lowerEyelid > 0.05f) {
        int16_t lidH = (int16_t)(h * eye.lowerEyelid);
        display->fillRect(x0 - 2, y0 + h - lidH, w + 4, lidH + 2, 0);
    }

    // Draw pupil highlight / iris detail if eye is sufficiently open
    if (eye.upperEyelid < 0.7f) {
        int16_t px = cx + eye.pupilOffsetX + lookX;
        int16_t py = cy + eye.pupilOffsetY + lookY;
        // Inner negative highlight gives lively sparkle
        display->fillCircle(px + 4, py - 4, 3, 0);
    }
}

void FaceManager::renderFace() {
    FaceGeometry geom = animation.getCurrentGeometry();
    int16_t lookX = animation.getLookX();
    int16_t lookY = animation.getLookY();

    // Eye centers: Left eye at x=36, Right eye at x=92. Center Y = 30.
    renderEye(36, 30, geom.leftEye, lookX, lookY);
    renderEye(92, 30, geom.rightEye, lookX, lookY);

    // Mouth / Speaking dynamics
    if (geom.showMouth && geom.mouthWidth > 0) {
        renderMouth(geom);
    }

    // Dynamic wave animation for Listening / Thinking
    FaceExpression expr = animation.getTargetExpression();
    if (expr == FaceExpression::LISTENING) {
        float phase = animation.getWavePhase();
        for (int16_t i = 0; i < 5; i++) {
            int16_t barH = (int16_t)(6.0f + 5.0f * sinf(phase * 2.0f + i * 1.2f));
            int16_t bx = 52 + i * 6;
            display->fillRect(bx, 56 - barH / 2, 3, barH, 1);
        }
    } else if (expr == FaceExpression::THINKING) {
        float phase = animation.getWavePhase();
        int16_t dotX = (int16_t)(64 + 18.0f * cosf(phase * 1.8f));
        int16_t dotY = (int16_t)(56 + 4.0f * sinf(phase * 1.8f));
        display->fillCircle(dotX, dotY, 2, 1);
    }
}

void FaceManager::renderMouth(const FaceGeometry& geom) {
    if (!display) return;

    int16_t w = geom.mouthWidth;
    int16_t h = geom.mouthHeight;

    // Dynamically modulate mouth aperture based on real audio amplitude envelope
    if (mouthAmplitude > 0.05f) {
        // Height expands from base 2px up to 14px; width widens up to +8px
        h = (int16_t)(3 + mouthAmplitude * 11);
        w = (int16_t)(geom.mouthWidth + mouthAmplitude * 8);
    }

    int16_t mx = 64 - w / 2;
    int16_t my = geom.mouthY - (h / 2);
    int16_t radius = (h > 4) ? 3 : 1;
    display->fillRoundRect(mx, my, w, h, radius, 1);
}

void FaceManager::renderNotification() {
    if (!display) return;
    display->drawString(4, 18, notificationLine1, 1);
    if (strlen(notificationLine2) > 0) {
        display->drawString(4, 38, notificationLine2, 1);
    }
}
