document.addEventListener('DOMContentLoaded', function () {
    const btn = document.querySelector('.fixed-hamburger');
    const toc = document.getElementById('side-toc');
    if (!btn || !toc) return;
    const ul = toc.querySelector('ul');

    function smoothScrollTo(el) {
        if (!el) return;
        try {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        } catch (e) { /* fallthrough */ }
        const rect = el.getBoundingClientRect();
        const offset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const top = Math.max(0, rect.top + offset - 8);
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    // h1 と h2 を収集して目次作成（innerHTMLで記号・絵文字・装飾を保持）
    const headings = Array.from(document.querySelectorAll('h1, h2'));

    headings.forEach((h, i) => {
        if (h.matches('h2[data-newcontent]')) {
            console.log('NEW対象:', h.textContent);
        }
        const id = h.id || ('auto-heading-' + i);
        if (!h.id) h.id = id;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + id;

        a.innerHTML = h.innerHTML;
        // NEW判定（data-newcontent: 新規コンテンツである印）
        const isNewContent = h.matches('h2[data-newcontent]');
        if (isNewContent) {
            const badge = document.createElement('span');
            badge.className = 'toc-new';
            badge.textContent = 'NEW!!';
            a.prepend(badge);
        }

        a.setAttribute('role', 'link');
        a.addEventListener('click', function (e) {
            e.preventDefault();
            toc.classList.remove('open');
            toc.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
            setTimeout(() => smoothScrollTo(document.getElementById(id)), 10);
        });
        li.appendChild(a);
        ul.appendChild(li);
    });

    // トグル
    btn.addEventListener('click', function (e) {
        const opened = btn.getAttribute('aria-expanded') === 'true';
        if (opened) {
            toc.classList.remove('open');
            toc.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
        } else {
            toc.classList.add('open');
            toc.setAttribute('aria-hidden', 'false');
            btn.setAttribute('aria-expanded', 'true');
        }
        e.stopPropagation();
    });

    // 閉じるボタン
    const closeBtn = toc.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            toc.classList.remove('open');
            toc.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
        });
    }

    // 外側クリックで閉じる
    document.addEventListener('click', function (e) {
        if (!toc.contains(e.target) && !btn.contains(e.target)) {
            toc.classList.remove('open');
            toc.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
        }
    });

    // Escキーで閉じる
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            toc.classList.remove('open');
            toc.setAttribute('aria-hidden', 'true');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});
