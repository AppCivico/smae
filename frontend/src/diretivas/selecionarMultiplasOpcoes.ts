import { nextTick } from 'vue';

type CheckboxElement = HTMLInputElement & {
  checked: boolean;
};

const changeEvent = new Event('change');

let previouslyClicked: CheckboxElement | null;

async function handleCheck(e: MouseEvent) {
  const clickedCheckbox = e.target as CheckboxElement;
  const wrapper = e.currentTarget as HTMLElement;
  const state = clickedCheckbox.checked;

  if (!(e.target as HTMLElement).matches('input[type="checkbox"]')) {
    return;
  }

  if (e.shiftKey && !clickedCheckbox.disabled && previouslyClicked) {
    let inBetween = false;
    const checkboxes: NodeListOf<CheckboxElement> = wrapper.querySelectorAll('input[type="checkbox"]');

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

export default (el:HTMLElement) => {
  el.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.shiftKey && (e.target as HTMLElement).matches('input[type="checkbox"]')) {
      e.preventDefault();
    }
  });

  el.addEventListener('click', handleCheck);
};
