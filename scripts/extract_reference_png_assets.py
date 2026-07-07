#!/usr/bin/env python3
import os
import struct
import zlib
from collections import deque


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
TABLE_SOURCE = os.path.join(ASSETS, "img1.png")
ITEM_SOURCE = os.path.join(ASSETS, "img2.png")


def paeth(a, b, c):
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def read_png(path):
    with open(path, "rb") as f:
        data = f.read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")

    pos = 8
    width = height = bit_depth = color_type = interlace = None
    idat = []

    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        chunk_type = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        pos += 12 + length

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(">IIBBBBB", chunk)
        elif chunk_type == b"IDAT":
            idat.append(chunk)
        elif chunk_type == b"IEND":
            break

    if bit_depth != 8 or interlace != 0 or color_type not in (2, 6):
        raise ValueError(f"{path} must be non-interlaced 8-bit RGB/RGBA PNG")

    channels = 4 if color_type == 6 else 3
    stride = width * channels
    raw = zlib.decompress(b"".join(idat))
    rows = []
    offset = 0
    prev = [0] * stride

    for _ in range(height):
        filt = raw[offset]
        offset += 1
        row = list(raw[offset:offset + stride])
        offset += stride

        for i, value in enumerate(row):
            left = row[i - channels] if i >= channels else 0
            up = prev[i]
            up_left = prev[i - channels] if i >= channels else 0
            if filt == 1:
                row[i] = (value + left) & 255
            elif filt == 2:
                row[i] = (value + up) & 255
            elif filt == 3:
                row[i] = (value + ((left + up) // 2)) & 255
            elif filt == 4:
                row[i] = (value + paeth(left, up, up_left)) & 255
            elif filt != 0:
                raise ValueError(f"Unsupported PNG filter {filt}")

        rgba = []
        if channels == 4:
            for x in range(width):
                rgba.append(tuple(row[x * 4:x * 4 + 4]))
        else:
            for x in range(width):
                r, g, b = row[x * 3:x * 3 + 3]
                rgba.append((r, g, b, 255))

        rows.append(rgba)
        prev = row

    return width, height, rows


def png_chunk(name, data):
    return (
        struct.pack(">I", len(data))
        + name
        + data
        + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)
    )


def write_png(path, width, height, rows):
    raw = bytearray()
    for row in rows:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", ihdr)
        + png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + png_chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(data)


def crop(rows, box):
    x1, y1, x2, y2 = box
    return [row[x1:x2] for row in rows[y1:y2]]


def is_background_like(pixel, threshold=232):
    r, g, b, _ = pixel
    return min(r, g, b) >= threshold and max(r, g, b) - min(r, g, b) <= 30


def clear_connected_background(rows, threshold=232):
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

    output = []
    for y, row in enumerate(rows):
        out_row = []
        for x, (r, g, b, a) in enumerate(row):
            out_row.append((r, g, b, 0 if seen[y][x] else a))
        output.append(out_row)
    return output


def trim(rows, padding=8):
    height = len(rows)
    width = len(rows[0])
    xs = []
    ys = []
    for y, row in enumerate(rows):
        for x, pixel in enumerate(row):
            if pixel[3] > 0:
                xs.append(x)
                ys.append(y)
    if not xs:
        return rows
    x1 = max(min(xs) - padding, 0)
    y1 = max(min(ys) - padding, 0)
    x2 = min(max(xs) + padding + 1, width)
    y2 = min(max(ys) + padding + 1, height)
    return crop(rows, (x1, y1, x2, y2))


def save_cutout(source_rows, box, filename, threshold=232, padding=10):
    rows = crop(source_rows, box)
    rows = clear_connected_background(rows, threshold)
    rows = trim(rows, padding)
    write_png(os.path.join(ASSETS, filename), len(rows[0]), len(rows), rows)


def main():
    _, _, table_source = read_png(TABLE_SOURCE)
    _, _, item_source = read_png(ITEM_SOURCE)

    cutouts = [
        ("asset-pig-head.png", (58, 86, 462, 468), 220, 14),
        ("asset-candle.png", (528, 28, 690, 468), 220, 12),
        ("asset-incense-burner.png", (710, 28, 962, 468), 220, 12),
        ("asset-apples.png", (976, 96, 1362, 462), 220, 12),
        ("asset-rice-bowl.png", (72, 535, 360, 785), 220, 12),
        ("asset-ricecake-bowl.png", (402, 522, 708, 795), 220, 12),
        ("asset-pear-bowl.png", (738, 508, 990, 798), 220, 12),
        ("asset-flower-vase.png", (1075, 486, 1338, 832), 220, 12),
        ("asset-wood-cup.png", (350, 810, 565, 1045), 220, 10),
        ("asset-lucky-pouch.png", (620, 775, 902, 1078), 220, 12),
    ]

    for filename, box, threshold, padding in cutouts:
        save_cutout(item_source, box, filename, threshold, padding)

    save_cutout(table_source, (60, 442, 1196, 838), "asset-ritual-table.png", 238, 16)


if __name__ == "__main__":
    main()
