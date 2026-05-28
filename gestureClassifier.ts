export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureResult {
  gesture: string;
  confidence: number;
  image: string;
}

// ───────────── IMAGE MAP ─────────────
const gestureImages: Record<string, string> = {
  A: 'images/A.png',   B: 'images/B.jpeg',  C: 'images/C.jpeg',
  D: 'images/D.jpeg',  E: 'images/E.jpeg',  F: 'images/F.jpeg',
  G: 'images/G.jpeg',  H: 'images/H.jpeg',  I: 'images/I.jpeg',
  J: 'images/J.jpeg',  K: 'images/K.jpeg',  L: 'images/L.jpeg',
  M: 'images/M.jpeg',  N: 'images/N.jpeg',  O: 'images/O.jpeg',
  P: 'images/P.jpeg',  Q: 'images/Q.jpeg',  R: 'images/R.jpeg',
  S: 'images/S.jpeg',  T: 'images/T.jpeg',  U: 'images/U.jpeg',
  V: 'images/V.jpeg',  W: 'images/W.jpeg',  X: 'images/X.jpeg',
  Y: 'images/Y.jpeg',  Z: 'images/Z.jpeg',
  Unknown: 'images/default.png',
};

function getImage(g: string): string {
  return gestureImages[g] || gestureImages['Unknown'];
}

function ret(g: string, c: number): GestureResult {
  return { gesture: g, confidence: c, image: getImage(g) };
}

// ───────────── HELPERS ─────────────

