/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import { useStore } from './store';

export default function App() {
  const initSocket = useStore((state) => state.initSocket);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UI />
      </div>
    </div>
  );
}
