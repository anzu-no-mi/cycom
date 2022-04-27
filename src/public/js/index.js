

// お知らせ用の写真
const images = ["images/img1.jpg", "images/img2.jpg"];

// 写真、何枚目か　カウンターでも使用するのでグローバルにしている。Q:globalなままでいいか？
let current = 0;

const  changeScrean = (num) => {
  
  const img = document.getElementById('screan-img');

  // 通常時の遷移 (num＝1～N Nはお知らせの数)
  if(current + num >= 0 && current + num <= images.length - 1) {
    current += num;

  // 最も右→最も左
  }else if(current + num == -1) {
    current = images.length - 1;

  // 最も右→最も左
  }else {
    current = 0;
  }
  img.setAttribute('src', images[current]);
}

どのようにN個に対応させるか
const imgCounter = ()=>{
  const elm =document.getElementById("counter-" + current);
  elm.className = 'bg-primary';
}

//イベントと関数がバインドされているかチェック用、後で消す
test = () => console.log(document.getElementById('screan-img').getAttribute('src'))

