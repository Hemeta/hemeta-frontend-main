import { SvgIcon } from '@material-ui/core';
import { ReactComponent as HEME } from '../assets/tokens/HEME.svg';
import { ReactComponent as StakedHeme } from '../assets/tokens/sHEME.svg';
import { ReactComponent as FRAX } from '../assets/tokens/FRAX.svg';
import { ReactComponent as MAI } from '../assets/tokens/MAI.svg';

export function getMAITokenImage(size: number = 32) {
  const style = { height: size, width: size };
  return <SvgIcon component={MAI} viewBox="0 0 32 32" style={style} />;
}

export function getHEMETokenImage(size: number = 32) {
  const style = { height: size, width: size };
  return <SvgIcon component={HEME} viewBox="0 0 32 32" style={style} />;
}

export function getStakedHEMETokenImage(size: number = 32) {
  const style = { height: size, width: size };
  return <SvgIcon component={StakedHeme} viewBox="0 0 100 100" style={style} />;
}

export function getFRAXTokenImage(size: number = 32) {
  const style = { height: size, width: size };
  return <SvgIcon component={FRAX} viewBox="0 0 32 32" style={style} />;
}

export type Token = 'heme' | 'mai' | 'sheme' | 'heme2' | 'sheme2' | 'frax';

export function getTokenImage(name: Token, size: number = 32): JSX.Element {
  if (name === 'mai') return getMAITokenImage(size);
  if (name === 'heme' || name === 'heme2') return getHEMETokenImage(size);
  if (name === 'sheme' || name === 'sheme2') return getStakedHEMETokenImage(size);
  if (name === 'frax') return getFRAXTokenImage(size);

  throw Error(`Token image doesn't support: ${name}`);
}

function toUrl(base: string): string {
  const url = window.location.origin;
  return url + '/' + base;
}

export function getTokenUrl(name: Token) {
  if (name === 'heme' || name === 'heme2') {
    const path = require('../assets/tokens/HEME.svg').default;
    return toUrl(path);
  }

  if (name === 'sheme' || name === 'sheme2') {
    const path = require('../assets/tokens/sHEME.svg').default;
    return toUrl(path);
  }

  throw Error(`Token url doesn't support: ${name}`);
}
