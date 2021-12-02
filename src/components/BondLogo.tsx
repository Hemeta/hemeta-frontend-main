import { getTokenImage, getPairImage } from '../helpers';
import { Box } from '@material-ui/core';
import { Bond } from 'src/constants';

interface IBondHeaderProps {
  bond: Bond;
}

function BondHeader({ bond }: IBondHeaderProps) {
  const reserveAssetImg = () => {
    if (bond.key.indexOf('heme') >= 0) {
      return getTokenImage('heme');
    } else if (bond.key.indexOf('mai') >= 0) {
      return getTokenImage('mai');
    } else if (bond.key.indexOf('frax') >= 0) {
      return getTokenImage('frax', 32);
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" width={'74px'}>
      {bond.type === 'lp' ? getPairImage(bond.key) : reserveAssetImg()}
    </Box>
  );
}

export default BondHeader;
