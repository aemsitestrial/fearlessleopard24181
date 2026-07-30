function extractYouTubeId(text) {
  if (!text) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  const trimmed = text.trim();
  for (let i = 0; i < patterns.length; i += 1) {
    const match = trimmed.match(patterns[i]);
    if (match) return match[1];
  }
  return null;
}

function buildPlayIcon() {
  const btn = document.createElement('div');
  btn.className = 'video-play-btn';
  btn.setAttribute('aria-hidden', 'true');
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 48" class="video-play-icon">
    <path d="M66.52 7.74A8.52 8.52 0 0 0 60.71 1.9C55.41 0 34 0 34 0S12.59 0 7.29 1.9A8.52 8.52 0 0 0 1.48 7.74C-.4 13.12-.4 24-.4 24s0 10.88 1.88 16.26A8.52 8.52 0 0 0 7.29 46.1C12.59 48 34 48 34 48s21.41 0 26.71-1.9a8.52 8.52 0 0 0 5.81-5.84C68.4 34.88 68.4 24 68.4 24s0-10.88-1.88-16.26z" fill="red"/>
    <path d="M27.2 34.3V13.7L45.2 24z" fill="#fff"/>
  </svg>`;
  return btn;
}

export default function decorate(block) {
  const [row] = [...block.children];
  if (!row) return;

  const [urlCell, captionCell] = [...row.children];

  const anchor = urlCell?.querySelector('a');
  const rawUrl = anchor?.href || anchor?.textContent || urlCell?.textContent || '';
  const videoId = extractYouTubeId(rawUrl.trim());

  if (!videoId) return;

  const caption = captionCell?.textContent?.trim() || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  const facade = document.createElement('div');
  facade.className = 'video-facade';
  facade.setAttribute('role', 'button');
  facade.setAttribute('tabindex', '0');
  facade.setAttribute('aria-label', caption ? `Play video: ${caption}` : 'Play YouTube video');

  const thumb = document.createElement('img');
  thumb.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  thumb.alt = caption || 'Video thumbnail';
  thumb.loading = 'lazy';
  thumb.className = 'video-thumbnail';

  facade.append(thumb, buildPlayIcon());

  function loadVideo() {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = caption || 'YouTube video player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.className = 'video-iframe';
    facade.replaceWith(iframe);
  }

  facade.addEventListener('click', loadVideo);
  facade.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      loadVideo();
    }
  });

  wrapper.append(facade);

  if (caption) {
    const figCaption = document.createElement('p');
    figCaption.className = 'video-caption';
    figCaption.textContent = caption;
    wrapper.append(figCaption);
  }

  block.textContent = '';
  block.append(wrapper);
}
