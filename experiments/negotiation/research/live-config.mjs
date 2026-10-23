// Canonical progression retained; only skill-versus-DC sensitivity is halved.
export default {
  "name": "gentler-gap-8",
  "tune": {
    "checkBase": 0.58,
    "checkSlope": 0.013,
    "dcSpread": 0.8,
    "charmWeight": 2,
    "targetBase": 5,
    "targetSlope": 0.025,
    "resolveBase": 18,
    "resolveSlope": 0.25,
    "fatigue": 0.16,
    "skipResolve": 3,
    "spellPower": 1.1,
    "frameWeights": [
      3,
      2.5,
      2.5,
      1.2000000000000002,
      1.5,
      0.8999999999999999
    ],
    "goldTrace": 1,
    "resolveEffort": 1,
    "version": 8,
    "levelGapScale": 0.5
  },
  "effectOverrides": {
    "glamour": {
      "chance": 0.14
    },
    "mend": {
      "health": 2,
      "restoreResolve": 11
    },
    "lodestar": {
      "chance": 0.08,
      "repeatSource": 0.06,
      "suspicion": 2
    },
    "candour": {
      "resolve": 4
    },
    "rime": {
      "suspicionShield": 2,
      "chance": -0.1
    },
    "brace": {
      "resolveShield": 4,
      "duration": 2
    },
    "sleight": {
      "goldDiscount": 0.5,
      "concealGold": true,
      "chance": 0.16,
      "only": [
        "skills:guile"
      ]
    }
  }
};
