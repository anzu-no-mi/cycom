
function addContent() {
  const elm = document.getElementById("content");

  const newElm = document.createElement("p");
  newElm.innerHTML = "new element."

  elm.appendChild(newElm);
}
