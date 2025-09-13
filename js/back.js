document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.back-button');
  if (btn) {
    btn.addEventListener('click', () => {
      if (document.referrer && document.referrer !== location.href) {
        history.back();
      } else {
        // 没有来源页：如果在 chapter-xx 页面就回到目录 ./ ，否则回 /novels
        if (location.pathname.match(/chapter-\d+\.html$/)) {
          location.href = './';
        } else {
          location.href = '/novels';
        }
      }
    });
  }
});
