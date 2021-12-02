import { BigNumber, ethers } from 'ethers';
import { getAddresses } from '../constants';
import { HEMEMaiReserveContract as HEMEMaiReserveContract } from '../abi';

export async function getMarketPrice(
  networkID: number,
  provider: ethers.Signer | ethers.providers.Provider,
): Promise<BigNumber> {
  const address = getAddresses(networkID);
  const pairContract = new ethers.Contract(address.RESERVES.MAI_HEME, HEMEMaiReserveContract, provider);
  const reserves = await pairContract.getReserves();
  const [heme, mai] = BigNumber.from(address.MAI_ADDRESS).gt(address.HEME_ADDRESS)
    ? [reserves[0], reserves[1]]
    : [reserves[1], reserves[0]];
  const marketPrice = mai.div(heme);
  return marketPrice;
}
