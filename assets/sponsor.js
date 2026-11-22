/**
 * 土耳其植发指南 · 微信复制与交互逻辑
 */
(function () {
  const WECHAT_ID = 'turkeyzhifa';

  function showToast(message) {
    let toast = document.querySelector('.toast-container');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-container';
      toast.innerHTML = `<span class="toast-icon">✓</span><span class="toast-text"></span>`;
      document.body.appendChild(toast);
    }
    const textEl = toast.querySelector('.toast-text');
    if (textEl) textEl.textContent = message || `微信号 ${WECHAT_ID} 已复制，请前往微信添加好友！`;
    toast.classList.add('is-visible');

    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  function copyWechat(customId) {
    const id = customId || WECHAT_ID;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(
        () => showToast(`微信号 ${id} 已复制，请前往微信添加好友！`),
        () => fallbackCopy(id)
      );
    } else {
      fallbackCopy(id);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(`微信号 ${text} 已复制，请前往微信添加好友！`);
      } else {
        prompt('请长按复制微信号：', text);
      }
    } catch (err) {
      prompt('请长按复制微信号：', text);
    }
    document.body.removeChild(textarea);
  }

  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-copy-wechat], .copy-wechat-btn, .nav-wechat-btn');
    if (target) {
      e.preventDefault();
      const customId = target.getAttribute('data-copy-wechat') || WECHAT_ID;
      copyWechat(customId);
    }
  });

  window.copyWechat = copyWechat;
})();
