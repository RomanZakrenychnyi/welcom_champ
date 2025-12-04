function toggleAccordion(button) {
  const content = button.nextElementSibling;
  const img = button.querySelector(".accordion__svg");
  const isOpened = content.classList.contains("accordion__panel--opened");

  if (isOpened) {
    // --- ЗАКРИТТЯ ---
    button.classList.remove("is-active");

    content.style.maxHeight = content.scrollHeight + "px";
    setTimeout(() => {
      content.style.maxHeight = "0px";
      content.style.opacity = "0";
    }, 10);

    const onClose = function (e) {
      if (e.propertyName === "max-height") {
        content.classList.remove("accordion__panel--opened");
        content.style.maxHeight = null;
        content.removeEventListener("transitionend", onClose);
      }
    };
    content.addEventListener("transitionend", onClose);

    img.classList.add("is-hidden");

    setTimeout(() => {
      img.src = "/img/plus.svg";
      img.classList.remove("is-hidden");
    }, 100);
  } else {
    // --- ВІДКРИТТЯ ---
    button.classList.add("is-active");

    content.classList.add("accordion__panel--opened");
    content.style.maxHeight = content.scrollHeight + "px";
    content.style.opacity = "1";

    const onOpen = function (e) {
      if (e.propertyName === "max-height") {
        content.style.maxHeight = "none";
        content.removeEventListener("transitionend", onOpen);
      }
    };
    content.addEventListener("transitionend", onOpen);

    img.classList.add("is-hidden");

    setTimeout(() => {
      img.src = "/img/minus.svg";
      img.classList.remove("is-hidden");
    }, 100);
  }
}

if (typeof window !== "undefined") {
  window.toggleAccordion = toggleAccordion;
}