import { JsonRpcProvider } from '@ethersproject/providers';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { BigNumber, ethers } from 'ethers';
import {
  BondingCalcContract,
  HemeCirculatingSupply,
  HemeTokenContract,
  HemeTokenMigrator,
  StakedHemeContract,
  StakingContract,
} from '../../abi';
import { getAddresses, ReserveKeys } from '../../constants';
import { addressForReserve, contractForReserve, getMarketPrice, getTokenPrice, setAll } from '../../helpers';

const initialState = {
  loading: true,
};

export interface IApp {
  loading: boolean;
  stakingTVL: number;
  marketPrice: number;
  marketCap: number;
  totalSupply: number;
  circSupply: number;
  currentIndex: string;
  currentBlock: number;
  currentBlockTime: number;
  fiveDayRate: number;
  treasuryBalance: number;
  stakingAPY: number;
  stakingRebase: number;
  networkID: number;
  nextRebase: number;
  stakingRatio: number;
  backingPerHeme: number;
}

interface ILoadAppDetails {
  networkID: number;
  provider: JsonRpcProvider;
}

export const loadAppDetails = createAsyncThunk(
  'app/loadAppDetails',
  //@ts-ignore
  async ({ networkID, provider }: ILoadAppDetails) => {
    const maiPrice = await getTokenPrice('MAI');

    const addresses = getAddresses(networkID);
    const currentBlock = await provider.getBlockNumber();
    const currentBlockTime = (await provider.getBlock(currentBlock)).timestamp;

    const hemeContract = new ethers.Contract(addresses.HEME_ADDRESS, HemeTokenContract, provider);
    const sHEMEContract = new ethers.Contract(addresses.sHEME_ADDRESS, StakedHemeContract, provider);
    const bondCalculator = new ethers.Contract(addresses.HEME_BONDING_CALC_ADDRESS, BondingCalcContract, provider);
    const hemeCirculatingSupply = new ethers.Contract(
      addresses.HEME_CIRCULATING_SUPPLY,
      HemeCirculatingSupply,
      provider,
    );
    const stakingContract = new ethers.Contract(addresses.STAKING_ADDRESS, StakingContract, provider);

    let reserveAmount = (
      await Promise.all(
        ReserveKeys.map(async key => {
          const token = contractForReserve(key, networkID, provider);
          return (await token.balanceOf(addresses.TREASURY_ADDRESS)) / 1e18;
        }),
      )
    ).reduce((prev, value) => prev + value);

    const lp = contractForReserve('mai_heme', networkID, provider);
    const maiHemeAmount = await lp.balanceOf(addresses.TREASURY_ADDRESS);
    const valuation = await bondCalculator.valuation(addressForReserve('mai_heme', networkID), maiHemeAmount);
    const markdown = await bondCalculator.markdown(addressForReserve('mai_heme', networkID));
    const maiHemeUSD = (valuation / 1e9) * (markdown / 1e18);

    const treasuryBalance = reserveAmount + maiHemeUSD;

    const stakingBalance = await stakingContract.contractBalance();
    const circSupply = (await hemeCirculatingSupply.HEMECirculatingSupply()) / 1e9;
    const totalSupply = (await hemeContract.totalSupply()) / 1e9;
    const epoch = await stakingContract.epoch();
    const stakingReward = epoch.distribute / 1e9;
    const sHemeCirc = (await sHEMEContract.circulatingSupply()) / 1e9;
    const stakingRebase = stakingReward / sHemeCirc;
    const fiveDayRate = Math.pow(1 + stakingRebase, 5 * 3) - 1;
    const stakingAPY = Math.pow(1 + stakingRebase, 365 * 3) - 1;
    const stakingRatio = sHemeCirc / circSupply;
    const backingPerHeme = treasuryBalance / circSupply;

    const currentIndex = await stakingContract.index();
    const nextRebase = epoch.endTime.toNumber();

    const rawMarketPrice = await getMarketPrice(networkID, provider);
    const marketPrice = Number(((rawMarketPrice.toNumber() / 1e9) * maiPrice).toFixed(2));
    const stakingTVL = (stakingBalance * marketPrice) / 1e9;
    const marketCap = circSupply * marketPrice;

    return {
      currentIndex: ethers.utils.formatUnits(currentIndex, 'gwei'),
      totalSupply,
      circSupply,
      marketCap,
      currentBlock,
      fiveDayRate,
      treasuryBalance,
      stakingAPY,
      stakingTVL,
      stakingRebase,
      marketPrice,
      currentBlockTime,
      nextRebase,
      stakingRatio,
      backingPerHeme,
    };
  },
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    fetchAppSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAppDetails.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(loadAppDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAppDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

const baseInfo = (state: { app: IApp }) => state.app;

export default appSlice.reducer;

export const { fetchAppSuccess } = appSlice.actions;

export const getAppState = createSelector(baseInfo, app => app);
