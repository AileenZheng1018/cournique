    let isMenuOpen = false;
    
    function toggleMenu() {
      const wrapper = document.querySelector('.menu-wrapper');
      isMenuOpen = !isMenuOpen;
      wrapper.classList.toggle('active', isMenuOpen);
      if (!isMenuOpen) {
        showTopLevel(); // 重置为顶层菜单
      }
    }
    
    function hideMenu() {
      const wrapper = document.querySelector('.menu-wrapper');
      wrapper.classList.remove('active');
      isMenuOpen = false;
      showTopLevel(); // 重置为顶层菜单
    }
    
    // 显示所有顶层菜单项，隐藏所有子菜单
    function showTopLevel() {
      document.querySelectorAll('.menu-item').forEach(item => {
        item.style.display = 'block';
      });
      document.querySelectorAll('.menu-subgroup').forEach(group => {
        group.style.display = 'none';
      });
      const back = document.querySelector('.menu-back');
      if (back) back.style.display = 'none';
    }
    
    // 点击顶层菜单后：隐藏其他顶层，仅显示对应子项
    function toggleSubmenu(id) {
      // 隐藏所有顶层菜单项
      document.querySelectorAll('.menu-item').forEach(item => {
        item.style.display = 'none';
      });
    
      // 显示对应子菜单
      document.querySelectorAll('.menu-subgroup').forEach(group => {
        if (group.id === 'submenu-' + id) {
          group.style.display = 'block';
        } else {
          group.style.display = 'none';
        }
      });
    
      // 显示返回按钮
      const back = document.querySelector('.menu-back');
      if (back) back.style.display = 'block';
    }

    
    
    const element = document.getElementById("typewriter");
  
    // 你要显示的摩斯码文本
    const texts = [
      "- . ... - / ..-. .- .. .-.. . -.."
    ];
  
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
  
    function typeWriterEffect() {
      const currentText = texts[textIndex];
      const currentDisplay = currentText.substring(0, charIndex);
  
      element.setAttribute("placeholder", currentDisplay);
  
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          charIndex++;
          setTimeout(typeWriterEffect, 150); // 打字速度
        } else {
          isDeleting = true;
          setTimeout(typeWriterEffect, 1500); // 停留时间
        }
      } else {
        if (charIndex > 0) {
          charIndex--;
          setTimeout(typeWriterEffect, 0,1); // 删除速度
        } else {
          isDeleting = false;
          setTimeout(typeWriterEffect, 800); // 循环前间隔
        }
      }
    }
  
    // 启动打字机动画
    typeWriterEffect();
  

// 动态绑定菜单点击跳转带 tag 参数（使用 hash）
document.querySelectorAll('.menu-subitem').forEach(item => {
  item.addEventListener('click', () => {
    const tag = item.dataset.tag;
    if (tag) {
      const encoded = encodeURIComponent(tag);
      window.location.href = `works.html#tag=${encoded}`; // 修改为 hash
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // 读取 hash 中的 tag
  const hash = window.location.hash;
  let tag = null;

  if (hash.startsWith("#tag=")) {
    tag = decodeURIComponent(hash.slice(5));
  }

  document.querySelectorAll('.work-item').forEach(item => {
    const tags = item.dataset.tags ? JSON.parse(item.dataset.tags) : [];
    if (!tag || tags.includes(tag)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
});
