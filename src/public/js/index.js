// Q:クロージャに二つの関数をかえせるのか？とりま、わかりづらくなりそうなのでクラスにした
class ScreenAction {
  constructor(images, current) {
    // お知らせ用の写真

    this.images = images;

    // 写真、何枚目か
    this.current = current;
  }

  // メソッド始まり

  changeScrean = (num) => {
    const img = document.getElementById("screan-img");

    // 最も右のお知らせ→最も左のお知らせ
    if (this.current + num == -1) {
      this.current = this.images.length - 1;

      // 最も右のお知らせ→最も左のお知らせ
    } else if (this.current + num == this.images.length) {
      this.current = 0;

      // 通常時の遷移 (num＝1～N Nはお知らせの数)
    } else {
      this.current += num;
    }
    img.setAttribute("src", this.images[this.current]);
  };

  // Q:関数の処理の順番について←「counter-〇」のため
  imgCounter = () => {
    const elm = document.getElementById("counter-" + this.current + 1);
    elm.classList.add("bg-primary");
  };

  // TODO:追加の繰り返し処理。時間なかったので中断

  generateCounter = () => {
    // お知らせの数
    const n = this.images.length;
    // counterの要素（追加する親要素）
    const elem = document.getElementById("img-counter");
    // 追加する要素
    const new_elem = document.createElement("div");

    for (let i = 0; i < 2; i++) {
      elem.appendChild(new_elem);
    }
  };
}


// swiper object
let swiper = null;
const setupSwiper = () => {
  swiper = new Swiper(".mySwiper", {
    spaceBetween: 30,
    centeredSlides: true,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
};

window.addEventListener('load', (event) => {
  console.log('ページが完全に読み込まれました');
  setupSwiper();
});
