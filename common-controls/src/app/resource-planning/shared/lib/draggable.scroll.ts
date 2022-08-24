(() => {
  if ($['ui']) {
    $['ui'].plugin.add('draggable', 'scrollParent', {
      start: (event, ui, i) => {
        if (!i.scrollParentContainer) {
          i.scrollParentContainer = $(i.options.scrollParent);
        }
        if (i.scrollParentContainer[0] !== i.document[0] &&
          i.scrollParentContainer[0].tagName !== 'HTML') {
          i.overflowOffset = i.scrollParentContainer.offset();
        }

        if (i.options.scrollParent2) {
          if (!i.scrollParentContainer2) {
            i.scrollParentContainer2 = $(i.options.scrollParent2);
          }
          if (i.scrollParentContainer2[0] !== i.document[0] &&
            i.scrollParentContainer2[0].tagName !== 'HTML') {
            i.overflowOffset2 = i.scrollParentContainer2.offset();
          }
        }

      },
      drag: (event, ui, i) => {

        let o = i.options,
          scrolled: any = false,
          scrollParent = i.scrollParentContainer[0],
          document = i.document[0];

        if (scrollParent !== document && scrollParent.tagName !== 'HTML') {
          if (!o.axis || o.axis !== 'x') {
            if ((i.overflowOffset.top + scrollParent.offsetHeight) - event.pageY <
              o.scrollSensitivity) {
              scrollParent.scrollTop = scrolled = scrollParent.scrollTop + o.scrollSpeed;
            } else if (event.pageY - i.overflowOffset.top < o.scrollSensitivity) {
              scrollParent.scrollTop = scrolled = scrollParent.scrollTop - o.scrollSpeed;
            }
          }

          if (!o.axis || o.axis !== 'y') {
            if ((i.overflowOffset.left + scrollParent.offsetWidth) - event.pageX <
              o.scrollSensitivity) {
              scrollParent.scrollLeft = scrolled = scrollParent.scrollLeft + o.scrollSpeed;
            } else if (event.pageX - i.overflowOffset.left < o.scrollSensitivity) {
              scrollParent.scrollLeft = scrolled = scrollParent.scrollLeft - o.scrollSpeed;
            }
          }


          if (i.options.scrollParent2) {
            let scrollParent2 = i.scrollParentContainer2[0];
            if (!o.axis || o.axis !== 'x') {
              if ((i.overflowOffset2.top + scrollParent2.offsetHeight) - event.pageY <
                o.scrollSensitivity) {
                scrollParent2.scrollTop = scrolled = scrollParent2.scrollTop + o.scrollSpeed;
              } else if (event.pageY - i.overflowOffset2.top < o.scrollSensitivity) {
                scrollParent2.scrollTop = scrolled = scrollParent2.scrollTop - o.scrollSpeed;
              }
            }

            if (!o.axis || o.axis !== 'y') {
              if ((i.overflowOffset2.left + scrollParent2.offsetWidth) - event.pageX <
                o.scrollSensitivity) {
                scrollParent2.scrollLeft = scrolled = scrollParent2.scrollLeft + o.scrollSpeed;
              } else if (event.pageX - i.overflowOffset2.left < o.scrollSensitivity) {
                scrollParent2.scrollLeft = scrolled = scrollParent2.scrollLeft - o.scrollSpeed;
              }
            }
          }


        } else {

          if (!o.axis || o.axis !== 'x') {
            if (event.pageY - $(document).scrollTop() < o.scrollSensitivity) {
              scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed);
            } else if ($(window).height() - (event.pageY - $(document).scrollTop()) <
              o.scrollSensitivity) {
              scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed);
            }
          }

          if (!o.axis || o.axis !== 'y') {
            if (event.pageX - $(document).scrollLeft() < o.scrollSensitivity) {
              scrolled = $(document).scrollLeft(
                $(document).scrollLeft() - o.scrollSpeed
              );
            } else if ($(window).width() - (event.pageX - $(document).scrollLeft()) <
              o.scrollSensitivity) {
              scrolled = $(document).scrollLeft(
                $(document).scrollLeft() + o.scrollSpeed
              );
            }
          }

        }

        if (scrolled !== false && $['ui'].ddmanager && !o.dropBehaviour) {
          $['ui'].ddmanager.prepareOffsets(i, event);
        }

      }
    });
  }
})();