function dist(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function dist2d(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Tip is above PIP joint — finger is pointing up
function up(lm: HandLandmark[], tip: number, pip: number): boolean {
  return lm[tip].y < lm[pip].y - 0.025;
}

// Tip is at or below DIP — finger is curled
function curled(lm: HandLandmark[], tip: number, dip: number): boolean {
  return lm[tip].y >= lm[dip].y - 0.01;
}

function near(lm: HandLandmark[], a: number, b: number, t = 0.055): boolean {
  return dist(lm[a], lm[b]) < t;
}

// Finger points sideways more than upward
function isHoriz(lm: HandLandmark[], tip: number, mcp: number): boolean {
  return Math.abs(lm[tip].x - lm[mcp].x) > Math.abs(lm[tip].y - lm[mcp].y) * 0.8;
}

function thumbUp(lm: HandLandmark[]): boolean {
  return lm[4].y < lm[3].y - 0.04;
}

function thumbDown(lm: HandLandmark[]): boolean {
  return lm[4].y > lm[3].y + 0.04;
}

// Thumb extended sideways away from palm
function thumbSide(lm: HandLandmark[]): boolean {
  return Math.abs(lm[4].x - lm[2].x) > 0.045 &&
         Math.abs(lm[4].y - lm[3].y) < 0.05;
}

// ───────────── MAIN FUNCTION ─────────────

export function classifyGesture(lm: HandLandmark[]): GestureResult {
  if (!lm || lm.length < 21) {
    return ret('Unknown', 0);
  }

  const I = up(lm, 8, 6);    // index extended
  const M = up(lm, 12, 10);  // middle extended
  const R = up(lm, 16, 14);  // ring extended
  const P = up(lm, 20, 18);  // pinky extended

  const iC = curled(lm, 8, 7);
  const mC = curled(lm, 12, 11);

  const tUp   = thumbUp(lm);
  const tDown = thumbDown(lm);
  const tSide = thumbSide(lm);

  // ── LAYER 1: PINCH / TOUCHING (most unique shapes) ────────────

  // O — thumb + index + middle all pinch into circle
  if (near(lm, 4, 8, 0.05) && near(lm, 4, 12, 0.06) && near(lm, 8, 12, 0.05)) {
    return ret('O', 0.94);
  }

  // F — index+thumb pinch, middle+ring+pinky UP
  if (near(lm, 4, 8, 0.055) && M && R && P && !I) {
    return ret('F', 0.92);
  }

  // D — index up, thumb tip near middle tip (thumb+middle pinch)
  if (I && !M && !R && !P && near(lm, 4, 12, 0.07)) {
    return ret('D', 0.91);
  }

  // R — index+middle up, tips very close (crossed)
  if (I && M && !R && !P && near(lm, 8, 12, 0.038)) {
    return ret('R', 0.91);
  }

  // X — index bent/hooked (tip drops below middle joint)
  if (I && !M && !R && !P && lm[8].y > lm[7].y + 0.01) {
    return ret('X', 0.89);
  }

  // T — thumb tucked between index and middle knuckles
  if (!I && !M && !R && !P && iC && mC) {
    const between =
      lm[4].x > Math.min(lm[6].x, lm[10].x) - 0.01 &&
      lm[4].x < Math.max(lm[6].x, lm[10].x) + 0.01;
    if (between) return ret('T', 0.88);
  }

  // ── LAYER 2: ALL FINGERS CURLED (fist family) ─────────────────
  // Must come after touching checks above

  if (!I && !M && !R && !P) {

    // E — fingertips curl tightly below their knuckles
    if (lm[8].y > lm[5].y && lm[12].y > lm[9].y && lm[16].y > lm[13].y) {
      return ret('E', 0.90);
    }

    // M — three fingers folded over thumb
    const over = [
      lm[8].y > lm[4].y,
      lm[12].y > lm[4].y,
      lm[16].y > lm[4].y,
    ].filter(Boolean).length;
    if (over >= 3) return ret('M', 0.87);
    if (over === 2) return ret('N', 0.86);

    // S — thumb folds over curled fingers (thumb tip is above finger tips)
    if (lm[4].y < lm[8].y && !tSide && !tUp && !tDown) {
      return ret('S', 0.88);
    }

    // Yes — thumb straight up from fist
    if (tUp) return ret('Yes', 0.96);

    // Bad — thumb pointing down
    if (tDown) return ret('Bad', 0.92);

    // A — fist with thumb resting on side
    if (tSide) return ret('A', 0.92);

    // Default closed fist fallback
    return ret('A', 0.84);
  }

  // ── LAYER 3: INDEX ONLY ───────────────────────────────────────

  if (I && !M && !R && !P) {

    // P — hand tilts so index points downward (tip below MCP)
    if (lm[8].y > lm[5].y + 0.02) {
      return ret('P', 0.89);
    }

    // Q — index + thumb both angled downward
    if (tDown) return ret('Q', 0.88);

    // G — index points horizontally sideways
    if (isHoriz(lm, 8, 5)) return ret('G', 0.90);

    // Z — index extended diagonally (significant movement in both X and Y)
    const dx = Math.abs(lm[8].x - lm[5].x);
    const dy = Math.abs(lm[8].y - lm[5].y);
    if (dx > 0.03 && dy > 0.025 && dx < dy * 2.0) return ret('Z', 0.86);

    // L — index up + thumb out to side
    if (tSide) return ret('L', 0.95);

    // 1 — index straight up
    return ret('1', 0.95);
  }

  // ── LAYER 4: PINKY ONLY ───────────────────────────────────────

  if (!I && !M && !R && P) {
    // J — pinky tilted to one side
    if (lm[20].x < lm[17].x - 0.025) return ret('J', 0.87);
    return ret('I', 0.93);
  }

  // ── LAYER 5: THUMB + PINKY (no index/middle/ring) ─────────────

  if (!I && !M && !R && P && tSide) {
    return ret('Y', 0.94);
  }

  // ── LAYER 6: INDEX + MIDDLE ONLY ──────────────────────────────

  if (I && M && !R && !P) {

    // K — index+middle up, thumb rises between them
    if (tUp) {
      const between =
        lm[4].x > Math.min(lm[8].x, lm[12].x) - 0.015 &&
        lm[4].x < Math.max(lm[8].x, lm[12].x) + 0.015;
      if (between) return ret('K', 0.91);
    }

    // H — both fingers point sideways horizontally
    if (isHoriz(lm, 8, 5) && isHoriz(lm, 12, 9)) {
      return ret('H', 0.90);
    }

    // U — both up, tips close together (parallel)
    if (dist2d(lm[8], lm[12]) < 0.04) return ret('U', 0.92);

    // V — both up, spread apart
    return ret('V', 0.93);
  }

  // ── LAYER 7: INDEX + PINKY (devil horns / ILY) ────────────────

  if (I && !M && !R && P) {
    if (tSide) return ret('I love you', 0.95);
    return ret('ILY', 0.91);
  }

  // ── LAYER 8: THREE FINGERS ────────────────────────────────────

  // Index + Middle + Ring (no pinky)
  if (I && M && R && !P) {
    if (tSide) return ret('3', 0.93);
    return ret('W', 0.92);
  }

  // Index + Middle + Pinky (no ring)
  if (I && M && !R && P) {
    return ret('13', 0.90);
  }

  // ── LAYER 9: FOUR FINGERS ─────────────────────────────────────

  if (I && M && R && P) {
    // B — four fingers up, thumb folded flat across palm
    if (!tUp && !tSide && !tDown) return ret('B', 0.93);
    if (tSide) return ret('4', 0.93);
    return ret('B', 0.90);
  }

  // ── LAYER 10: FIVE FINGERS (four + thumb visible) ─────────────

  if (I && M && R && P && tUp)   return ret('Hello', 0.96);
  if (I && M && R && P && tSide) return ret('5',     0.95);

  // ── FALLBACK ──────────────────────────────────────────────────

  // C — all fingers partially curved (not fully up, not fully curled)
  // Detected here because it doesn't fit extended or curled cleanly
  const midCurve =
    lm[8].y > lm[6].y &&   // index tip below PIP (bent)
    lm[8].y < lm[5].y &&   // but above MCP (not fully curled)
    lm[12].y > lm[10].y && // same for middle
    lm[12].y < lm[9].y;
  if (midCurve) return ret('C', 0.90);

  return ret('Unknown', 0.5);
}
