export default function decorate(block) {
  const picture = block.querySelector('picture');
  if (!picture) return;

  const anchor = block.querySelector('a');

  block.innerHTML = '';

  if (anchor?.href) {
    const link = document.createElement('a');
    link.href = anchor.href;
    if (anchor.title) link.title = anchor.title;
    link.append(picture);
    block.append(link);
  } else {
    block.append(picture);
  }
}
