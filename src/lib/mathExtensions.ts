export function randBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
export function betterMod(num1: number, num2: number) {
    "use strict";
    return ((num1 % num2) + num2) % num2;
}
