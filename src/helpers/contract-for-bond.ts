import { ethers } from 'ethers';
import { BondKey, getBond } from '../constants';
import { HemetaBond, HemetaBondStake } from '../abi';

export const contractForBond = (
  bond: BondKey,
  networkID: number,
  provider: ethers.Signer | ethers.providers.Provider,
): ethers.Contract => {
  const { address, autostake } = getBond(bond, networkID);
  return new ethers.Contract(address, autostake ? HemetaBondStake : HemetaBond, provider);
};
