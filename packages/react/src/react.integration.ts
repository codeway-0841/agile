import { Agile, Integration } from '@agile-ts/core';
import { AgileReactComponent } from './hooks/AgileHOC';
import React from 'react';

const reactIntegration = new Integration<typeof React, AgileReactComponent>({
  key: 'react',
  frameworkInstance: React,
  bind() {
    // Nothing to bind ;D
    return Promise.resolve(true);
  },
  updateMethod(componentInstance, updatedData: Object) {
    // UpdatedData will be empty if the AgileHOC doesn't get an object as deps

    if (Object.keys(updatedData).length !== 0) {
      // Update Props
      componentInstance.updatedProps = {
        ...componentInstance.updatedProps,
        ...updatedData,
      };

      // Set State
      componentInstance.setState(updatedData);
    } else {
      componentInstance.forceUpdate();
    }
  },
});
Agile.initialIntegrations.push(reactIntegration);

export default reactIntegration;
