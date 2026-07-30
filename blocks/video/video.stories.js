import './video.css';
import decorate from './video.js';

// Well-known public YouTube video (Big Buck Bunny)
const SAMPLE_VIDEO_URL = 'https://www.youtube.com/watch?v=YE7VzlLtp-4';
const SHORT_URL = 'https://youtu.be/YE7VzlLtp-4';

export default {
  title: 'Blocks/Video',
  parameters: {
    a11y: { config: { rules: [] } },
  },
  args: {
    videoUrl: SAMPLE_VIDEO_URL,
    caption: '',
  },
  argTypes: {
    videoUrl: {
      name: 'YouTube URL',
      control: 'text',
      description: 'Full YouTube URL (watch, youtu.be, or embed format) or raw 11-char video ID.',
    },
    caption: {
      name: 'Caption',
      control: 'text',
      description: 'Optional caption displayed below the video.',
    },
  },
};

function buildBlock({ videoUrl = SAMPLE_VIDEO_URL, caption = '' } = {}) {
  const block = document.createElement('div');
  block.className = 'video block';

  const row = document.createElement('div');

  const urlCell = document.createElement('div');
  const anchor = document.createElement('a');
  anchor.href = videoUrl;
  anchor.textContent = videoUrl;
  urlCell.append(anchor);
  row.append(urlCell);

  if (caption) {
    const captionCell = document.createElement('div');
    captionCell.textContent = caption;
    row.append(captionCell);
  }

  block.append(row);
  return block;
}

function render(args) {
  const block = buildBlock(args);
  decorate(block);
  return block;
}

export const Default = {
  args: { videoUrl: SAMPLE_VIDEO_URL, caption: '' },
  render,
};

export const WithCaption = {
  args: {
    videoUrl: SAMPLE_VIDEO_URL,
    caption: 'Big Buck Bunny — Blender Foundation open movie',
  },
  render,
};

export const ShortUrl = {
  name: 'Short URL (youtu.be)',
  args: { videoUrl: SHORT_URL, caption: '' },
  render,
};

export const RawVideoId = {
  name: 'Raw Video ID',
  args: { videoUrl: 'YE7VzlLtp-4', caption: 'Provided as a raw 11-character video ID' },
  render,
};

export const InvalidUrl = {
  name: 'Invalid URL (no embed rendered)',
  args: { videoUrl: 'https://example.com/not-a-youtube-url', caption: '' },
  render,
};
