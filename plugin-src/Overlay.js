import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { css, cx } from '@emotion/core';

const Overlay = ({ isOpen, children, onClickOutside, openerRef }) => {
  const [overlayNode, setOverlayNode] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const overlayEl = document.body.appendChild(
        document.createElement('div')
      );
      const onClick = ({ target }) => {
        if (
          !target ||
          (openerRef && openerRef.current.contains(target)) ||
          overlayEl.contains(target)
        ) {
          return;
        }
        onClickOutside();
      };
      // Fix later: nesting issues
      document.body.addEventListener('mousedown', onClick);
      setOverlayNode(overlayEl);

      return () => {
        document.body.removeEventListener('mousedown', onClick);
        document.body.removeChild(overlayEl);
      };
    } else {
      setOverlayNode(null);
    }
  }, [isOpen]);

  return overlayNode ? ReactDOM.createPortal(children, overlayNode) : null;
};

export default Overlay;
