import { JsonRpcProvider } from '@ethersproject/providers';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { ethers } from 'ethers';
import _ from 'lodash';
import { contractForReserve } from 'src/helpers';
import { HemeTokenContract, HemeTokenMigrator, StakedHemeContract, StakingContract } from '../../abi';
import { getAddresses } from '../../constants';
import { fetchAccountSuccess } from './account-slice';
import { loadAppDetails } from './app-slice';
import { clearPendingTxn, fetchPendingTxns, getStakingTypeText } from './pending-txns-slice';

interface IChangeApproval {
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

interface IState {
  [key: string]: any;
}

const initialState: IState = {
  loading: true,
};

export interface MigrationState extends IState {
  oldHeme: string;
  oldSHeme: string;
  oldWarmup: string;
  canClaimWarmup: boolean;
  hemeAllowance: number;
  sHEMEAllowance: number;
  oldHemeTotalSupply: number;
  oldTreasuryBalance: number;
  migrateProgress: number;
}

export interface LoadMigrationActionPayload {
  address: string;
  networkID: number;
  provider: JsonRpcProvider;
}

export const loadMigrationDetails = createAsyncThunk(
  'migration/loadMigrationDetails',
  async ({ networkID, provider, address }: LoadMigrationActionPayload): Promise<MigrationState> => {
    const addresses = getAddresses(networkID);
    const oldHemeContract = new ethers.Contract(addresses.OLD_HEME_ADDRESS, HemeTokenContract, provider);
    const oldSHemeContract = new ethers.Contract(addresses.OLD_SHEME_ADDRESS, StakedHemeContract, provider);
    const oldStakingContract = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, provider);
    const stakingContract = new ethers.Contract(addresses.STAKING_ADDRESS, StakingContract, provider);
    const migrator = new ethers.Contract(addresses.MIGRATOR, HemeTokenMigrator, provider);
    const mai = contractForReserve('mai', networkID, provider);

    const [oldHemeBalance, oldSHemeBalance, oldWarmup, oldSHemeAllowance, hemeMigratorAllowance, epoch] =
      await Promise.all([
        oldHemeContract.balanceOf(address),
        oldSHemeContract.balanceOf(address),
        oldStakingContract.warmupInfo(address),
        oldSHemeContract.allowance(address, addresses.OLD_STAKING_ADDRESS),
        oldHemeContract.allowance(address, addresses.MIGRATOR),
        stakingContract.epoch(),
      ]);
    const oldHemeTotalSupply = (await oldHemeContract.totalSupply()) / 1e9;
    const oldTreasuryBalance = (await mai.balanceOf(addresses.OLD_TREASURY)) / 1e18;
    const oldTotalSupply = (await migrator.oldSupply()) / 1e9;
    const migrateProgress = 1 - oldHemeTotalSupply / oldTotalSupply;

    const oldGons = oldWarmup[1];
    const oldWarmupBalance = await oldSHemeContract.balanceForGons(oldGons);

    return {
      oldHeme: ethers.utils.formatUnits(oldHemeBalance, 9),
      oldSHeme: ethers.utils.formatUnits(oldSHemeBalance, 9),
      oldWarmup: ethers.utils.formatUnits(oldWarmupBalance, 9),
      canClaimWarmup: oldWarmup[0].gt(0) && epoch[1].gte(oldWarmup[2]),
      sHEMEAllowance: +oldSHemeAllowance,
      hemeAllowance: +hemeMigratorAllowance,
      oldHemeTotalSupply,
      oldTreasuryBalance,
      migrateProgress,
    };
  },
);

