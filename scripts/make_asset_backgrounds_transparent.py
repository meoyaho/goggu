#!/usr/bin/env python3
import os
from collections import deque

from extract_reference_png_assets import read_png, write_png


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")


def background_score(pixel):
    r, g, b, _ = pixel
    brightness = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    return brightness, spread


def is_background_like(pixel, threshold=246, max_spread=8):
    brightness, spread = background_score(pixel)
    return brightness >= threshold and spread <= max_spread


def connected_edge_background(rows, threshold=238):
    height = len(rows)
    width = len(rows[0])
    seen = [[False] * width for _ in range(height)]
    queue = deque()

    def push(x, y):
        if not seen[y][x] and is_background_like(rows[y][x], threshold):
            seen[y][x] = True
            queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height:
                push(nx, ny)

    return seen


def soften_background_edge(rows, mask):
    height = len(rows)
    width = len(rows[0])
    output = []

    for y, row in enumerate(rows):
        output_row = []
        for x, (r, g, b, _a) in enumerate(row):
            if mask[y][x]:
                output_row.append((r, g, b, 0))
                continue

            a = 255
            neighbor_background = False
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    if mask[ny][nx]:
                        neighbor_background = True
                        break
                if neighbor_background:
                    break

            if neighbor_background:
                brightness, spread = background_score((r, g, b, a))
                if brightness >= 242 and spread <= 12:
                    a = max(80, min(a, int((255 - brightness) * 8)))

            output_row.append((r, g, b, a))
        output.append(output_row)

    return output


def make_transparent(path):
    width, height, rows = read_png(path)
    mask = connected_edge_background(rows)
    output = soften_background_edge(rows, mask)
    write_png(path, width, height, output)
    transparent = sum(1 for row in output for pixel in row if pixel[3] == 0)
    translucent = sum(1 for row in output for pixel in row if 0 < pixel[3] < 255)
    return transparent, translucent


def main():
    filenames = sorted(
        filename
        for filename in os.listdir(ASSETS)
        if filename.startswith("asset-") and filename.endswith(".png")
    )
    for filename in filenames:
        transparent, translucent = make_transparent(os.path.join(ASSETS, filename))
        print(f"{filename}: transparent={transparent} translucent={translucent}")


if __name__ == "__main__":
    main()
