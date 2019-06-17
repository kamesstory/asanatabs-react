import React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/core'

const BigText = styled.h1`
  color: ${props => props.textColor};
`;

const customBackground = ({backgroundImage}) => css`
  body {
    background-image: url(${backgroundImage});
  }
`;

const App = () => {
  return (
    <>
      <Global
        styles={customBackground({
          backgroundImage:
            "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1000&q=80"
        })}
      />
      <BigText textColor="green">Hello World asdfasds</BigText>
      <span>asdasdasds</span>
    </>
  );
}

ReactDOM.render(
  <App></App>,
  document.getElementById("root") 
);
