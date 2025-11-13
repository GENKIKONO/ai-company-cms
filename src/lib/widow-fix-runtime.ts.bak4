export function applyJapaneseSoftBreaks(root: ParentNode = document) {
  const targets = root.querySelectorAll<HTMLElement>([
    'h1.jp-heading','h2.jp-heading','p.jp-body',
    '.lead','.hero-lead','.section-lead'
  ].join(','));
  targets.forEach(el => {
    if (el.dataset.softbreakApplied === '1') return;
    // 句読点・中点の直後にゼロ幅スペースを注入（重複注入は抑制）
    el.innerHTML = el.innerHTML
      .replace(/([、。・])(?!\u200B)/g, '$1\u200B');
    el.dataset.softbreakApplied = '1';
  });
}