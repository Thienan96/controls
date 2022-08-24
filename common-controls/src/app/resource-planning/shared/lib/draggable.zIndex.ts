(() => {
  if ($['ui']) {
    $['ui'].plugin.add('draggable', 'reversionZIndex', {
      revertOnStart: (event, ui, instance) => {
        const t = $(ui.helper);
        const o = instance.options;
        if (t.css('zIndex')) {
          o._zIndex = t.css('zIndex');
        }
        t.css('zIndex', o.zIndex);
      },
      revertOnStop: (event, ui, instance) => {
        const o = instance.options;
        if (o._zIndex) {
          $(ui.helper).css('zIndex', o._zIndex);
        }
      }
    });
  }

})();
