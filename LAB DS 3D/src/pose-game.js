const visible = (point) => point && (point.visibility ?? 1) > 0.42;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const closeness = (value, target, tolerance) => clamp01(1 - Math.abs(value - target) / tolerance);

const POSES = [
  {
    name: "Pose em T",
    icon: "┼",
    hint: "Abra os braços na altura dos ombros.",
    evaluate(points) {
      const ls = points[11], rs = points[12], lw = points[15], rw = points[16], le = points[13], re = points[14];
      if (![ls,rs,lw,rw,le,re].every(visible)) return 0;
      const horizontal = (closeness(lw.y, ls.y, .16) + closeness(rw.y, rs.y, .16) + closeness(le.y, ls.y, .14) + closeness(re.y, rs.y, .14)) / 4;
      const spread = clamp01((Math.abs(lw.x-rw.x)-.48)/.35);
      return (horizontal * .72 + spread * .28) * 100;
    }
  },
  {
    name: "Mãos ao alto",
    icon: "Y",
    hint: "Levante as duas mãos acima da cabeça.",
    evaluate(points) {
      const nose = points[0], lw = points[15], rw = points[16], le = points[13], re = points[14];
      if (![nose,lw,rw,le,re].every(visible)) return 0;
      const hands = (clamp01((nose.y-lw.y)/.25) + clamp01((nose.y-rw.y)/.25))/2;
      const elbows = (clamp01((le.y-lw.y)/.25) + clamp01((re.y-rw.y)/.25))/2;
      return (hands*.72+elbows*.28)*100;
    }
  },
  {
    name: "Vitória diagonal",
    icon: "⌁",
    hint: "Uma mão para cima e a outra para baixo.",
    evaluate(points) {
      const nose=points[0], lw=points[15], rw=points[16], lh=points[23], rh=points[24];
      if (![nose,lw,rw,lh,rh].every(visible)) return 0;
      const optionA=(clamp01((nose.y-lw.y)/.22)+clamp01((rw.y-rh.y+.04)/.28))/2;
      const optionB=(clamp01((nose.y-rw.y)/.22)+clamp01((lw.y-lh.y+.04)/.28))/2;
      return Math.max(optionA,optionB)*100;
    }
  },
  {
    name: "Agachamento",
    icon: "⌄",
    hint: "Dobre os joelhos e abaixe o quadril.",
    evaluate(points) {
      const ls=points[11], rs=points[12], lh=points[23], rh=points[24], lk=points[25], rk=points[26];
      if (![ls,rs,lh,rh,lk,rk].every(visible)) return 0;
      const torsoMid=(ls.y+rs.y)/2;
      const hipMid=(lh.y+rh.y)/2;
      const kneeMid=(lk.y+rk.y)/2;
      const compact=closeness(kneeMid-hipMid,.14,.18);
      const lowered=clamp01((hipMid-torsoMid-.2)/.24);
      return (compact*.62+lowered*.38)*100;
    }
  },
  {
    name: "Guardião",
    icon: "◇",
    hint: "Mantenha os cotovelos abertos e as mãos perto do rosto.",
    evaluate(points) {
      const nose=points[0], lw=points[15], rw=points[16], le=points[13], re=points[14], ls=points[11], rs=points[12];
      if (![nose,lw,rw,le,re,ls,rs].every(visible)) return 0;
      const handsNear=(closeness(Math.hypot(lw.x-nose.x,lw.y-nose.y),.22,.18)+closeness(Math.hypot(rw.x-nose.x,rw.y-nose.y),.22,.18))/2;
      const elbowsWide=clamp01((Math.abs(le.x-re.x)-.25)/.35);
      return (handsNear*.68+elbowsWide*.32)*100;
    }
  },
  {
    name: "Inclinação de cabeça",
    icon: "◒",
    hint: "Incline a cabeça para um dos lados mantendo os ombros retos.",
    evaluate(points) {
      const leye=points[2], reye=points[5], ls=points[11], rs=points[12];
      if (![leye,reye,ls,rs].every(visible)) return 0;
      const headTilt=clamp01((Math.abs(leye.y-reye.y)-.018)/.075);
      const shoulderLevel=closeness(ls.y,rs.y,.09);
      return (headTilt*.7+shoulderLevel*.3)*100;
    }
  }
];

export class PoseGame {
  constructor({ onPose = () => {}, onScore = () => {}, onSuccess = () => {} } = {}) {
    this.onPose = onPose;
    this.onScore = onScore;
    this.onSuccess = onSuccess;
    this.index = 0;
    this.active = false;
    this.holdStarted = null;
    this.completedCurrent = false;
    this.best = 0;
    this.emitPose();
  }

  setActive(active) {
    this.active = Boolean(active);
    this.holdStarted = null;
  }

  next() {
    this.index = (this.index + 1) % POSES.length;
    this.holdStarted = null;
    this.completedCurrent = false;
    this.emitPose();
  }

  emitPose() { this.onPose(POSES[this.index]); }

  update(pose, now = performance.now()) {
    if (!this.active || !pose?.length) {
      if (this.active) this.onScore({ accuracy: 0, hold: 0 });
      return;
    }
    const accuracy = Math.round(POSES[this.index].evaluate(pose));
    this.best = Math.max(this.best, accuracy);
    if (accuracy >= 82) {
      if (!this.holdStarted) this.holdStarted = now;
      const hold = Math.min(1, (now - this.holdStarted) / 1450);
      this.onScore({ accuracy, hold });
      if (hold >= 1 && !this.completedCurrent) {
        this.completedCurrent = true;
        this.onSuccess({ pose: POSES[this.index], accuracy });
        setTimeout(() => this.next(), 900);
      }
    } else {
      this.holdStarted = null;
      this.completedCurrent = false;
      this.onScore({ accuracy, hold: 0 });
    }
  }
}
