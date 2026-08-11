/**
 * Video Teaser block — 2-column layout: editorial text (left) +
 * YouTube-style video thumbnail (right).
 *
 * Authored table layout:
 *   Row 1, Col 1: text content — heading (h2/h3) + body paragraph + CTA anchor
 *   Row 1, Col 2: video link (href = YouTube/video URL) + optional thumbnail
 *                 image + optional video title text
 *
 * The thumbnail is generated from the authored image. If no image is provided
 * a dark placeholder is shown. Clicking the thumbnail area emits a custom
 * 'video-teaser:open' event that the modal block (or any listener) can catch.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [mainRow] = rows;
  if (!mainRow) return;

  const [textCell, videoCell] = [...mainRow.children];

  /* ---- Text side ---- */
  const textSide = document.createElement('div');
  textSide.className = 'video-teaser-text';

  // Red decorators
  const deco = document.createElement('div');
  deco.className = 'video-teaser-decorators';
  deco.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) {
    const sq = document.createElement('span');
    sq.className = 'video-teaser-decorator-sq';
    deco.append(sq);
  }
  textSide.append(deco);

  if (textCell) {
    const heading = textCell.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading) {
      heading.classList.add('video-teaser-heading');
      textSide.append(heading);
    }

    textCell.querySelectorAll('p').forEach((p) => {
      if (!p.querySelector('a')) {
        p.classList.add('video-teaser-body');
        textSide.append(p);
      }
    });

    const anchor = textCell.querySelector('a');
    if (anchor) {
      const ctaWrap = document.createElement('div');
      ctaWrap.className = 'video-teaser-cta-wrap';
      anchor.classList.add('video-teaser-cta');

      const arrow = document.createElement('span');
      arrow.className = 'video-teaser-cta-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      anchor.append(arrow);

      ctaWrap.append(anchor);
      textSide.append(ctaWrap);
    }
  }

  /* ---- Video thumbnail side ---- */
  const videoSide = document.createElement('div');
  videoSide.className = 'video-teaser-media';

  const videoLink = videoCell?.querySelector('a');
  const videoUrl = videoLink?.href || '';
  const thumbnail = videoSide;

  const thumbInner = document.createElement('div');
  thumbInner.className = 'video-teaser-thumb';
  thumbInner.setAttribute('role', 'button');
  thumbInner.setAttribute('tabindex', '0');
  thumbInner.setAttribute('aria-label', 'Play video');

  // Background image
  const pic = videoCell?.querySelector('picture');
  const img = videoCell?.querySelector('img');
  if (pic) {
    pic.classList.add('video-teaser-thumb-img');
    thumbInner.append(pic);
  } else if (img) {
    img.classList.add('video-teaser-thumb-img');
    thumbInner.append(img);
  }

  // Gradient overlays
  const overlayTop = document.createElement('div');
  overlayTop.className = 'video-teaser-overlay video-teaser-overlay-top';
  const overlayBot = document.createElement('div');
  overlayBot.className = 'video-teaser-overlay video-teaser-overlay-bot';
  thumbInner.append(overlayTop, overlayBot);

  // Play button
  const playBtn = document.createElement('div');
  playBtn.className = 'video-teaser-play';
  playBtn.setAttribute('aria-hidden', 'true');
  playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="white" width="22" height="22" aria-hidden="true">
    <path d="M8 5v14l11-7z"/>
  </svg>`;
  thumbInner.append(playBtn);

  // Video title (text nodes from videoCell, not the link or image)
  const videoTitle = [...(videoCell?.childNodes || [])]
    .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .map((n) => n.textContent.trim())
    .join(' ')
    || videoLink?.textContent?.trim()
    || '';

  if (videoTitle) {
    const titleEl = document.createElement('div');
    titleEl.className = 'video-teaser-video-title';
    titleEl.textContent = videoTitle;
    thumbInner.append(titleEl);
  }

  thumbnail.append(thumbInner);
  videoSide.append(thumbInner);

  // Click / keyboard open
  const openVideo = () => {
    if (videoUrl) {
      block.dispatchEvent(new CustomEvent('video-teaser:open', {
        bubbles: true,
        detail: { url: videoUrl, title: videoTitle },
      }));
    }
  };

  thumbInner.addEventListener('click', openVideo);
  thumbInner.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openVideo();
    }
  });

  /* ---- Assemble ---- */
  const inner = document.createElement('div');
  inner.className = 'video-teaser-inner';
  inner.append(textSide, videoSide);

  block.textContent = '';
  block.append(inner);
}
