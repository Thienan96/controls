(() => {
  if ($['ui']) {
    let intersect = $['ui'].intersect = (function () {
      function isOverAxis(x, reference, size) {
        return (x >= reference) && (x < (reference + size));
      }

      return function (draggable, droppable, toleranceMode, event) {
        if (!droppable.offset) {
          return false;
        }

        let x1 = (draggable.positionAbs ||
          draggable.position.absolute).left + draggable.margins.left,
          y1 = (draggable.positionAbs ||
            draggable.position.absolute).top + draggable.margins.top,
          x2 = x1 + draggable.helperProportions.width,
          y2 = y1 + draggable.helperProportions.height,
          l = droppable.offset.left,
          t = droppable.offset.top,
          r = l + droppable.proportions().width,
          b = t + droppable.proportions().height;
        let touch: boolean;

        switch (toleranceMode) {
          case 'fit':
            return (l <= x1 && x2 <= r && t <= y1 && y2 <= b);
          case 'intersect':
            return (l < x1 + (draggable.helperProportions.width / 2) && // Right Half
              x2 - (draggable.helperProportions.width / 2) < r && // Left Half
              t < y1 + (draggable.helperProportions.height / 2) && // Bottom Half
              y2 - (draggable.helperProportions.height / 2) < b); // Top Half
          case 'pointer':
            return isOverAxis(event.pageY, t, droppable.proportions().height) &&
              isOverAxis(event.pageX, l, droppable.proportions().width);
          case 'touch':
            return (
              (y1 >= t && y1 <= b) || // Top edge touching
              (y2 >= t && y2 <= b) || // Bottom edge touching
              (y1 < t && y2 > b) // Surrounded vertically
            ) && (
              (x1 >= l && x1 <= r) || // Left edge touching
              (x2 >= l && x2 <= r) || // Right edge touching
              (x1 < l && x2 > r) // Surrounded horizontally
            );
          case 'fit-top-bottom':
            touch = (
              (y1 >= t && y1 <= b) || // Top edge touching
              (y2 >= t && y2 <= b) || // Bottom edge touching
              (y1 < t && y2 > b) // Surrounded vertically
            ) && (
              (x1 >= l && x1 <= r) || // Left edge touching
              (x2 >= l && x2 <= r) || // Right edge touching
              (x1 < l && x2 > r) // Surrounded horizontally
            );
            if (touch) {
              touch = false;
              let mid = (x1 + x2) / 2;
              if (l <= mid && mid <= r) {
                touch = true;
              }
            }
            return touch;
          case 'fit-top':
            touch = (
              (y1 >= t && y1 <= b) || // Top edge touching
              (y2 >= t && y2 <= b) || // Bottom edge touching
              (y1 < t && y2 > b) // Surrounded vertically
            ) && (
              (x1 >= l && x1 <= r) || // Left edge touching
              (x2 >= l && x2 <= r) || // Right edge touching
              (x1 < l && x2 > r) // Surrounded horizontally
            );
            if (touch) {
              touch = false;
              let midX = (x1 + x2) / 2;
              let midY = (y1 + y2) / 2;
              if (l <= midX && midX <= r && midY < b) {
                touch = true;
              }
            }
            return touch;
          case 'fit-bottom':
            touch = (
              (y1 >= t && y1 <= b) || // Top edge touching
              (y2 >= t && y2 <= b) || // Bottom edge touching
              (y1 < t && y2 > b) // Surrounded vertically
            ) && (
              (x1 >= l && x1 <= r) || // Left edge touching
              (x2 >= l && x2 <= r) || // Right edge touching
              (x1 < l && x2 > r) // Surrounded horizontally
            );
            if (touch) {
              touch = false;
              let midX = (x1 + x2) / 2;
              let midY = (y1 + y2) / 2;
              if (l <= midX && midX <= r && t < midY) {
                touch = true;
              }
            }
            return touch;

          case 'fit-left-right':
            touch = (
              (y1 >= t && y1 <= b) || // Top edge touching
              (y2 >= t && y2 <= b) || // Bottom edge touching
              (y1 < t && y2 > b) // Surrounded vertically
            ) && (
              (x1 >= l && x1 <= r) || // Left edge touching
              (x2 >= l && x2 <= r) || // Right edge touching
              (x1 < l && x2 > r) // Surrounded horizontally
            );
            if (touch) {
              touch = false;
              let mid = (y1 + y2) / 2;
              if (t <= mid && mid <= b) {
                touch = true;
              }
            }
            return touch;

          default:
            return false;
        }
      };
    })();

    /*
     This manager tracks offsets of draggables and droppables
    */
    $['ui'].ddmanager = {
      current: null,
      droppables: {'default': []},
      prepareOffsets: function (t, event) {

        let i, j,
          m = $['ui'].ddmanager.droppables[t.options.scope] || [],
          type = event ? event.type : null, // workaround for #2317
          list = (t.currentItem || t.element).find(':data(ui-droppable)').addBack();

        droppablesLoop: for (i = 0; i < m.length; i++) {

          // No disabled and non-accepted
          if (m[i].options.disabled || (t && !m[i].accept.call(m[i].element[0],
            (t.currentItem || t.element)))) {
            continue;
          }

          // Filter out elements in the current dragged item
          for (j = 0; j < list.length; j++) {
            if (list[j] === m[i].element[0]) {
              m[i].proportions().height = 0;
              continue droppablesLoop;
            }
          }

          m[i].visible = m[i].element.css('display') !== 'none';
          if (!m[i].visible) {
            continue;
          }

          // Activate the droppable if used directly from draggables
          if (type === 'mousedown') {
            m[i]._activate.call(m[i], event);
          }

          m[i].offset = m[i].element.offset();
          m[i].proportions({
            width: m[i].element[0].offsetWidth,
            height: m[i].element[0].offsetHeight
          });

        }

      },
      drop: function (draggable, event) {

        let dropped = false;

        // Create a copy of the droppables in case the list changes during the drop (#9116)
        $.each(($['ui'].ddmanager.droppables[draggable.options.scope] || []).slice(), function () {

          if (!this.options) {
            return;
          }
          if (!this.options.disabled && this.visible &&
            intersect(draggable, this, this.options.tolerance, event)) {
            dropped = this._drop.call(this, event) || dropped;
          }

          if (!this.options.disabled && this.visible && this.accept.call(this.element[0],
            (draggable.currentItem || draggable.element))) {
            this.isout = true;
            this.isover = false;
            this._deactivate.call(this, event);
          }

        });
        return dropped;

      },
      dragStart: function (draggable, event) {

        // Listen for scrolling so that if the dragging causes scrolling the position of the
        // droppables can be recalculated (see #5003)
        draggable.element.parentsUntil('body').on('scroll.droppable', function () {
          if (!draggable.options.refreshPositions) {
            $['ui'].ddmanager.prepareOffsets(draggable, event);
          }
        });
      },
      drag: function (draggable, event) {
        // If you have a highly dynamic page, you might try this option. It renders positions
        // every time you move the mouse.
        if (draggable.options.refreshPositions) {
          $['ui'].ddmanager.prepareOffsets(draggable, event);
        }

        // Run through all droppables and check their positions based on specific tolerance options
        $.each($['ui'].ddmanager.droppables[draggable.options.scope] || [], function () {

          if (this.options.disabled || this.greedyChild || !this.visible) {
            return;
          }

          let parentInstance, scope, parent,
            intersects = intersect(draggable, this, this.options.tolerance, event),
            c = !intersects && this.isover ?
              'isout' :
              (intersects && !this.isover ? 'isover' : null);
          if (!c) {
            return;
          }

          if (this.options.greedy) {

            // find droppable parents with same scope
            scope = this.options.scope;
            parent = this.element.parents(':data(ui-droppable)').filter(function () {
              return $(this)['droppable']('instance').options.scope === scope;
            });

            if (parent.length) {
              parentInstance = $(parent[0])['droppable']('instance');
              parentInstance.greedyChild = (c === 'isover');
            }
          }

          // We just moved into a greedy child
          if (parentInstance && c === 'isover') {
            parentInstance.isover = false;
            parentInstance.isout = true;
            parentInstance._out.call(parentInstance, event);
          }

          this[c] = true;
          this[c === 'isout' ? 'isover' : 'isout'] = false;
          this[c === 'isover' ? '_over' : '_out'].call(this, event);

          // We just moved out of a greedy child
          if (parentInstance && c === 'isout') {
            parentInstance.isout = false;
            parentInstance.isover = true;
            parentInstance._over.call(parentInstance, event);
          }
        });

      },
      dragStop: function (draggable, event) {
        draggable.element.parentsUntil('body').off('scroll.droppable');

        // Call prepareOffsets one final time since IE does not fire return scroll events when
        // overflow was caused by drag (see #5003)
        if (!draggable.options.refreshPositions) {
          $['ui'].ddmanager.prepareOffsets(draggable, event);
        }
      }
    };
  }
})();
