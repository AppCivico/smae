import { nextTick } from 'vue';

type CheckboxElement = HTMLInputElement & {
  checked: boolean;
};

const changeEvent = new Event('change');

let previouslyClicked: CheckboxElement | null;

async function handleCheck(e: MouseEvent, seletor = 'input[type="checkbox"]') {
  const clickedCheckbox = e.target as CheckboxElement;
  const wrapper = e.currentTarget as HTMLElement;
  const state = clickedCheckbox.checked;

  if (!(e.target as HTMLElement).matches(seletor)) {
    return;
  }

  if (e.shiftKey && !clickedCheckbox.disabled && previouslyClicked) {
    let inBetween = false;
    const checkboxes: NodeListOf<CheckboxElement> = wrapper.querySelectorAll(seletor);

    for (let i = 0, { length } = checkboxes; i < length; i += 1) {
      const checkbox = checkboxes[i];

      if (!checkbox.disabled) {
        if (inBetween || checkbox === clickedCheckbox) {
          checkbox.checked = state;
          checkbox.dispatchEvent(changeEvent);

          // eslint-disable-next-line no-await-in-loop
          await nextTick();
        }

        if (checkbox === clickedCheckbox || checkbox === previouslyClicked) {
          if (inBetween) {
            break;
          }

          inBetween = !inBetween;
        }
      }
    }
  }

  previouslyClicked = clickedCheckbox;
}

export default (el:HTMLElement, seletor:string) => {
  el.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.shiftKey && (e.target as HTMLElement).matches(seletor)) {
      e.preventDefault();
    }
  });

  el.addEventListener('click', (ev) => handleCheck(ev, seletor));
};
