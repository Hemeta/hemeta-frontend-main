import { Box, Grid, makeStyles, Paper, TabsActions, Zoom } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SHEME from 'src/assets/tokens/sHEME.png';
import { formatCurrency, trim } from '../../helpers';
import { useWeb3Context } from '../../hooks';
import {
  approveMigration,
  approveUnstaking,
  claimWarmup,
  loadMigrationDetails,
  migrate,
  unstake,
} from '../../store/slices/migrate-slice';
import { IPendingTxn, isPendingTxn, txnButtonText } from '../../store/slices/pending-txns-slice';
import { IReduxState } from '../../store/slices/state.interface';
import './migrate.scss';

const useStyles = makeStyles(theme => ({
  root: {
    '& .MuiOutlinedInput-root': {
      borderColor: 'transparent',
      backgroundColor: theme.palette.background.default,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode.lightGray300,
    },
  },
}));

function Migrate() {
  const styles = useStyles();
  const dispatch = useDispatch();
  const { provider, readOnlyProvider, address, connect, connected, chainID } = useWeb3Context();
  const tabsActions = useRef<TabsActions>(null);

  const isAppLoading = useSelector<IReduxState, boolean>(state => state.migrate.loading);

  const oldHemeTotalSupply = useSelector<IReduxState, number>(state => state.migrate?.oldHemeTotalSupply);
  const oldTreasuryBalance = useSelector<IReduxState, number>(state => state.migrate?.oldTreasuryBalance);
  const migrateProgress = useSelector<IReduxState, number>(state => state.migrate?.migrateProgress);
  const hemeBalance = useSelector<IReduxState, string>(state => state.account.balances?.heme);
  const oldHemeBalance = useSelector<IReduxState, string>(state => state.migrate?.oldHeme);
  const oldSHemeBalance = useSelector<IReduxState, string>(state => state.migrate?.oldSHeme);
  const oldWarmupBalance = useSelector<IReduxState, string>(state => state.migrate?.oldWarmup);
  const canClaimWarmup = useSelector<IReduxState, boolean>(state => state.migrate?.canClaimWarmup);
  const hemeAllowance = useSelector<IReduxState, number>(state => state.migrate?.hemeAllowance);
  const sHEMEAllowance = useSelector<IReduxState, number>(state => state.migrate?.sHEMEAllowance);
  const pendingTransactions = useSelector<IReduxState, IPendingTxn[]>(state => {
    return state.pendingTransactions;
  });

  const onMigrate = async () => {
    await dispatch(migrate({ address, provider, networkID: chainID }));
  };

  const onUnstake = async () => {
    await dispatch(unstake({ address, value: oldSHemeBalance, provider, networkID: chainID }));
  };

  const onClaimWarmup = async () => {
    await dispatch(claimWarmup({ address, provider, networkID: chainID }));
  };

  useEffect(() => {
    if (tabsActions.current) {
      setTimeout(() => tabsActions?.current?.updateIndicator(), 300);
    }
  }, [tabsActions]);
  useEffect(() => {
    if (connected) {
      dispatch(
        loadMigrationDetails({
          provider: readOnlyProvider,
          networkID: chainID,
          address,
        }),
      );
    }
  }, [connected, address]);

  return (
    <div id="stake-view" className={styles.root}>
      <Zoom in={true}>
        <Paper className="ohm-card">
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <div className="card-header">
                <p className="single-stake-title">
                  HEME ??? HEME2 Migration ({<img src={SHEME} />},{<img src={SHEME} />})
                </p>
              </div>
            </Grid>

            <Grid item>
              <div className="stake-top-metrics">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <div className="stake-apy">
                      <p className="single-stake-subtitle">Old HEME Supply</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {oldHemeTotalSupply ? trim(oldHemeTotalSupply, 0) : <Skeleton width="150px" />}
                      </Box>
                    </div>
                  </Grid>

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <div className="stake-index">
                      <p className="single-stake-subtitle">Old Treasury Reserve</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {oldTreasuryBalance ? formatCurrency(oldTreasuryBalance, 0) : <Skeleton width="150px" />}
                      </Box>
                    </div>
                  </Grid>

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <div className="stake-index">
                      <p className="single-stake-subtitle">Migration Progress</p>
                      <Box component="p" color="text.secondary" className="single-stake-subtitle-value">
                        {migrateProgress ? (
                          Intl.NumberFormat('en', { style: 'percent' }).format(migrateProgress)
                        ) : (
                          <Skeleton width="150px" />
                        )}
                      </Box>
                    </div>
                  </Grid>
                </Grid>
              </div>
            </Grid>

            <div className="staking-area">
              {!address ? (
                <div className="stake-wallet-notification">
                  <div className="wallet-menu" id="wallet-menu">
                    <Box bgcolor="hemeta.hemetaBlue" className="app-hemeta-button" onClick={connect}>
                      <p>Connect Wallet</p>
                    </Box>
                  </div>
                  <p className="desc-text">Connect your wallet to migrate your HEME tokens!</p>
                </div>
              ) : (
                <div className="migrate-table">
                  <div className="data-row">
                    <div style={{ width: '24px' }} />
                    <div className="data-row-title">Steps</div>
                    <div className="data-row-title">Your amount</div>
                    <div className="data-row-action" />
                  </div>
                  <div className="data-row">
                    <div className="step">1</div>
                    <div className="data-row-name data-row-expand">Claim warmup</div>
                    <div className="data-row-value data-row-expand">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldWarmupBalance), 4)} sHEME</>}
                    </div>
                    <div className="data-row-action">
                      {Number(oldWarmupBalance) === 0 && <Box className="migrate-done">DONE</Box>}
                      {canClaimWarmup && (
                        <Box
                          className="migrate-btn"
                          bgcolor="hemeta.hemetaBlue"
                          onClick={() => {
                            if (isPendingTxn(pendingTransactions, 'claimWarmup')) return;
                            onClaimWarmup();
                          }}
                        >
                          <p>{txnButtonText(pendingTransactions, 'claimWarmup', 'Claim Warmup')}</p>
                        </Box>
                      )}
                    </div>
                  </div>

                  <div className="data-row">
                    <div className="step">2</div>
                    <div className="data-row-name data-row-expand">Unstake HEME</div>
                    <div className="data-row-value data-row-expand">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldSHemeBalance), 4)} sHEME</>}
                    </div>
                    <div className="data-row-action">
                      {+oldSHemeBalance === 0 && <Box className="migrate-done">DONE</Box>}
                      {+oldSHemeBalance > 0 &&
                        (sHEMEAllowance > 0 ? (
                          <Box
                            className="migrate-btn"
                            bgcolor="hemeta.hemetaBlue"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'unstaking')) return;
                              onUnstake();
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'unstaking', 'Unstake HEME')}</p>
                          </Box>
                        ) : (
                          <Box
                            className="migrate-btn"
                            bgcolor="hemeta.hemetaBlue"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'approve_unstaking')) return;
                              dispatch(approveUnstaking({ address, provider, networkID: chainID }));
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'approve_unstaking', 'Approve')}</p>
                          </Box>
                        ))}
                    </div>
                  </div>

                  <div className="data-row">
                    <div className="step">3</div>
                    <div className="data-row-name data-row-expand">
                      <div>Migrate HEME to HEME2</div>
                      <div className="estimated-heme2">Estimated HEME2 </div>
                    </div>
                    <div className="data-row-value data-row-expand">
                      <div>
                        {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldHemeBalance), 4)} HEME</>}
                      </div>
                      <div className="estimated-heme2">
                        {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(oldHemeBalance) / 5, 4)} HEME2</>}
                      </div>
                    </div>
                    <div className="data-row-action">
                      {+oldHemeBalance > 0 &&
                        (hemeAllowance >= +oldHemeBalance ? (
                          <Box
                            className="migrate-btn"
                            bgcolor="hemeta.hemetaBlue"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'migrating')) return;
                              onMigrate();
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'migrating', 'Migrate')}</p>
                          </Box>
                        ) : (
                          <Box
                            className="migrate-btn"
                            bgcolor="hemeta.hemetaBlue"
                            onClick={() => {
                              if (isPendingTxn(pendingTransactions, 'approve_migration')) return;
                              dispatch(approveMigration({ address, provider, networkID: chainID }));
                            }}
                          >
                            <p>{txnButtonText(pendingTransactions, 'approve_migration', 'Approve')}</p>
                          </Box>
                        ))}
                    </div>
                  </div>

                  <Box className="data-row" bgcolor="mode.lightGray100">
                    <div />
                    <p className="data-row-name data-row-expand">Your HEME2 Balance</p>
                    <p />
                    <p className="data-row-value data-row-action">
                      {isAppLoading ? <Skeleton width="80px" /> : <>{trim(Number(hemeBalance), 4)} HEME2</>}
                    </p>
                  </Box>
                </div>
              )}
            </div>
          </Grid>
        </Paper>
      </Zoom>
    </div>
  );
}

export default Migrate;
