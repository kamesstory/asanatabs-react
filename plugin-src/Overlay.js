import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ClassNames } from '@emotion/core';

const CLOSED_STYLE = 'opacity: 0; pointer-events: none;';
const OPEN_STYLE = 'opacity: 1; pointer-events: auto;';

const Overlay = ({ isOpen, children, onClickOutside, openerRef }) => {
  const [overlayNode, setOverlayNode] = useState(null);

  useEffect(() => {
    const overlayEl = document.body.appendChild(document.createElement('div'));
    overlayEl.style = isOpen ? OPEN_STYLE : CLOSED_STYLE;
    setOverlayNode(overlayEl);
    return () => {
      document.body.removeChild(overlayEl);
      setOverlayNode(null);
    };
  }, [setOverlayNode]);

  useEffect(() => {
    if (isOpen) {
      if (overlayNode) overlayNode.style = OPEN_STYLE;
      const onClick = ({ target }) => {
        if (
          !target ||
          (openerRef && openerRef.current.contains(target)) ||
          overlayNode.contains(target)
        ) {
          return;
        }
        onClickOutside();
      };
      // Fix later: nesting issues
      document.body.addEventListener('mousedown', onClick);
      return () => {
        document.body.removeEventListener('mousedown', onClick);
      };
    } else {
      if (overlayNode) overlayNode.style = CLOSED_STYLE;
    }
  }, [isOpen]);

  return overlayNode ? ReactDOM.createPortal(children, overlayNode) : null;
};

export default Overlay;
