async function installMouseHelper(page) {
  await page.evaluateOnNewDocument(() => {
    const attachListener = () => {
      const box = document.createElement('p-mouse-pointer')
      const styleElement = document.createElement('style')
      styleElement.innerHTML = `
    p-mouse-pointer {
      pointer-events: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      background: rgba(0,0,0,.4);
      border: 1px solid white;
      border-radius: 10px;
      box-sizing: border-box;
      margin: -10px 0 0 -10px;
      padding: 0;
      z-index: 10000;
      transition: left 0.1s ease, top 0.1s ease; /* Transition for smooth movement */
    }
    p-mouse-pointer.button-1 {
      background: rgba(0,0,0,0.9);
    }
    p-mouse-pointer.button-2 {
      border-color: rgba(0,0,255,0.9);
    }
    p-mouse-pointer.button-3 {
      border-radius: 4px;
    }
    p-mouse-pointer.button-4 {
      border-color: rgba(255,0,0,0.9);
    }
    p-mouse-pointer.button-5 {
      border-color: rgba(0,255,0,0.9);
    }
    p-mouse-pointer-hide {
      display: none;
    }
  `
      document.head.appendChild(styleElement)
      document.body.appendChild(box)
      document.addEventListener(
        'mousemove',
        (event) => {
          console.log('event')
          box.style.left = String(event.pageX) + 'px'
          box.style.top = String(event.pageY) + 'px'
          box.classList.remove('p-mouse-pointer-hide')
          updateButtons(event.buttons)
        },
        true
      )
      document.addEventListener(
        'mousedown',
        (event) => {
          updateButtons(event.buttons)
          box.classList.add('button-' + String(event.which))
          box.classList.remove('p-mouse-pointer-hide')
        },
        true
      )
      document.addEventListener(
        'mouseup',
        (event) => {
          updateButtons(event.buttons)
          box.classList.remove('button-' + String(event.which))
          box.classList.remove('p-mouse-pointer-hide')
        },
        true
      )
      document.addEventListener(
        'mouseleave',
        (event) => {
          updateButtons(event.buttons)
          box.classList.add('p-mouse-pointer-hide')
        },
        true
      )
      document.addEventListener(
        'mouseenter',
        (event) => {
          updateButtons(event.buttons)
          box.classList.remove('p-mouse-pointer-hide')
        },
        true
      )
      function updateButtons(buttons) {
        for (let i = 0; i < 5; i++) {
          box.classList.toggle('button-' + String(i), Boolean(buttons & (1 << i)))
        }
      }
    }
    if (document.readyState !== 'loading') {
      attachListener()
    } else {
      window.addEventListener('DOMContentLoaded', attachListener, false)
    }
  })
}

module.exports = installMouseHelper