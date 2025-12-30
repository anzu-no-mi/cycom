// popupID → 動画URL の対応表（ここが肝）
const VIDEO_MAP = {
  'popup-cluster-first': 'video/cluster_first.mp4'
};


// ビデオ停止関数
function stopVideo(popup) {
  const video = popup.querySelector('video');
  if (!video) return;

  video.pause();
  video.removeAttribute('src');
  video.load();
}


// 開く
document.querySelectorAll('.popup-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const popupId = trigger.dataset.popup;
    const popup = document.getElementById(popupId);
    const video = popup.querySelector('video');

    const videoSrc = VIDEO_MAP[popupId];
    if (!videoSrc) return;

    video.src = videoSrc;
    popup.classList.add('active');
  });
});


// 閉じるボタンで閉じる
document.querySelectorAll('.popup-close').forEach(button => {
  button.addEventListener('click', () => {
    const popup = button.closest('.popup-overlay');
    stopVideo(popup);
    popup.classList.remove('active');
  });
});

// 背景クリックで閉じる
document.querySelectorAll('.popup-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
        stopVideo(overlay);
        overlay.classList.remove('active');
    }
  });
});


