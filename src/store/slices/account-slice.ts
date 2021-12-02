import { ethers } from 'ethers';
import { BondKey, getAddresses, getBond } from '../../constants';
import { HemeTokenContract, StakedHemeContract, MAIContract, StakingContract } from '../../abi/';
import { contractForBond, contractForReserve, setAll } from '../../helpers';

import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { JsonRpcProvider } from '@ethersproject/providers';
import _ from 'lodash';

interface IState {
  [key: string]: any;
}

const initialState: IState = {
  loading: true,
};

interface IAccountProps {
  address: string;
  networkID: number;
  provider: JsonRpcProvider;
}

interface IUserBondDetails {
  bond?: string;
  allowance?: number;
  balance?: number;
  rawBalance?: string;
  interestDue?: number;
  bondMaturationTime?: number;
  pendingPayout?: number;
}

export interface IAccount {
  balances: {
    mai: string;
    sHeme: string;
    heme: string;
  };
  staking: {
    hemeStake: number;
    sHemeUnstake: number;
    warmup: string;
    canClaimWarmup: boolean;
  };
}

export const getBalances = createAsyncThunk(
  'account/getBalances',
  async ({ address, networkID, provider }: IAccountProps) => {
    const addresses = getAddresses(networkID);
    const sHemeContract = new ethers.Contract(addresses.sHEME_ADDRESS, StakedHemeContract, provider);
    const sHemeBalance = await sHemeContract.balanceOf(address);
    const hemeContract = new ethers.Contract(addresses.HEME_ADDRESS, HemeTokenContract, provider);
    const hemeBalance = await hemeContract.balanceOf(address);
    return {
      balances: {
        sHeme: ethers.utils.formatUnits(sHemeBalance, 9),
        heme: ethers.utils.formatUnits(hemeBalance, 9),
      },
    };
  },
);

export const loadAccountDetails = createAsyncThunk(
  'account/loadAccountDetails',
  async ({ networkID, provider, address }: IAccountProps): Promise<IAccount> => {
    const addresses = getAddresses(networkID);

    const maiContract = new ethers.Contract(addresses.MAI_ADDRESS, MAIContract, provider);
    const hemeContract = new ethers.Contract(addresses.HEME_ADDRESS, HemeTokenContract, provider);
    const sHemeContract = new ethers.Contract(addresses.sHEME_ADDRESS, StakedHemeContract, provider);
    const stakingContract = new ethers.Contract(addresses.STAKING_ADDRESS, StakingContract, provider);

    const [maiBalance, hemeBalance, stakeAllowance, sHemeBalance, unstakeAllowance, warmup, epoch] = await Promise.all([
      maiContract.balanceOf(address),
      hemeContract.balanceOf(address),
      hemeContract.allowance(address, addresses.STAKING_HELPER_ADDRESS),
      sHemeContract.balanceOf(address),
      sHemeContract.allowance(address, addresses.STAKING_ADDRESS),
      stakingContract.warmupInfo(address),
      stakingContract.epoch(),
    ]);

    const gons = warmup[1];
    const warmupBalance = await sHemeContract.balanceForGons(gons);

    return {
      balances: {
        sHeme: ethers.utils.formatUnits(sHemeBalance, 9),
        heme: ethers.utils.formatUnits(hemeBalance, 9),
        mai: ethers.utils.formatEther(maiBalance),
      },
      staking: {
        hemeStake: +stakeAllowance,
        sHemeUnstake: +unstakeAllowance,
        warmup: ethers.utils.formatUnits(warmupBalance, 9),
        canClaimWarmup: warmup[0].gt(0) && epoch[1].gte(warmup[2]),
      },
    };
  },
);

interface CalculateUserBondDetailsActionPayload {
  address: string;
  bondKey: BondKey;
  networkID: number;
  provider: JsonRpcProvider;
}

export const calculateUserBondDetails = createAsyncThunk(
  'bonding/calculateUserBondDetails',
  async ({
    address,
    bondKey,
    networkID,
    provider,
  }: CalculateUserBondDetailsActionPayload): Promise<IUserBondDetails> => {
    if (!address) return {};

    const addresses = getAddresses(networkID);
    const bond = getBond(bondKey, networkID);
    const bondContract = contractForBond(bondKey, networkID, provider);
    const reserveContract = contractForReserve(bondKey, networkID, provider);
    const sHEME = new ethers.Contract(addresses.sHEME_ADDRESS, StakedHemeContract, provider);

    let interestDue, pendingPayout, bondMaturationTime;

    const bondDetails = await bondContract.bondInfo(address);
    interestDue = (bond.autostake ? await sHEME.balanceForGons(bondDetails.gonsPayout) : bondDetails.payout) / 1e9;
    bondMaturationTime = +bondDetails.vesting + +bondDetails.lastTimestamp;
    pendingPayout = await bondContract.pendingPayoutFor(address);

    const allowance = await reserveContract.allowance(address, bond.address);
    const rawBalance = (await reserveContract.balanceOf(address)).toString();
    const balance = ethers.utils.formatEther(rawBalance);

    return {
      bond: bondKey,
      allowance: Number(allowance),
      balance: Number(balance),
      rawBalance,
      interestDue,
      bondMaturationTime,
      pendingPayout: Number(ethers.utils.formatUnits(pendingPayout, 9)),
    };
  },
);

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      _.merge(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.status = 'loading';
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.status = 'idle';
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.status = 'idle';
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.status = 'loading';
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.status = 'idle';
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.status = 'idle';
        console.log(error);
      })
      .addCase(calculateUserBondDetails.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
        //@ts-ignore
        const bond = action.payload.bond!;
        state[bond] = action.payload;
        state.loading = false;
      })
      .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: { account: IAccount }) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
