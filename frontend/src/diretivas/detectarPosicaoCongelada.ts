import throttle from 'lodash/throttle';

let observer: IntersectionObserver;
let stickyElement: HTMLElement;
let stickyElementStyle: CSSStyleDeclaration;
let stickyElementPosition = '';
let stickyElementTop = 0;
let className = 'stuck';

function determineStickyState() {
  const currentTop = stickyElement.getBoundingClientRect().top;
  stickyElement.classList.toggle(className, currentTop <= stickyElementTop);
}

export default {
  mounted(el: HTMLElement, { value }: { value: string }) {
    observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === true) {
          if (!stickyElement) {
            stickyElement = el;

            stickyElementStyle = window.getComputedStyle(el);

            stickyElementTop = parseInt(stickyElementStyle.top, 10);
            stickyElementPosition = stickyElementStyle.position;

            if (value) {
              className = value;
            }

            if (stickyElementPosition === 'sticky') {
              window.addEventListener('scroll', throttle(determineStickyState, 200));
            }
          }
        }
      },
      { threshold: [1] },
    );

    observer.observe(el);
  },

  beforeUnmount(el: HTMLElement) {
    window.removeEventListener('scroll', throttle(determineStickyState, 200));
    observer.unobserve(el);
  },
};