export const approveUnstaking = createAsyncThunk(
  'migration/approve-unstaking',
  async ({ provider, address, networkID }: IChangeApproval, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const sHEMEContract = new ethers.Contract(addresses.OLD_SHEME_ADDRESS, StakedHemeContract, signer);

    let approveTx;
    try {
      approveTx = await sHEMEContract.approve(addresses.OLD_STAKING_ADDRESS, ethers.constants.MaxUint256);

      const text = 'Approve Unstaking';
      const pendingTxnType = 'approve_unstaking';

      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (error: any) {
      alert(error.message);
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    const sHEMEAllowance = await sHEMEContract.allowance(address, addresses.OLD_STAKING_ADDRESS);

    return dispatch(
      fetchAccountSuccess({
        migration: {
          sHEMEAllowance: +sHEMEAllowance,
        },
      }),
    );
  },
);

export const approveMigration = createAsyncThunk(
  'migration/approve-migration',
  async ({ provider, address, networkID }: IChangeApproval, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);

    const signer = provider.getSigner();
    const hemeContract = new ethers.Contract(addresses.OLD_HEME_ADDRESS, HemeTokenContract, signer);

    let approveTx;
    try {
      approveTx = await hemeContract.approve(addresses.MIGRATOR, ethers.constants.MaxUint256);

      const text = 'Approve Migration';
      const pendingTxnType = 'approve_migration';

      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (error: any) {
      alert(error.message);
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    const hemeAllowance = await hemeContract.allowance(address, addresses.MIGRATOR);

    return dispatch(
      fetchAccountSuccess({
        migration: {
          hemeAllowance: +hemeAllowance,
        },
      }),
    );
  },
);

export interface MigrateAction {
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

export const migrate = createAsyncThunk(
  'migration/migrate',
  async ({ provider, address, networkID }: MigrateAction, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const migrator = new ethers.Contract(addresses.MIGRATOR, HemeTokenMigrator, signer);

    let tx;
    try {
      tx = await migrator.migrate();
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: 'Migrating', type: 'migrating' }));
      await tx.wait();
    } catch (error: any) {
      alert(error.message);
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
    dispatch(loadAppDetails({ networkID, provider }));
  },
);

interface UnstakeAction {
  value: string;
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

export const unstake = createAsyncThunk(
  'migration/unstake',
  async ({ value, provider, address, networkID }: UnstakeAction, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, signer);

    let tx;

    try {
      tx = await staking.unstake(ethers.utils.parseUnits(value, 'gwei'), false);
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: getStakingTypeText('unstake'), type: 'unstaking' }));
      await tx.wait();
    } catch (error: any) {
      if (error.code === -32603 && error.message.indexOf('ds-math-sub-underflow') >= 0) {
        alert('You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow');
      } else {
        alert(error.message);
      }
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
  },
);

interface ClaimWarmupPayload {
  provider: JsonRpcProvider;
  address: string;
  networkID: number;
}

export const claimWarmup = createAsyncThunk(
  'migration/claimWarmup',
  async ({ provider, address, networkID }: ClaimWarmupPayload, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, signer);

    let tx;
    try {
      tx = await staking.claim(address);
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: 'CLAIMING', type: 'claimWarmup' }));
      await tx.wait();
    } catch (error: any) {
      if (error.code === -32603 && error.message.indexOf('ds-math-sub-underflow') >= 0) {
        alert('You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow');
      } else {
        alert(error.message);
      }
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
  },
);

export const clearWarmup = createAsyncThunk(
  'migration/clear-warmup',
  async ({ provider, address, networkID }: ClaimWarmupPayload, { dispatch }) => {
    if (!provider) {
      alert('Please connect your wallet!');
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const staking = new ethers.Contract(addresses.OLD_STAKING_ADDRESS, StakingContract, signer);

    let tx;
    try {
      tx = await staking.claim(address);
      dispatch(fetchPendingTxns({ txnHash: tx.hash, text: 'CLAIMING', type: 'claimWarmup' }));
      await tx.wait();
    } catch (error: any) {
      if (error.code === -32603 && error.message.indexOf('ds-math-sub-underflow') >= 0) {
        alert('You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow');
      } else {
        alert(error.message);
      }
      return;
    } finally {
      if (tx) {
        dispatch(clearPendingTxn(tx.hash));
      }
    }
    dispatch(loadMigrationDetails({ address, networkID, provider }));
  },
);

const migrateSlice = createSlice({
  name: 'migrate',
  initialState,
  reducers: {
    fetchMigrationSuccess(state, action) {
      _.merge(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadMigrationDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadMigrationDetails.fulfilled, (state, action) => {
        _.merge(state, action.payload);
        state.loading = false;
      })
      .addCase(loadMigrationDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default migrateSlice.reducer;

export const { fetchMigrationSuccess } = migrateSlice.actions;

const baseInfo = (state: { migrate: MigrationState }) => state.migrate;

export const getMigrationState = createSelector(baseInfo, migrate => migrate);
