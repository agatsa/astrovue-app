import { BASE_URL } from "../config/constants";
export function populateAstroBondFromDailyEnergy(my, other) {
    const userDasha = `${my.mahadasha} > ${my.antardasha}`;
    const otherDasha = `${other.mahadasha} > ${other.antardasha}`;
    const sameDasha = my.mahadasha === other.mahadasha;
    const sameAntar = my.antardasha === other.antardasha;
  
    const bondStrength = sameDasha ? (sameAntar ? 0.88 : 0.8) : 0.72;
  
    const dashaInfo = `You are in ${userDasha}. They are in ${otherDasha}.`;
    const planetSummary = `Jupiter influences both charts — guiding this bond through wisdom and growth.`;
  
    const chakraMap = {
      Mercury: "Throat",
      Moon: "Heart",
      Mars: "Root",
      Saturn: "Crown",
      Jupiter: "Third Eye",
      Venus: "Sacral",
      Sun: "Solar Plexus",
      Rahu: "Shadow Body",
      Ketu: "Karmic Spine"
    };
    const chakra1 = chakraMap[my.antardasha] || "Unknown";
    const chakra2 = chakraMap[other.antardasha] || "Unknown";
    const chakraImpact = chakra1 === chakra2
      ? `Both of you may feel sensitivity in your ${chakra1} Chakra today.`
      : `Your ${chakra1} Chakra and their ${chakra2} Chakra may be activated.`;
  
    const transitNote = `Mars retrograde in October 2025 may stir emotions — especially with your current Ketu-Moon overlay.`;
  
    const timeline = [];
    if (sameDasha) {
      timeline.push({ phase: "Shared Mahadasha", period: "Now till overlap ends" });
    }
    if (sameAntar) {
      timeline.push({ phase: "Antardasha Sync", period: "This month" });
    }
    timeline.push({ phase: "Growth Window", period: "Jul–Sep 2025" });
  
    const remedy = `Offer white flowers or chant '${my.antardasha === "Moon" ? "Om Chandraya Namah" : "Om Gurave Namah"}' 11 times to balance current energies.`;
  
    return {
      dashaInfo,
      planetSummary,
      chakraImpact,
      transitNote,
      timeline,
      remedy,
      moonSign: other.moonSign,
      bondStrength
    };
  }
  