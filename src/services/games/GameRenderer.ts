/**
 * GameRenderer.ts
 * High-performance OLED Canvas Game Renderer for TARA's Direct Display System.
 *
 * Renders games directly on TARA's 320x160 OLED display with:
 * - Crisp monochrome/accent OLED vector graphics
 * - Game Title, Player Turn, TARA Turn, Score, Voice Meter
 * - Active Game Board on the Left
 * - Stationary Embedded Companion Face on the Right (reacts with eyes, mouth, blush)
 * - Bottom voice instruction guide and error recovery feedback
 */

import { DirectGameMasterState } from './GameState';
import { CoordinatedFrame } from '../AnimationCoordinator';

export interface RendererColors {
  bg: string;
  primary: string;
  secondary: string;
  glow: string;
  dim: string;
  accent: string;
}

export class GameRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    frame: CoordinatedFrame,
    colors: RendererColors,
    w: number,
    h: number
  ) {
    ctx.save();

    // 1. If Game Invitation is active, render the dedicated invitation card
    if (state.invitationActive) {
      this.renderInvitationScreen(ctx, state, frame, colors, w, h);
      ctx.restore();
      return;
    }

    // 2. Render Top HUD Bar (Title, Turn, Voice Listening Pulse, Score)
    this.renderTopHud(ctx, state, colors, w, h);

    // 3. Render Game Board (Left half: x: 6 to w * 0.58)
    const boardW = w * 0.58;
    const boardH = h - 36;
    const boardX = 6;
    const boardY = 20;

    this.renderActiveGameBoard(ctx, state, colors, boardX, boardY, boardW, boardH);

    // 4. Render Embedded Companion Face on the Right (x: w * 0.61 to w - 6)
    const faceX = w * 0.61;
    const faceY = 20;
    const faceW = w - faceX - 6;
    const faceH = boardH;

    this.renderCompanionFace(ctx, frame, colors, faceX, faceY, faceW, faceH);

    // 5. Render Bottom Status & Voice Prompt Bar
    this.renderBottomStatus(ctx, state, colors, w, h);

    ctx.restore();
  }

  // ====================================================
  // TOP HUD
  // ====================================================
  private static renderTopHud(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    w: number,
    h: number
  ) {
    // Divider
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 18);
    ctx.lineTo(w - 4, 18);
    ctx.stroke();

    // Game Title (Left)
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'left';
    ctx.fillText(state.activeGame.replace(/_/g, ' '), 8, 12);

    // Turn / Result Banner (Center)
    ctx.textAlign = 'center';
    if (state.resultBanner) {
      const isWin = state.resultBanner.toUpperCase().includes('WIN') || state.resultBanner.toUpperCase().includes('YOU');
      ctx.fillStyle = isWin ? '#00e676' : '#ffd54f';
      ctx.fillText(`★ ${state.resultBanner} ★`, w * 0.44, 12);
    } else if (state.currentTurn === 'player') {
      ctx.fillStyle = colors.accent;
      ctx.fillText('▶ YOUR TURN', w * 0.44, 12);
    } else {
      ctx.fillStyle = colors.secondary;
      ctx.fillText('● TARA THINKING', w * 0.44, 12);
    }

    // Voice State Indicator (Pulsing mic indicator)
    const isListening = state.voiceState === 'GAME_LISTENING';
    if (isListening) {
      const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(0, 229, 255, ${0.4 + pulse * 0.6})`;
      ctx.fillRect(w * 0.66, 5, 6, 8);
      ctx.font = '8px monospace';
      ctx.fillStyle = colors.primary;
      ctx.textAlign = 'left';
      ctx.fillText('MIC', w * 0.66 + 9, 12);
    }

    // Score (Right)
    ctx.font = '8px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'right';
    ctx.fillText(`YOU:${state.playerScore} TARA:${state.taraScore}`, w - 8, 12);
  }

  // ====================================================
  // BOTTOM STATUS & HINT BAR
  // ====================================================
  private static renderBottomStatus(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    w: number,
    h: number
  ) {
    const y = h - 4;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(4, h - 16, w - 8, 14);
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1;
    ctx.strokeRect(4, h - 16, w - 8, 14);

    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';

    if (state.voiceState === 'GAME_INVALID_INPUT' || state.lastErrorGuidance) {
      ctx.fillStyle = '#ff8a80';
      const msg = `! ${state.lastErrorGuidance || 'Invalid move, please try again.'}`;
      ctx.fillText(msg.length > 58 ? msg.slice(0, 56) + '...' : msg, 10, y - 2);
    } else if (state.resultBanner) {
      ctx.fillStyle = colors.accent;
      ctx.fillText('Say: "Play again" to restart or "Exit" to return', 10, y - 2);
    } else {
      ctx.fillStyle = colors.secondary;
      const msg = state.expectedInputPrompt || state.gameStatusText;
      ctx.fillText(msg.length > 58 ? msg.slice(0, 56) + '...' : msg, 10, y - 2);
    }
  }

  // ====================================================
  // EMBEDDED COMPANION FACE (RIGHT PANEL)
  // ====================================================
  private static renderCompanionFace(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: RendererColors,
    fx: number,
    fy: number,
    fw: number,
    fh: number
  ) {
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 20, 0.65)';
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1;
    ctx.strokeRect(fx, fy, fw, fh);

    const eyeSpacing = fw * 0.28;
    const eyeCenterY = fy + fh * 0.38;
    const leftEyeX = fx + fw * 0.5 - eyeSpacing;
    const rightEyeX = fx + fw * 0.5 + eyeSpacing;
    const eyeRadiusX = fw * 0.16;
    const eyeRadiusY = fh * 0.20;

    // Eyebrows
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    const browOffset = (frame.eyebrowOffset || 0) * 4;
    ctx.beginPath();
    ctx.moveTo(leftEyeX - eyeRadiusX * 0.8, eyeCenterY - eyeRadiusY - 4 - browOffset);
    ctx.lineTo(leftEyeX + eyeRadiusX * 0.8, eyeCenterY - eyeRadiusY - 5 - browOffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEyeX - eyeRadiusX * 0.8, eyeCenterY - eyeRadiusY - 5 - browOffset);
    ctx.lineTo(rightEyeX + eyeRadiusX * 0.8, eyeCenterY - eyeRadiusY - 4 - browOffset);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeCenterY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeCenterY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils looking towards the game board (leftward)
    ctx.fillStyle = colors.bg;
    const pupilX = -2 + (frame.pupilOffsetX || 0) * 3;
    const pupilY = (frame.pupilOffsetY || 0) * 2;
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilX, eyeCenterY + pupilY, eyeRadiusX * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilX, eyeCenterY + pupilY, eyeRadiusX * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Pupil Glint
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(leftEyeX + pupilX - 1.5, eyeCenterY + pupilY - 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightEyeX + pupilX - 1.5, eyeCenterY + pupilY - 1.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    if (frame.blush) {
      ctx.fillStyle = 'rgba(255, 64, 129, 0.4)';
      ctx.beginPath();
      ctx.ellipse(leftEyeX - 2, eyeCenterY + eyeRadiusY + 3, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + 2, eyeCenterY + eyeRadiusY + 3, 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    const mouthX = fx + fw * 0.5;
    const mouthY = fy + fh * 0.76;
    ctx.strokeStyle = colors.primary;
    ctx.fillStyle = colors.primary;
    ctx.lineWidth = 1.5;

    if (frame.audioAmplitude > 0.05) {
      const mH = 3 + frame.audioAmplitude * 6;
      ctx.beginPath();
      ctx.ellipse(mouthX, mouthY, 6, mH, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(mouthX, mouthY - 3, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Mood badge
    ctx.font = '7px monospace';
    ctx.fillStyle = colors.dim;
    ctx.textAlign = 'center';
    ctx.fillText(frame.expression.toUpperCase(), fx + fw * 0.5, fy + fh - 4);

    ctx.restore();
  }

  // ====================================================
  // ROUTE GAME BOARDS
  // ====================================================
  private static renderActiveGameBoard(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    ctx.save();
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    switch (state.activeGame) {
      case 'TIC_TAC_TOE':
        this.renderTicTacToe(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'ROCK_PAPER_SCISSORS':
        this.renderRockPaperScissors(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'GUESS_NUMBER':
        this.renderGuessNumber(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'HIGHER_LOWER':
        this.renderHigherLower(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'MEMORY_MATCH':
        this.renderMemoryMatch(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'CONNECT_FOUR':
        this.renderConnectFour(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'PATTERN_MEMORY':
        this.renderPatternMemory(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'REACTION':
        this.renderReactionGame(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'SIMON_SAYS':
        this.renderSimonSays(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'DICE_GAME':
        this.renderDiceGame(ctx, state, colors, bx, by, bw, bh);
        break;
      case 'QUICK_REACTION':
        this.renderQuickReaction(ctx, state, colors, bx, by, bw, bh);
        break;
      default:
        break;
    }

    ctx.restore();
  }

  // ====================================================
  // 1. TIC-TAC-TOE
  // ====================================================
  private static renderTicTacToe(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const gridPad = 10;
    const gridW = bw - gridPad * 2;
    const gridH = bh - gridPad * 2;
    const cellW = gridW / 3;
    const cellH = gridH / 3;
    const ox = bx + gridPad;
    const oy = by + gridPad;

    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1.5;

    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + i * cellW, oy);
      ctx.lineTo(ox + i * cellW, oy + gridH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ox, oy + i * cellH);
      ctx.lineTo(ox + gridW, oy + i * cellH);
      ctx.stroke();
    }

    state.ticTacToe.board.forEach((val, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = ox + col * cellW + cellW * 0.5;
      const cy = oy + row * cellH + cellH * 0.5;

      if (val === 'X') {
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3;
        const d = cellW * 0.28;
        ctx.beginPath();
        ctx.moveTo(cx - d, cy - d);
        ctx.lineTo(cx + d, cy + d);
        ctx.moveTo(cx + d, cy - d);
        ctx.lineTo(cx - d, cy + d);
        ctx.stroke();
      } else if (val === 'O') {
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
        const r = cellW * 0.28;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((i + 1).toString(), cx, cy);
      }
    });

    if (state.ticTacToe.winningLine) {
      const [a, , c] = state.ticTacToe.winningLine;
      const x1 = ox + (a % 3) * cellW + cellW * 0.5;
      const y1 = oy + Math.floor(a / 3) * cellH + cellH * 0.5;
      const x2 = ox + (c % 3) * cellW + cellW * 0.5;
      const y2 = oy + Math.floor(c / 3) * cellH + cellH * 0.5;

      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // ====================================================
  // 2. ROCK PAPER SCISSORS
  // ====================================================
  private static renderRockPaperScissors(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const midX = bx + bw * 0.5;
    const midY = by + bh * 0.5;

    const cardW = bw * 0.38;
    const cardH = bh * 0.65;
    const pX = bx + bw * 0.08;
    const pY = by + bh * 0.15;

    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pX, pY, cardW, cardH);
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', pX + cardW * 0.5, pY - 4);

    this.drawRpsIcon(ctx, state.rockPaperScissors.playerChoice, pX + cardW * 0.5, pY + cardH * 0.5, colors.accent);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'center';
    ctx.fillText('VS', midX, midY);

    const tX = bx + bw * 0.54;
    const tY = pY;

    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tX, tY, cardW, cardH);
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('TARA', tX + cardW * 0.5, tY - 4);

    if (state.rockPaperScissors.taraChoice) {
      this.drawRpsIcon(ctx, state.rockPaperScissors.taraChoice, tX + cardW * 0.5, tY + cardH * 0.5, '#ffd54f');
    } else {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = colors.dim;
      ctx.fillText('?', tX + cardW * 0.5, tY + cardH * 0.5 + 5);
    }
  }

  private static drawRpsIcon(
    ctx: CanvasRenderingContext2D,
    move: 'rock' | 'paper' | 'scissors' | null,
    cx: number,
    cy: number,
    color: string
  ) {
    if (!move) {
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'center';
      ctx.fillText('...', cx, cy);
      return;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    if (move === 'rock') {
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('ROCK', cx, cy + 2);
    } else if (move === 'paper') {
      ctx.fillRect(cx - 10, cy - 12, 20, 24);
      ctx.font = 'bold 7px sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('PAPER', cx, cy + 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy + 10);
      ctx.lineTo(cx + 6, cy - 10);
      ctx.moveTo(cx + 8, cy + 10);
      ctx.lineTo(cx - 6, cy - 10);
      ctx.stroke();
      ctx.font = 'bold 6px sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText('SCISSORS', cx, cy + 14);
    }
  }

  // ====================================================
  // 3. GUESS THE NUMBER
  // ====================================================
  private static renderGuessNumber(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const g = state.guessNumber;
    const barX = bx + 12;
    const barY = by + 24;
    const barW = bw - 24;

    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barX, barY);
    ctx.lineTo(barX + barW, barY);
    ctx.stroke();

    ctx.font = '9px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'left';
    ctx.fillText(g.min.toString(), barX, barY - 6);
    ctx.textAlign = 'right';
    ctx.fillText(g.max.toString(), barX + barW, barY - 6);

    const minFrac = (g.min - 1) / 100;
    const maxFrac = (g.max - 1) / 100;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(barX + minFrac * barW, barY);
    ctx.lineTo(barX + maxFrac * barW, barY);
    ctx.stroke();

    const cx = bx + bw * 0.5;
    const cy = by + bh * 0.65;

    ctx.textAlign = 'center';
    if (g.lastGuess !== null) {
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = colors.accent;
      ctx.fillText(g.lastGuess.toString(), cx, cy);

      ctx.font = 'bold 9px monospace';
      if (g.hint === 'too_high') {
        ctx.fillStyle = '#ff8a80';
        ctx.fillText('▼ TOO HIGH! GUESS LOWER', cx, cy + 14);
      } else if (g.hint === 'too_low') {
        ctx.fillStyle = '#80d8ff';
        ctx.fillText('▲ TOO LOW! GUESS HIGHER', cx, cy + 14);
      } else if (g.hint === 'correct') {
        ctx.fillStyle = '#00e676';
        ctx.fillText('★ BINGO! CORRECT! ★', cx, cy + 14);
      }
    } else {
      ctx.font = '12px monospace';
      ctx.fillStyle = colors.dim;
      ctx.fillText('[ 1 — 100 ]', cx, cy);
      ctx.font = '8px monospace';
      ctx.fillText('Say your first guess', cx, cy + 14);
    }
  }

  // ====================================================
  // 4. HIGHER / LOWER
  // ====================================================
  private static renderHigherLower(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const hl = state.higherLower;
    const cx = bx + bw * 0.5;
    const cy = by + bh * 0.45;

    const cardW = 44;
    const cardH = 56;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - cardW - 8, cy - cardH * 0.5, cardW, cardH);
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText(hl.currentNumber.toString(), cx - cardW * 0.5 - 8, cy + 8);

    ctx.strokeStyle = colors.dim;
    ctx.strokeRect(cx + 8, cy - cardH * 0.5, cardW, cardH);
    if (hl.nextNumber !== null) {
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = hl.result === 'correct' ? '#00e676' : '#ff8a80';
      ctx.fillText(hl.nextNumber.toString(), cx + cardW * 0.5 + 8, cy + 8);
    } else {
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = colors.dim;
      ctx.fillText('?', cx + cardW * 0.5 + 8, cy + 8);
    }

    ctx.font = '9px monospace';
    ctx.fillStyle = colors.accent;
    ctx.textAlign = 'center';
    ctx.fillText(`STREAK: ${hl.streak} (BEST: ${hl.bestStreak})`, cx, by + bh - 6);
  }

  // ====================================================
  // 5. MEMORY MATCH
  // ====================================================
  private static renderMemoryMatch(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const cols = 4;
    const rows = 3;
    const pad = 4;
    const cardW = (bw - pad * (cols + 1)) / cols;
    const cardH = (bh - pad * (rows + 1)) / rows;

    state.memoryMatch.cards.forEach((card, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = bx + pad + c * (cardW + pad);
      const y = by + pad + r * (cardH + pad);

      ctx.strokeStyle = card.isMatched ? '#00e676' : card.isFlipped ? colors.primary : colors.dim;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cardW, cardH);

      if (card.isFlipped || card.isMatched) {
        ctx.fillStyle = card.isMatched ? 'rgba(0, 230, 118, 0.15)' : 'rgba(0, 229, 255, 0.15)';
        ctx.fillRect(x + 1, y + 1, cardW - 2, cardH - 2);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = colors.accent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.label, x + cardW * 0.5, y + cardH * 0.5);
      } else {
        ctx.font = '8px monospace';
        ctx.fillStyle = colors.secondary;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(card.id.toString(), x + cardW * 0.5, y + cardH * 0.5);
      }
    });
  }

  // ====================================================
  // 6. CONNECT FOUR
  // ====================================================
  private static renderConnectFour(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const cols = 7;
    const rows = 6;
    const pad = 2;
    const cellW = (bw - pad * 2) / cols;
    const cellH = (bh - 14) / rows;
    const startY = by + 12;

    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = colors.secondary;
      ctx.fillText((c + 1).toString(), bx + pad + c * cellW + cellW * 0.5, by + 9);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = bx + pad + c * cellW + cellW * 0.5;
        const cy = startY + r * cellH + cellH * 0.5;
        const val = state.connectFour.grid[r][c];

        ctx.strokeStyle = colors.dim;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();

        if (val === 'P') {
          ctx.fillStyle = colors.primary;
          ctx.beginPath();
          ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (val === 'T') {
          ctx.fillStyle = '#ffd54f';
          ctx.beginPath();
          ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // ====================================================
  // 7. PATTERN MEMORY
  // ====================================================
  private static renderPatternMemory(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const p = state.patternMemory;
    const cx = bx + bw * 0.5;
    const cy = by + bh * 0.5;

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'center';
    ctx.fillText(`ROUND ${p.level}`, cx, by + 14);

    if (p.phase === 'SHOWING') {
      const total = p.pattern.length;
      const boxW = 20;
      const gap = 6;
      const startX = cx - (total * (boxW + gap) - gap) * 0.5;

      p.pattern.forEach((num, i) => {
        const x = startX + i * (boxW + gap);
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, cy - 12, boxW, 24);
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = colors.accent;
        ctx.fillText(num.toString(), x + boxW * 0.5, cy + 5);
      });

      ctx.font = '8px monospace';
      ctx.fillStyle = colors.dim;
      ctx.fillText('MEMORIZE SEQUENCE...', cx, by + bh - 8);
    } else {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = colors.primary;
      ctx.fillText('NOW REPEAT BY VOICE!', cx, cy);

      ctx.font = '8px monospace';
      ctx.fillStyle = colors.secondary;
      ctx.fillText('Say all numbers in order', cx, cy + 16);
    }
  }

  // ====================================================
  // 8. REACTION GAME
  // ====================================================
  private static renderReactionGame(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const rx = state.reactionGame;
    const cx = bx + bw * 0.5;
    const cy = by + bh * 0.5;

    if (rx.phase === 'WAITING' || rx.phase === 'READY') {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = colors.dim;
      ctx.textAlign = 'center';
      ctx.fillText('[ WAIT FOR SIGNAL... ]', cx, cy);
    } else if (rx.phase === 'SIGNAL_ACTIVE') {
      ctx.fillStyle = '#00e676';
      ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ SAY "GO"! ⚡', cx, cy + 8);
    } else if (rx.phase === 'RECORDED') {
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = '#00e676';
      ctx.textAlign = 'center';
      ctx.fillText(`${rx.reactionMs} ms`, cx, cy);
      ctx.font = '9px monospace';
      ctx.fillStyle = colors.accent;
      ctx.fillText(`BEST: ${rx.bestReactionMs || rx.reactionMs} ms`, cx, cy + 16);
    } else if (rx.phase === 'EARLY') {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ff8a80';
      ctx.textAlign = 'center';
      ctx.fillText('TOO EARLY!', cx, cy);
    }
  }

  // ====================================================
  // 9. SIMON SAYS
  // ====================================================
  private static renderSimonSays(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const s = state.simonSays;
    const cx = bx + bw * 0.5;
    const cy = by + bh * 0.5;

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = colors.secondary;
    ctx.textAlign = 'center';
    ctx.fillText(`SIMON SAYS - ROUND ${s.round}`, cx, by + 14);

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = colors.accent;
    ctx.fillText(s.command || 'WATCH COMMAND!', cx, cy + 4);
  }

  // ====================================================
  // 10. DICE GAME
  // ====================================================
  private static renderDiceGame(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const d = state.diceGame;
    const cy = by + bh * 0.45;

    ctx.font = '8px monospace';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText('YOU', bx + bw * 0.28, by + 12);
    this.drawDie(ctx, bx + bw * 0.16, cy - 14, 26, d.playerDice[0], colors.primary, colors.bg);
    this.drawDie(ctx, bx + bw * 0.32, cy - 14, 26, d.playerDice[1], colors.primary, colors.bg);

    ctx.fillStyle = '#ffd54f';
    ctx.fillText('TARA', bx + bw * 0.74, by + 12);
    this.drawDie(ctx, bx + bw * 0.62, cy - 14, 26, d.taraDice[0], '#ffd54f', colors.bg);
    this.drawDie(ctx, bx + bw * 0.78, cy - 14, 26, d.taraDice[1], '#ffd54f', colors.bg);

    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    if (d.isRolling) {
      ctx.fillStyle = colors.accent;
      ctx.fillText('ROLLING...', bx + bw * 0.5, by + bh - 6);
    } else {
      ctx.fillStyle = colors.secondary;
      ctx.fillText(`Sum: ${d.playerTotal} vs ${d.taraTotal}`, bx + bw * 0.5, by + bh - 6);
    }
  }

  // ====================================================
  // 11. QUICK REACTION
  // ====================================================
  private static renderQuickReaction(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    colors: RendererColors,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ) {
    const qr = state.quickReaction;
    const cx = bx + bw * 0.5;
    const cy = by + bh * 0.5;

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText(`TARGET: "${qr.targetWord}"`, cx, cy);

    if (qr.reactionMs > 0) {
      ctx.font = '10px monospace';
      ctx.fillStyle = '#00e676';
      ctx.fillText(`${qr.reactionMs} ms`, cx, cy + 16);
    }
  }

  private static drawDie(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    pips: number,
    strokeColor: string,
    fillColor: string
  ) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;

    ctx.fillRect(x, y, size, size);
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = strokeColor;
    const r = 2;
    const c1 = x + size * 0.25;
    const c2 = x + size * 0.5;
    const c3 = x + size * 0.75;
    const r1 = y + size * 0.25;
    const r2 = y + size * 0.5;
    const r3 = y + size * 0.75;

    const drawPip = (px: number, py: number) => {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    };

    if (pips === 1) {
      drawPip(c2, r2);
    } else if (pips === 2) {
      drawPip(c1, r1);
      drawPip(c3, r3);
    } else if (pips === 3) {
      drawPip(c1, r1);
      drawPip(c2, r2);
      drawPip(c3, r3);
    } else if (pips === 4) {
      drawPip(c1, r1);
      drawPip(c3, r1);
      drawPip(c1, r3);
      drawPip(c3, r3);
    } else if (pips === 5) {
      drawPip(c1, r1);
      drawPip(c3, r1);
      drawPip(c2, r2);
      drawPip(c1, r3);
      drawPip(c3, r3);
    } else if (pips === 6) {
      drawPip(c1, r1);
      drawPip(c3, r1);
      drawPip(c1, r2);
      drawPip(c3, r2);
      drawPip(c1, r3);
      drawPip(c3, r3);
    }
  }

  // ====================================================
  // AUTONOMOUS GAME INVITATION SCREEN
  // ====================================================
  private static renderInvitationScreen(
    ctx: CanvasRenderingContext2D,
    state: DirectGameMasterState,
    frame: CoordinatedFrame,
    colors: RendererColors,
    w: number,
    h: number
  ) {
    ctx.fillStyle = 'rgba(3, 13, 23, 0.95)';
    ctx.fillRect(8, 8, w - 16, h - 16);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = colors.accent;
    ctx.textAlign = 'center';
    ctx.fillText('★ GAME INVITATION ★', w * 0.5, 26);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = colors.primary;
    ctx.fillText(`Want to play ${state.invitedGame.replace(/_/g, ' ')}?`, w * 0.5, h * 0.44);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#00e676';
    ctx.fillText('Say: "YES" (হ্যাঁ) to Play', w * 0.5, h * 0.62);

    ctx.fillStyle = colors.secondary;
    ctx.fillText('Say: "NO" (না) to Decline', w * 0.5, h * 0.74);

    const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
    ctx.font = '8px monospace';
    ctx.fillStyle = `rgba(0, 229, 255, ${0.4 + pulse * 0.6})`;
    ctx.fillText('🎙 LISTENING FOR YOUR ANSWER...', w * 0.5, h - 16);
  }
}
