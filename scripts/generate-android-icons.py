#!/usr/bin/env python3
"""Regenerate Android adaptive icon assets with safe-zone padding."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
SOURCE = ASSETS / "icon.png"
SIZE = 1024
# Android adaptive icon safe zone is the inner ~66%; use 50% for squircle launchers.
LOGO_SCALE = 0.50
WHITE = (255, 255, 255, 255)


def load_source() -> Image.Image:
    return Image.open(SOURCE).convert("RGBA")


WHITE_BG_THRESHOLD = 240


def is_background_pixel(r: int, g: int, b: int, a: int) -> bool:
    return a < 16 or (r >= WHITE_BG_THRESHOLD and g >= WHITE_BG_THRESHOLD and b >= WHITE_BG_THRESHOLD)


def strip_white_background(image: Image.Image) -> Image.Image:
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if is_background_pixel(r, g, b, a):
                pixels[x, y] = (255, 255, 255, 0)
    return image


def scale_to_canvas(source: Image.Image, scale: float) -> Image.Image:
    target = int(round(SIZE * scale))
    ratio = min(target / source.width, target / source.height)
    resized = source.resize(
        (max(1, int(round(source.width * ratio))), max(1, int(round(source.height * ratio)))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    offset = ((SIZE - resized.width) // 2, (SIZE - resized.height) // 2)
    canvas.paste(resized, offset, resized)
    return strip_white_background(canvas)


def make_background() -> Image.Image:
    return Image.new("RGB", (SIZE, SIZE), (255, 255, 255))


def make_monochrome(source: Image.Image, scale: float) -> Image.Image:
    scaled = scale_to_canvas(source, scale)
    pixels = scaled.load()
    for y in range(SIZE):
        for x in range(SIZE):
            r, g, b, a = pixels[x, y]
            if a < 16:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                pixels[x, y] = (255, 255, 255, 255)
    return scaled


def main() -> None:
    source = load_source()
    foreground = scale_to_canvas(source, LOGO_SCALE)
    background = make_background()
    monochrome = make_monochrome(source, LOGO_SCALE)

    foreground.save(ASSETS / "android-icon-foreground.png", optimize=True)
    background.save(ASSETS / "android-icon-background.png", optimize=True)
    monochrome.save(ASSETS / "android-icon-monochrome.png", optimize=True)

    print(f"Generated Android icons from {SOURCE.name} at {int(LOGO_SCALE * 100)}% scale.")


if __name__ == "__main__":
    main()
