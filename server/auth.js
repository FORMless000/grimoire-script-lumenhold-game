/*
 * Who may do what on the server (design §1.2). Three levels:
 *
 *   public   the game files, /api/health, minting a player code (POST /api/player)
 *   player   X-Player: <code>   own saves, own seen counters, own run logs
 *   admin    X-Admin-Token (or ?token=) = ADMIN_TOKEN   /admin and the read-everything APIs
 *
 * A player code is also the sync code: entering it on another device shares that player's saves. The server
 * keeps only a hash of it (the player id, `pid`), so the data directory holds no codes.
 * Limits are in memory and reset on restart; that's enough to keep a playtest server tidy.
 */
'use strict';
const crypto = require('crypto');

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford base32: no I, L, O, U
const CODE = /^[0-9A-HJKMNP-TV-Z]{16}$/;

// 80 random bits as XXXX-XXXX-XXXX-XXXX.
function newCode() {
  const bytes = crypto.randomBytes(10);
  let bits = 0, acc = 0, out = '';
  for (const b of bytes) { acc = (acc << 8) | b; bits += 8; while (bits >= 5) { bits -= 5; out += ALPHABET[(acc >> bits) & 31]; } }
  return out.match(/.{4}/g).join('-');
}
// Canonical form of a typed or pasted code (case, dashes, spaces and the look-alikes O/I/L forgiven), or null.
function normalizeCode(s) {
  if (typeof s !== 'string') return null;
  const c = s.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  return CODE.test(c) ? c : null;
}
const pidOf = (code) => crypto.createHash('sha256').update('lumenhold-player:' + code).digest('hex').slice(0, 24);
const sameSecret = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Fixed-window counters: allow(key) is true while key has made fewer than `max` calls in the current window.
function limiter(max, windowMs) {
  const hits = new Map();
  let windowStart = Date.now();
  return function allow(key) {
    const now = Date.now();
    if (now - windowStart > windowMs) { hits.clear(); windowStart = now; }
    const n = (hits.get(key) || 0) + 1;
    hits.set(key, n);
    return n <= max;
  };
}

// opts: {token, requireToken, invite, trustProxy, maxPlayers, mintsPerHour, writesPerMinute}
function createAuth(opts = {}) {
  const o = Object.assign({ token: null, requireToken: false, invite: null, trustProxy: false, maxPlayers: 1000, mintsPerHour: 5, writesPerMinute: 240 }, opts);
  const mintOk = limiter(o.mintsPerHour, 60 * 60 * 1000);
  const writeOk = limiter(o.writesPerMinute, 60 * 1000);
  return {
    inviteRequired: !!o.invite,
    clientIp(req) {
      const fwd = o.trustProxy && req.headers['x-forwarded-for'];
      return fwd ? String(fwd).split(',')[0].trim() : req.socket.remoteAddress || '?';
    },
    isAdmin(req, url) {
      if (!o.requireToken) return true;
      return !!o.token && (sameSecret(req.headers['x-admin-token'], o.token) || sameSecret(url.searchParams.get('token'), o.token));
    },
    // The player's code from the request, normalized, or null.
    playerCode(req) { return normalizeCode(req.headers['x-player']); },
    // Throws an httpError-shaped error when this IP may not mint now; checks the invite.
    checkMint(req, body, playerCount) {
      if (o.invite && !sameSecret(normalizeInvite(body && body.invite), normalizeInvite(o.invite))) return [403, 'invite code required'];
      if (playerCount >= o.maxPlayers) return [503, 'no room for new players'];
      if (!mintOk(this.clientIp(req))) return [429, 'too many new players from this address; try later'];
      return null;
    },
    allowWrite(req) { return writeOk(this.clientIp(req)); },
  };
}
const normalizeInvite = (s) => (typeof s === 'string' ? s.trim() : '');

module.exports = { createAuth, newCode, normalizeCode, pidOf, limiter };
