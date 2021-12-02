import { SvgIcon } from '@material-ui/core';
import { ReactComponent as HEME } from '../assets/tokens/HEME.svg';
import { ReactComponent as MAI } from '../assets/tokens/MAI.svg';

const iconStyle = {
  height: '32px',
  width: '32px',
  zIndex: 1,
};

const secondIconStyle = {
  ...iconStyle,
  transform: 'translateX(-10px)',
  zIndex: 0,
};

export function getPairImage(name: string) {
  if (name.indexOf('mai') >= 0) {
    return (
      <>
        <SvgIcon component={HEME} viewBox="0 0 32 32" style={iconStyle} />
        <SvgIcon component={MAI} viewBox="0 0 32 32" style={secondIconStyle} />
      </>
    );
  }

  throw Error(`Pair image doesn't support: ${name}`);
}
