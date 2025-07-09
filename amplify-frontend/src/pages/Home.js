import React from "react";
import { Flex } from '@aws-amplify/ui-react';
import FigmaHomeLayout from '../components/FigmaHomeLayout';

export default function Home() {
  return (
    <Flex
      direction="column"
      alignItems="flex-start"
      gap="32px"
      width="1280px"
      height="1084px"
      paddingTop="24px"
      paddingBottom="56px"
      paddingLeft="24px"
      paddingRight="24px"
      backgroundColor="rgba(242,242,245,1)" // rgb(0.95,0.95,0.96)
      border="0px solid rgba(233,236,239,1)" // stroke overlay
      style={{ boxSizing: 'border-box' }}
    >
      <FigmaHomeLayout />
      {/* Place your homepage content/components here, inside this Flex */}
    </Flex>
  );
}
