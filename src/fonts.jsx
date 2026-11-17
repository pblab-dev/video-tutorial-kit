import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

export const FONTS = [
  ['Montserrat', '700', 'fonts/montserrat-700.woff2'],
  ['Montserrat', '800', 'fonts/montserrat-800.woff2'],
  ['Montserrat', '900', 'fonts/montserrat-900.woff2'],
  ['JetBrains Mono', '500', 'fonts/jbmono-500.woff2'],
  ['JetBrains Mono', '700', 'fonts/jbmono-700.woff2'],
];

// só renderiza os filhos depois de carregar as fontes (DOM e canvas das texturas)
export const FontGate = ({children}) => {
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(
      FONTS.map(([family, weight, path]) => {
        const ff = new FontFace(family, `url(${staticFile(path)})`, {weight});
        return ff.load().then((f) => document.fonts.add(f));
      })
    ).then(() => { setOk(true); continueRender(handle); });
  }, [handle]);
  return ok ? children : null;
};
