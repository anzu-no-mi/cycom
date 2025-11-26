/*
 data-bookmark 属性を持つ要素のためのスムーズなページ内スクロール機能。
 使い方: 任意の要素（リンクやボタンなど）に `data-bookmark="bookmark-id"` を付与します。
 クリックすると、スクリプトは `document.getElementById('bookmark-id')` を探し、
 その要素へスムーズスクロールし、History API を使って URL のハッシュを更新します（ページジャンプは起こりません）。
 `bookmark-cluster` に限らず、任意のブックマーク id に対応します。
*/
(function () {
  'use strict';

  function onDocumentClick(event) {
    var trigger = event.target.closest('[data-bookmark]');
    if (!trigger) return;

    var bookmarkId = trigger.getAttribute('data-bookmark');
    if (!bookmarkId) return;

    var targetEl = document.getElementById(bookmarkId);
    if (!targetEl) return;

    // デフォルト動作を抑制（例: <a> タグの遷移を防ぐ）
    event.preventDefault();

    // スムーズスクロール
    try {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    } catch (err) {
      // 古いブラウザ向けのフォールバック
      var top = 0;
      var el = targetEl;
      while (el) {
        top += el.offsetTop || 0;
        el = el.offsetParent;
      }
      window.scrollTo(0, top);
    }

    // 即時ジャンプを発生させずに URL のハッシュを更新
    try {
      if (history && history.pushState) {
        history.pushState(null, '', '#' + bookmarkId);
      } else {
        location.hash = bookmarkId;
      }
    } catch (e) {
      // ignore
    }
  }

  // イベントデリゲーションを使うことで、動的に追加された要素にも対応
  if (document && document.addEventListener) {
    document.addEventListener('click', onDocumentClick, false);
  }
})();
/*
 data-bookmark 属性を持つ要素のためのスムーズなページ内スクロール機能。
 使い方: 任意の要素（リンクやボタンなど）に `data-bookmark="bookmark-id"` を付与します。
 クリックすると、スクリプトは `document.getElementById('bookmark-id')` を探し、
 その要素へスムーズスクロールし、History API を使って URL のハッシュを更新します（ページジャンプは起こりません）。
 `bookmark-cluster` に限らず、任意のブックマーク id に対応します。
*/
(function () {
  'use strict';

  function onDocumentClick(event) {
    var trigger = event.target.closest('[data-bookmark]');
    if (!trigger) return;

    var bookmarkId = trigger.getAttribute('data-bookmark');
    if (!bookmarkId) return;

    var targetEl = document.getElementById(bookmarkId);
    if (!targetEl) return;

    // デフォルト動作を抑制（例: <a> タグの遷移を防ぐ）
    event.preventDefault();

    // スムーズスクロール
    try {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    } catch (err) {
      // 古いブラウザ向けのフォールバック
      var top = 0;
      var el = targetEl;
      while (el) {
        top += el.offsetTop || 0;
        el = el.offsetParent;
      }
      window.scrollTo(0, top);
    }

    // 即時ジャンプを発生させずに URL のハッシュを更新
    try {
      if (history && history.pushState) {
        history.pushState(null, '', '#' + bookmarkId);
      } else {
        location.hash = bookmarkId;
      }
    } catch (e) {
      // ignore
    }
  }

  // イベントデリゲーションを使うことで、動的に追加された要素にも対応
  if (document && document.addEventListener) {
    document.addEventListener('click', onDocumentClick, false);
  }
})();
