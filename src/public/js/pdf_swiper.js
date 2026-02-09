document.addEventListener('DOMContentLoaded', () => {
	(async () => {
		const pdfUrl = 'pdf/real_event_202603_program_summary.pdf';
		const pdfjsLib = window['pdfjsLib'];
		if (!pdfjsLib) return;
		pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

		const container = document.querySelector('.pdf-swiper .swiper-wrapper');
		if (!container) return;

		try {
			const res = await fetch(pdfUrl, { method: 'GET', cache: 'no-store' });
			if (!res.ok) throw new Error('PDF fetch failed');
			const arrayBuffer = await res.arrayBuffer();
			const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

			const ASPECT_W = 16, ASPECT_H = 9;

			for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
				const page = await pdf.getPage(pageNum);
				const unscaledViewport = page.getViewport({ scale: 1 });
                const pageRatio = unscaledViewport.height / unscaledViewport.width;

				// スライドとアスペクトボックスを作成して DOM に追加（先に追加して実測を取得）
				const slide = document.createElement('div');
				slide.className = 'swiper-slide';
				const ratioBox = document.createElement('div');
				ratioBox.style.width = '100%';
				ratioBox.style.position = 'relative';
                ratioBox.style.paddingBottom = (pageRatio * 100) + '%';
				ratioBox.style.overflow = 'hidden';
				slide.appendChild(ratioBox);
				container.appendChild(slide);

				// 実測サイズ（厳密に取得）。幅が 0 の場合はフォールバック
				let rect = ratioBox.getBoundingClientRect();
				if (!rect.width || rect.width < 1) {
					const parentImgBlock = container.closest('.article-img');
					const fallbackWidth = parentImgBlock?.clientWidth || 800;
					rect = { width: Math.max(320, fallbackWidth), height: Math.max(180, Math.round(fallbackWidth * (ASPECT_H / ASPECT_W))) };
				}
				const displayWidth = Math.max(320, rect.width);
				const displayHeight = rect.height || Math.round(displayWidth * (ASPECT_H / ASPECT_W));

				try {
					// DPR を考慮して canvas の内部ピクセル数を displaySize * dpr で正確に設定
					const dpr = window.devicePixelRatio || 1;
	
                    const canvas = document.createElement('canvas');
					canvas.width = Math.round(displayWidth * dpr);
                    canvas.height = Math.round(displayWidth * pageRatio * dpr);

					// renderScale は canvas.width / 元のPDF幅（unscaledViewport.width）で決定
                    const scale = canvas.width / unscaledViewport.width;
                    const renderViewport = page.getViewport({ scale });

					// CSS 表示サイズは ratioBox の実測表示サイズに合わせる（100% を使って確実に埋める）
					canvas.style.position = 'absolute';
					canvas.style.top = '0';
					canvas.style.left = '0';
					canvas.style.width = '100%';
					canvas.style.height = '100%';
					canvas.style.userSelect = 'none';
					canvas.draggable = false;
					canvas.oncontextmenu = (e) => { e.preventDefault(); return false; };

					// canvas を挿入してからレンダリング（内部ピクセルと renderViewport が一致している）
					ratioBox.appendChild(canvas);
					const context = canvas.getContext('2d');
					context.clearRect(0, 0, canvas.width, canvas.height);
					await page.render({ canvasContext: context, viewport: renderViewport }).promise;
				} catch (perPageErr) {
					// ページ描画失敗時はそのスライドを削除して空白を残さない
					console.error(`PDF page ${pageNum} render error:`, perPageErr);
					if (slide.parentNode) slide.parentNode.removeChild(slide);
				}
			}

			/* global Swiper */
			const swiper = new Swiper('.pdf-swiper', {
				initialSlide: 0,
				slidesPerView: 1,
				slidesPerGroup: 1,
				loop: false,
				spaceBetween: 16,

				keyboard: { enabled: true },
				grabCursor: true,

				autoplay: {
					delay: 4000,
					disableOnInteraction: false,
				},

				observer: false,
				observeParents: false,
            });
            
			// 🔑 PDF描画後、サイズ確定してから一度だけ再計算
			swiper.updateSize();
			swiper.updateSlides();
			swiper.updateProgress();
			swiper.updateSlidesClasses();

			// 開始位置を明示的に固定
			swiper.slideTo(0, 0, false);

			// 最終ページ → 先頭へ
			swiper.on('reachEnd', function () {
				const delay = this.params.autoplay.delay;
				this.autoplay.stop();
				setTimeout(() => {
					this.slideTo(0, 0, false);
					this.autoplay.start();
				}, delay);
			});
		} catch (err) {
			console.error('PDF表示エラー:', err);
			const msg = document.createElement('div');
			msg.textContent = 'PDFを表示できませんでした。';
			(document.querySelector('.pdf-swiper') || document.body).appendChild(msg);
		}
	})();
});