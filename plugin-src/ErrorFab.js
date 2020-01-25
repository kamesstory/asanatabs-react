import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import Overlay from './Overlay';

const roundedBox = css`
  display: grid;
  background: white;
  border-radius: 8px;
  color: #2b2647;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
  z-index: 998;
`;

const Popover = styled.div`
  opacity: 0;
  width: 420px;
  padding: 32px 28px;
  position: fixed;
  bottom: 108px;
  right: 28px;
  ${roundedBox}

  transform: translateY(8px);
  transition: opacity 0.15s, transform 0.15s;
  ${({ isOpen }) =>
    isOpen &&
    css`
      opacity: 1;
      transform: translateY(0);
    `}
`;

const FabOuter = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  background-color: #2b2647;
  border-radius: 50%;
  font-weight: 400;
  text-align: center;
  font-size: 30px;
  color: white;
  width: 64px;
  height: 64px;
  line-height: 64px;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
`;

const FabSymbol = styled.span`
  display: inline-block;
`;

const ErrorFab = ({ errorMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef(null);

  useEffect(() => {
    const keypressHandler = event => {
      if (isOpen && event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', keypressHandler);
    return () => window.removeEventListener('keydown', keypressHandler);
  });

  // TODO: include settings helper that allows people to submit feedback forms to me
  // TODO: allow for local storage clearing

  return (
    <>
      <FabOuter ref={fabRef} onClick={() => setIsOpen(!isOpen)}>
        <FabSymbol isOpen={isOpen}>!</FabSymbol>
      </FabOuter>
      <Overlay
        openerRef={fabRef}
        isOpen={isOpen}
        onClickOutside={() => setIsOpen(false)}
      >
        <Popover isOpen={isOpen}>{errorMessage}</Popover>
      </Overlay>
    </>
  );
};

export default ErrorFab;
