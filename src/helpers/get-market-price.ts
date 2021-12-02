import { BigNumber, ethers } from 'ethers';
import { getAddresses } from '../constants';
import { HemeMaiReserveContract } from '../abi';

export async function getMarketPrice(
  networkID: number,
  provider: ethers.Signer | ethers.providers.Provider,
): Promise<BigNumber> {
  const address = getAddresses(networkID);
  const pairContract = new ethers.Contract(address.RESERVES.MAI_HEME, HemeMaiReserveContract, provider);
  const reserves = await pairContract.getReserves();
  const marketPrice = reserves[1].div(reserves[0]);
  return marketPrice;
}
