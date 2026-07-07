# GPU Budget — Self-host GLM/Qwen3

Інтерактивний одностраничний кошторис оренди GPU під self-host open-weight LLM
(GLM / Qwen3) для malware-research / security lab. Порахуй місячну вартість
on-demand pod (RunPod / Vast.ai), обери модель під наявне залізо.

**Живий сайт:** https://vasilypolyuhovich.github.io/gpu-budget-calculator/

## Що вміє

- **Живий калькулятор** — год/день × днів/міс × $/год + volume.
- **Редаговані ціни** — додавай/видаляй GPU-пресети й ставки; зберігаються в
  `localStorage` браузера.
- **Share-лінк** — «Скопіювати лінк з цінами» вшиває твою конфігурацію в URL
  (`?c=<base64>`), щоб поділитися готовим кошторисом.
- Готові сценарії, порівняння моделей (GLM-4.5-Air / Qwen3 / …) і чеклист
  налаштування vLLM.

## Формула

```
Разом_міс = ( год/день × днів/міс × $/год ) + volume_міс
```

## Локально

Жодних залежностей — статичний `index.html`. Просто відкрий у браузері або:

```bash
python3 -m http.server 8000   # → http://localhost:8000
```

## Стек

Vanilla HTML/CSS/JS, один файл, self-contained. Theme-aware (light/dark).

---

Ціни — оцінки станом на середину 2026; GPU-маркетплейси змінюють ставки щодня.
Звіряй live-ставку перед деплоєм.
