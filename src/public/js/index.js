
function addContent() {
  const elm = document.getElementById("content");

  const newElm = document.createElement("p");
  newElm.innerHTML = "new element."

  elm.appendChild(newElm);
}

const images = ["images/img1.jpg", "images/img2.jpg"];
let current = 0;


ChangeScrean = (num) => {
const img = document.getElementById('screan-img');

  if(current + num >= 0 && current + num <= images.length - 1) {
    current += num;
    img.setAttribute('src', images[current]);
  }else if(current + num == -1) {
    current = images.length - 1;
    img.setAttribute('src', images[current]);
  }else {
    current = 0;
    img.setAttribute('src', images[current])
  }
}

test = () => console.log(document.getElementById('screan-img').getAttribute('src'))

