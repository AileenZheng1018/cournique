document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.back-button');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();           // ⬅️ 阻止 <a href> 的默认跳转
    e.stopPropagation();

    const returnTo = sessionStorage.getItem('returnTo');

    if (returnTo) {
      sessionStorage.removeItem('returnTo');
      window.location.href = returnTo;      // 返回到 /works#tag=原著（或别的来源）
      return;
    }

    // 没有记录就尝试 referrer（同源才用）
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin) {
          history.back();
          return;
        }
      } catch {}
    }

    // 兜底：章节页回目录，其它回 /novels
    if (/chapter-\d+\.html$/.test(location.pathname)) {
      location.href = './';
    } else {
      location.href = '/novels';
    }
  });
});

