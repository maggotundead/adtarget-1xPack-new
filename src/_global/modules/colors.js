import {
  useMode,
  modeRgb,
  // modeHsl,
  modeOkhsl,
  modeOklch,
  modeOklab,
  modeLab65,

  // displayable,
  formatHex,
  // formatHsl,
  // clampChroma,
  // interpolate,
  // samples,
  // fixupHueLonger,
  // easingInOutSine,
  // easingSmoothstep,
  // easingSmootherstep,
  formatCss
} from 'culori/fn';


import { utils } from './utils';

const rgb = useMode(modeRgb);
const oklch = useMode(modeOklch);
const oklab = useMode(modeOklab);
// const hsl = useMode(modeHsl);
const okhsl = useMode(modeOkhsl);
const lab65 = useMode(modeLab65);


export function generateColorScheme(colorObj) {

  const root = document.documentElement;

  // triadic:
  const hueSteps = [0, 120, 240];

  // splitComplementary:
  // const hueSteps = [0, 150, 210];

  // --

  // Local copy
  const colors = JSON.parse(JSON.stringify(colorObj));

  colors.primary = okhsl(colors.primary) ?? okhsl({ h: 250, s: 0.75, l: 0.6 });

  // console.log(colors.primary);


  colors.secondary ??= {
    l: (colors.primary.l < 0.01 || colors.primary.l > 0.99) ? 0.6 : colors.primary.l,
    s: colors.primary.s || 0.75,
    h: adjustHue((colors.primary.h ?? 250) + hueSteps[1])
  };
  colors.secondary = okhsl(colors.secondary);

  colors.accent ??= {
    l: (colors.primary.l < 0.01 || colors.primary.l > 0.99) ? 0.6 : colors.primary.l,
    s: colors.primary.s || 0.75,
    h: adjustHue((colors.primary.h ?? 250) + hueSteps[2])
  };
  colors.accent = okhsl(colors.accent);


  colors.neutral = {
    ...colors.primary,
    l: (colors.primary.l < 0.01 || colors.primary.l > 0.99) ? 0.6 : colors.primary.l,
    s: utils.clamp(colors.primary.s, 0, 0.15)
  };

  // Shade steps
  const colorShades = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98];


  for (let c in colors) {

    root.style.setProperty(`--color-${c}`, formatHex(colors[c]));
    root.style.setProperty(`--color-${c}-hue`, colors[c].h ?? 0);

    // console.log(`----------${c}----------`);

    // Texts

    let textDark = { ...colors[c] };
    let textLight = { ...colors[c] };
    let textMuted = { ...colors[c] };

    // 2do
    // add text shades...

    textDark.l = 0.2;
    textDark.s = textDark.s != 0 ? 0.15 : 0;
    // if (!displayable(textDark))
    //   textDark = clampChroma(textDark);

    textLight.l = 0.95;
    textLight.s = textLight.s != 0 ? 0.15 : 0;
    // if (!displayable(textLight))
    //   textLight = clampChroma(textLight);

    textMuted.l = 0.6;
    textMuted.s = textMuted.s != 0 ? 0.1 : 0;
    // if (!displayable(textMuted))
    //   textMuted = clampChroma(textMuted);


    root.style.setProperty(`--color-text-${c}`, formatHex(textDark));
    root.style.setProperty(`--color-text-${c}-muted`, formatHex(textMuted));
    root.style.setProperty(`--color-text-${c}-inverse`, formatHex(textLight));
    root.style.setProperty(`--color-on-${c}`, isTextBlack(colors[c]) ? `var(--color-text-${c})` : `var(--color-text-${c}-inverse)`);

    // Shades

    colorShades.forEach((id, i) => {

      let shade = okhsl({ ...colors[c] });

      shade.l = id / 100;
      if (c !== "neutral") {
        // shade.s = computeScaleChroma(shade.l, 0.5, Math.min(shade.s, 0.9));
        shade.s = utils.clamp(shade.s, 0, 0.9); // Limit max saturation?
      }
      // console.log(shade.s);
      shade.h = computeScaleHue(shade.l, colors[c].h);

      // if (!displayable(shade))
      //   shade = clampChroma(shade);

      root.style.setProperty(`--color-${c}-${id}`, formatHex(shade));
      root.style.setProperty(`--color-on-${c}-${id}`, isTextBlack(shade) ? `var(--color-text-${c})` : `var(--color-text-${c}-inverse)`);

      // console.log(formatHex(shade)));
    });

  }

  root.style.setProperty("--gradient-prim-sec", `in oklab, ${formatHex(colors.primary)}, ${formatHex(colors.secondary)}`);
  root.style.setProperty("--gradient-prim-acc", `in oklab, ${formatHex(colors.primary)}, ${formatHex(colors.accent)}`);
  root.style.setProperty("--gradient-sec-acc", `in oklab, ${formatHex(colors.secondary)}, ${formatHex(colors.accent)}`);
}

// hue, chroma, and lightness functions
const computeScaleHue = (scaleValue, baseHue) => baseHue - 5 * (1 - scaleValue);

const computeScaleChroma = (scaleValue, minChroma, maxChroma) => {
  const chromaDifference = maxChroma - minChroma;
  return (
    -4 * chromaDifference * Math.pow(scaleValue, 2) +
    4 * chromaDifference * scaleValue +
    minChroma
  );
};


function isTextBlack(color) {
  return dpsContrast(color, "black") > dpsContrast(color, "white");
}

/*
  Delta Phi Star perceptual lightness contrast by Andrew Somers:
  https://github.com/Myndex/deltaphistar 
*/

const PHI = 0.5 + Math.sqrt(1.25);

function dpsContrast(a, b) {
  const dps = Math.abs(Math.pow(lab65(a).l, PHI) - Math.pow(lab65(b).l, PHI));
  const contrast = Math.pow(dps, 1 / PHI) * Math.SQRT2 - 40;
  return contrast < 7.5 ? 0 : contrast;
}

function adjustHue(hue) {
  if (hue < 0) hue += Math.ceil(-hue / 360) * 360;

  return hue % 360;
}