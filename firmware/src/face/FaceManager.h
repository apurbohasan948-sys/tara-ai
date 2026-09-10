#ifndef TARA_FACEMANAGER_H
#define TARA_FACEMANAGER_H

#include <Arduino.h>
#include "Animation.h"
#include "Expressions.h"
#include "../core/TaraState.h"

class DisplayDriver;

class FaceManager {
public:
    FaceManager(DisplayDriver* displayDriver);

    bool begin();
    void update();

    void onStateChange(RobotState oldState, RobotState newState);
    void setExpression(FaceExpression expr, bool immediate = false);

    void showTextNotification(const char* line1, const char* line2 = nullptr, uint32_t durationMs = 2500);

private:
    DisplayDriver* display;
    AnimationController animation;
    uint32_t lastRenderMs;
    uint32_t notificationUntilMs;
    char notificationLine1[32];
    char notificationLine2[32];

    void renderFace();
    void renderEye(int16_t cx, int16_t cy, const EyeParameters& eye, int16_t lookX, int16_t lookY);
    void renderMouth(const FaceGeometry& geom);
    void renderStateDecoration(RobotState state);
    void renderNotification();
};

#endif // TARA_FACEMANAGER_H
