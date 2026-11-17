declare module 'apca-w3' {
  export function calcAPCA(
    textColor: string | number[] | Record<string, unknown>,
    bgColor: string | number[] | Record<string, unknown>,
    places?: number,
    round?: boolean
  ): number;

  export function APCAcontrast(txtY: number, bgY: number, places?: number): number;
  export function sRGBtoY(rgb: number[] | string | number): number;
  export function fontLookupAPCA(contrast: number, places?: number): (number | string)[];
  export function alphaBlend(rgbaFG: number[], rgbBG: number[], round?: boolean): number[];
}
