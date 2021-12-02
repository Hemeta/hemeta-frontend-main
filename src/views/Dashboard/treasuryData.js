import apollo from '../../lib/apolloClient';

// TODO: add paramaterization
export const treasuryDataQuery = `
query {
  protocolMetrics(first: 100, orderBy: timestamp, orderDirection: desc) {
    id
    timestamp
    hemeCirculatingSupply
    sHemeCirculatingSupply
    totalSupply
    hemePrice
    marketCap
    totalValueLocked
    treasuryRiskFreeValue
    treasuryMarketValue
    nextEpochRebase
    nextDistributedHeme
    treasuryMaiRiskFreeValue
    treasuryMaiMarketValue
    treasuryFraxMarketValue
    treasuryFraxRiskFreeValue
    currentAPY
    runway10k
    runway20k
    runway50k
    runway7dot5k
    runway5k
    runway2dot5k
    runwayCurrent
    treasuryHemeMaiPOL
  }
}
`;

export const rebasesDataQuery = `
query {
  rebases(where: {contract: "0xfd31c7d00ca47653c6ce64af53c1571f9c36566a"}, orderBy: timestamp, first: 1000, orderDirection: desc) {
    percentage
    timestamp
  }
}
`;

export const treasuryData = () => apollo(treasuryDataQuery).then(r => r.data.protocolMetrics);

// export default treasuryData;
export const bulletpoints = {
  tvl: [
    {
      right: 20,
      top: -12,
      background: 'linear-gradient(180deg, #FFACA1 -10%, #FFACA1 100%)',
    },
  ],
  coin: [
    {
      right: 15,
      top: -12,
      background: 'linear-gradient(180deg, #DB3737 -10%, #EA9276 100%)',
    },
    {
      right: 25,
      top: -12,
      background: 'linear-gradient(180deg, #8f5ae8 -10%, #98B3E9 100%)',
    },
    {
      right: 29,
      top: -12,
      background: 'linear-gradient(180deg, #DC30EB -10%, #EA98F1 100%)',
    },
    {
      right: 29,
      top: -12,
      background: 'linear-gradient(180deg, #4C8C2A -10%, #8BFF4D 100%)',
    },
    {
      right: 29,
      top: -12,
      background: 'linear-gradient(180deg, #c9184a -10%, #ff758f 100%)',
    },
  ],
  rfv: [
    {
      right: 15,
      top: -12,
      background: 'linear-gradient(180deg, #DB3737 -10%, #EA9276 100%)',
    },
    {
      right: 25,
      top: -12,
      background: 'linear-gradient(180deg, #8f5ae8 -10%, #98B3E9 100%)',
    },
    {
      right: 29,
      top: -12,
      background: 'linear-gradient(180deg, #c9184a -10%, #ff758f 100%)',
    },
  ],
  holder: [
    {
      right: 40,
      top: -12,
      background: '#A3A3A3',
    },
  ],
  apy: [
    {
      right: 20,
      top: -12,
      background: '#1D2654',
    },
  ],
  runway: [
    {
      right: 45,
      top: -12,
      background: '#000000',
    },
    {
      right: 48,
      top: -12,
      background: '#2EC608',
    },
    {
      right: 48,
      top: -12,
      background: '#49A1F2',
    },
    {
      right: 48,
      top: -12,
      background: '#c9184a',
    },
  ],
  runway_darktheme: [
    {
      right: 45,
      top: -12,
      background: '#FFFFFF',
    },
    {
      right: 48,
      top: -12,
      background: '#2EC608',
    },
    {
      right: 48,
      top: -12,
      background: '#49A1F2',
    },
    {
      right: 48,
      top: -12,
      background: '#c9184a',
    },
  ],
  staked: [
    {
      right: 45,
      top: -11,
      background: 'linear-gradient(180deg, #ffdc77, #ffdc77 100%)',
    },
    {
      right: 68,
      top: -12,
      background: 'rgba(151, 196, 224, 0.2)',
      border: '1px solid rgba(54, 56, 64, 0.5)',
    },
  ],
  pol: [
    {
      right: 15,
      top: -12,
      background: 'linear-gradient(180deg, rgba(56, 223, 63, 1) -10%, rgba(182, 233, 152, 1) 100%)',
    },
    {
      right: 25,
      top: -12,
      background: 'rgba(219, 242, 170, 1)',
      border: '1px solid rgba(118, 130, 153, 1)',
    },
  ],
};

export const tooltipItems = {
  tvl: ['Total Value Deposited'],
  coin: ['MAI', 'FRAX'],
  rfv: ['MAI', 'FRAX'],
  holder: ['HEMEies'],
  apy: ['APY'],
  runway: ['Current', '7.5K APY', '5K APY', '2.5K APY'],
  pol: ['LP Treasury', 'Market LP'],
};

export const tooltipInfoMessages = {
  tvl: 'Total Value Deposited, is the dollar amount of all HEME staked in the protocol. This metric is often used as growth or health indicator in DeFi projects.',
  mvt: 'Market Value of Treasury Assets, is the sum of the value (in dollars) of all assets held by the treasury.',
  rfv: 'Risk Free Value, is the amount of funds the treasury guarantees to use for backing HEME.',
  pol: 'Protocol Owned Liquidity, is the amount of LP the treasury owns and controls. The more POL the better for the protocol and its users.',
  holder: 'Holders, represents the total number of hemetas (sHEME holders)',
  staked: 'HEME Staked, is the ratio of sHEME to HEME (staked vs unstaked)',
  apy: 'Annual Percentage Yield, is the normalized representation of an interest rate, based on a compounding period over one year. Note that APYs provided are rather ballpark level indicators and not so much precise future results.',
  runway: 'Runway, is the number of days sHEME emissions can be sustained at a given rate. Lower APY = longer runway',
  currentIndex:
    'The current index tracks the amount of sHEME accumulated since the beginning of staking. Basically, how much sHEME one would have if they staked and held a single HEME from day 1.',
};

export const itemType = {
  dollar: '$',
  percentage: '%',
};
