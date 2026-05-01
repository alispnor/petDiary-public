#!/usr/bin/env python3
"""
Gera todos os ícones e assets do petDiary a partir das fontes em logotipo/.

Fontes esperadas (PNGs quadrados, recomendado 2048x2048):
- logotipo/petDiaryLogo.png       — versão LIGHT (para fundos claros)
- logotipo/petDiaryLogoDark.png   — versão DARK opcional (para tema escuro)

Uso:
    python3 logotipo/generate-icons.py

Saídas (light):
- petDiary-frontend-mobile/assets/icon.png            1024x1024
- petDiary-frontend-mobile/assets/adaptive-icon.png   1024x1024
- petDiary-frontend-mobile/assets/splash.png          1284x2778
- petDiary-frontend-mobile/assets/favicon.png         48x48
- petDiary-frontend-web/public/favicon.ico            multi-tamanho
- petDiary-frontend-web/public/favicon-{16,32}.png
- petDiary-frontend-web/public/apple-touch-icon.png   180x180
- petDiary-frontend-web/public/logo-{192,512}.png     (PWA)
- logotipo/exports/round-512.png, banner-1280x640.png, logo-{64,128,256}.png

Saídas (dark — só se petDiaryLogoDark.png existir):
- petDiary-frontend-web/public/logo-dark-{192,512}.png
- petDiary-frontend-mobile/assets/icon-dark.png       1024x1024
- petDiary-frontend-mobile/assets/splash-dark.png     1284x2778
- logotipo/exports/round-dark-512.png
"""

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC_LIGHT = ROOT / "logotipo" / "petDiaryLogo.png"
SRC_DARK = ROOT / "logotipo" / "petDiaryLogoDark.png"

MOBILE_ASSETS = ROOT / "petDiary-frontend-mobile" / "assets"
WEB_PUBLIC = ROOT / "petDiary-frontend-web" / "public"
EXPORTS = ROOT / "logotipo" / "exports"

# Backgrounds dos splashes — derivados dos tokens da marca em ai-memory/10
SPLASH_BG_LIGHT = (244, 241, 235, 255)  # --color-bg-app
SPLASH_BG_DARK = (28, 28, 32, 255)      # cinza muito escuro p/ fundo dark


def ensure_dirs():
    for d in (MOBILE_ASSETS, WEB_PUBLIC, EXPORTS):
        d.mkdir(parents=True, exist_ok=True)


def load_source(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"Logo source not found: {path}")
    img = Image.open(path).convert("RGBA")
    print(f"  Source: {path.name} ({img.size[0]}x{img.size[1]})")
    return img


def resize(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


def with_padding(img: Image.Image, size: int, padding_ratio: float = 0.15,
                 bg=(255, 255, 255, 255)) -> Image.Image:
    """Para adaptive-icon do Android — precisa ter área segura no centro."""
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * (1 - 2 * padding_ratio))
    resized = img.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(resized, (offset, offset), resized)
    return canvas


def make_splash(img: Image.Image, w: int, h: int, bg=SPLASH_BG_LIGHT) -> Image.Image:
    """Centraliza logo num fundo neutro do tamanho do splash."""
    canvas = Image.new("RGBA", (w, h), bg)
    target = int(min(w, h) * 0.45)
    resized = img.resize((target, target), Image.LANCZOS)
    canvas.paste(resized, ((w - target) // 2, (h - target) // 2), resized)
    return canvas


def make_round(img: Image.Image, size: int) -> Image.Image:
    resized = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(resized, (0, 0), mask)
    return out


def make_banner(img: Image.Image, w: int, h: int, bg=SPLASH_BG_LIGHT) -> Image.Image:
    canvas = Image.new("RGBA", (w, h), bg)
    target = int(h * 0.85)
    resized = img.resize((target, target), Image.LANCZOS)
    canvas.paste(resized, ((w - target) // 2, (h - target) // 2), resized)
    return canvas


def save(img: Image.Image, path: Path, **kwargs):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, **kwargs)
    print(f"  ✓ {path.relative_to(ROOT)}")


def main():
    ensure_dirs()
    src = load_source(SRC_LIGHT)

    print("\n[Mobile / Expo — LIGHT]")
    save(resize(src, 1024), MOBILE_ASSETS / "icon.png")
    save(with_padding(src, 1024), MOBILE_ASSETS / "adaptive-icon.png")
    save(make_splash(src, 1284, 2778), MOBILE_ASSETS / "splash.png")
    save(resize(src, 48), MOBILE_ASSETS / "favicon.png")

    print("\n[Web / Vite — LIGHT]")
    save(resize(src, 16), WEB_PUBLIC / "favicon-16.png")
    save(resize(src, 32), WEB_PUBLIC / "favicon-32.png")
    save(resize(src, 180), WEB_PUBLIC / "apple-touch-icon.png")
    save(resize(src, 192), WEB_PUBLIC / "logo-192.png")
    save(resize(src, 512), WEB_PUBLIC / "logo-512.png")
    save(
        resize(src, 64),
        WEB_PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )

    print("\n[Exports utilitários — LIGHT]")
    save(make_round(src, 512), EXPORTS / "round-512.png")
    save(make_banner(src, 1280, 640), EXPORTS / "banner-1280x640.png")
    save(resize(src, 256), EXPORTS / "logo-256.png")
    save(resize(src, 128), EXPORTS / "logo-128.png")
    save(resize(src, 64), EXPORTS / "logo-64.png")

    # ----------------------------------------
    # Variante DARK (opcional)
    # ----------------------------------------
    if SRC_DARK.exists():
        print("\n[Variante DARK — encontrada]")
        dark = load_source(SRC_DARK)

        print("\n[Mobile / Expo — DARK]")
        save(resize(dark, 1024), MOBILE_ASSETS / "icon-dark.png")
        save(
            make_splash(dark, 1284, 2778, bg=SPLASH_BG_DARK),
            MOBILE_ASSETS / "splash-dark.png",
        )

        print("\n[Web / Vite — DARK]")
        save(resize(dark, 192), WEB_PUBLIC / "logo-dark-192.png")
        save(resize(dark, 512), WEB_PUBLIC / "logo-dark-512.png")

        print("\n[Exports — DARK]")
        save(make_round(dark, 512), EXPORTS / "round-dark-512.png")
        save(
            make_banner(dark, 1280, 640, bg=SPLASH_BG_DARK),
            EXPORTS / "banner-dark-1280x640.png",
        )
    else:
        print(f"\n[DARK skip] {SRC_DARK.name} não encontrado — gerando só light.")

    print("\n✅ Tudo gerado.")


if __name__ == "__main__":
    main()
