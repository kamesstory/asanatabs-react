/** @jsx jsx */
import {
  FunctionComponent,
  MutableRefObject,
  useEffect,
  useState,
} from 'react';
import ReactDOM from 'react-dom';

const CLOSED_STYLE = 'opacity: 0; pointer-events: none;';
const OPEN_STYLE = 'opacity: 1; pointer-events: auto;';

const Overlay: FunctionComponent<{
  isOpen: boolean;
  onClickOutside: VoidFunction;
  openerRef: MutableRefObject<HTMLDivElement | null>;
}> = ({ isOpen, children, onClickOutside, openerRef }) => {
  const [overlayNode, setOverlayNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const overlayEl = document.body.appendChild(document.createElement('div'));
    overlayEl.setAttribute('style', isOpen ? OPEN_STYLE : CLOSED_STYLE);
    setOverlayNode(overlayEl);
    return () => {
      document.body.removeChild(overlayEl);
      setOverlayNode(null);
    };
  }, [setOverlayNode]);

  useEffect(() => {
    if (isOpen) {
      if (overlayNode) overlayNode.setAttribute('style', OPEN_STYLE);
      const onClick = ({ target }: MouseEvent) => {
        if (
          !target ||
          (openerRef && openerRef.current?.contains(target as Node)) ||
          overlayNode?.contains(target as Node)
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
      if (overlayNode) overlayNode.setAttribute('style', CLOSED_STYLE);
    }
  }, [isOpen]);

  return overlayNode ? ReactDOM.createPortal(children, overlayNode) : null;
};

export default Overlay;
