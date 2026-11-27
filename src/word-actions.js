export async function insertIntoWord(word, symbol) {
  await word.run(async context => {
    const inserted = context.document.getSelection().insertText(symbol, 'Replace');
    inserted.getRange('End').select();
    await context.sync();
  });
}

export function createPaneToggle(addin, initialVisible = false) {
  let visible = initialVisible;
  let pending = Promise.resolve();
  return {
    visibilityChanged(mode) { visible = mode === 'Taskpane'; },
    toggle() {
      const operation = pending.then(async () => {
        const next = !visible;
        if (next) await addin.showAsTaskpane();
        else await addin.hide();
        visible = next;
      });
      pending = operation.catch(() => {});
      return operation;
    }
  };
}
