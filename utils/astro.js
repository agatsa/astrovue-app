import sweph from 'sweph';
import moment from 'moment-timezone';

const SE = sweph;

// Hardcoded birth details
const birthDate = { year: 1980, month: 1, day: 20 };
const birthTime = { hour: 0, minute: 25 };
const birthCoords = { lat: 26.4499, lon: 80.3319 }; // Kanpur
const tzOffset = 5.5; // +5:30

function toJulianDay(dateTime) {
  const utc = moment.tz(dateTime, 'Asia/Kolkata').utc();
  return SE.swe_julday(utc.year(), utc.month() + 1, utc.date(), utc.hour() + utc.minute() / 60, SE.SE_GREG_CAL);
}

function getPlanetPosition(jd, planet) {
  const result = SE.swe_calc_ut(jd, planet, SE.SEFLG_SWIEPH);
  return result[0]; // longitude
}

function getMoonSign(moonLong) {
  const signs = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  return signs[Math.floor(moonLong / 30)];
}

export function getDailyEnergyScore() {
  const now = new Date();
  const jdNow = toJulianDay(now);

  const moonLong = getPlanetPosition(jdNow, SE.MOON);
  const moonSign = getMoonSign(moonLong);

  // Simulated logic using Moon sign and hardcoded Mahadasha
  const mahadasha = 'Saturn';
  const antardasha = 'Rahu';

  let score = 'NEUTRAL';

  if (['8', '12', '6'].includes(moonSign)) {
    score = 'LOW';
  }
  if (mahadasha === 'Jupiter' && ['Cancer', 'Pisces', 'Sagittarius'].includes(moonSign)) {
    score = 'EXCELLENT';
  }
  if (mahadasha === 'Saturn' && antardasha === 'Rahu') {
    score = 'LOW';
  }

  return {
    score,
    moonSign,
    mahadasha,
    antardasha,
  };
}
