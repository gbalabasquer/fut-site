import React, { Component } from 'react';
import web3 from '../web3';
import Footer from './Footer';
import NavBar from './NavBar';
import Accounts from './Accounts';
import NoEthereum from './NoEthereum';
import futbets from '../vendor/futbets';
import Matches from './Matches';

class App extends Component {
  constructor() {
    super();

    const params = window.location.hash.replace(/^#\/?|\/$/g, '').split('/');

    this.state = {
      url: params.length > 0 ? params[0] : '',
      network: {
        syncing: null,
        startingBlock: null,
        currentBlock: null,
        highestBlock: null,
        latestBlock: null,
        outOfSync: null,
        isConnected: null,
        network: null,
        accounts: null,
        defaultAccount: null
      },
      matches: {},
    };

    this.checkNetwork = this.checkNetwork.bind(this);
    this.initNetwork = this.initNetwork.bind(this);
    this.checkAccounts = this.checkAccounts.bind(this);
    this.changeAccount = this.changeAccount.bind(this);
    this.initContracts = this.initContracts.bind(this);
    this.setUrl = this.setUrl.bind(this);
    this.parseUrl = this.parseUrl.bind(this);

    web3.eth.isSyncing((error, sync) => {
      if (!error) {
        const networkState = {...this.state.network};
        networkState['syncing'] = (sync !== false);
        this.setState({ network: networkState });

        // Stop all app activity
        if (sync === true) {
          // We use `true`, so it stops all filters, but not the web3.eth.syncing polling
          web3.reset(true);
          this.checkNetwork();
        // show sync info
        } else if (sync) {
          const networkState = {...this.state.network};
          networkState['startingBlock'] = sync.startingBlock;
          networkState['currentBlock'] = sync.currentBlock;
          networkState['highestBlock'] = sync.highestBlock;
          this.setState({ network: networkState });
        } else {
          const networkState = {...this.state.network};
          networkState['outOfSync'] = false;
          this.setState({ network: networkState });
        }
      }
    });
  }

  initContracts() {
    // Testing purpose
    window.futbets = futbets;
    //
    futbets.class(web3, this.state.network.network);

    futbets.objects.futbets.getLastMatchId.call((error, lastMatchId) => {
      if (!error) {
        for (let i = 1; i <= lastMatchId; i++) {
          futbets.objects.futbets.getMatch.call(i, (error2, match) => {
            if (!error2) {
              const matches = {...this.state.matches};
              if (typeof matches[i] === 'undefined') {
                matches[i] = {};
              }
              matches[i].week = match[0].valueOf();
              matches[i].year = match[1].valueOf();
              matches[i].local = match[2].valueOf();
              matches[i].visitor = match[3].valueOf();
              matches[i].time = match[4].valueOf(),
              this.setState({ matches: matches });
            }
          });
          futbets.objects.futbets.getMatchBetsAmount.call(i, (error3, amounts) => {
            if (!error3) {
              const matches = {...this.state.matches};
              if (typeof matches[i] === 'undefined') {
                matches[i] = {};
              }
              matches[i].localBetsAmount = amounts[0].valueOf();
              matches[i].visitorBetsAmount = amounts[1].valueOf();
              matches[i].tieBetsAmount = amounts[2].valueOf();
              this.setState({ matches: matches });
            }
          });
        }
      }
    });
  }

  componentDidMount() {
    this.checkNetwork();
    this.checkAccounts();
    this.initContracts();

    this.checkAccountsInterval = setInterval(this.checkAccounts, 10000);
    this.checkNetworkInterval = setInterval(this.checkNetwork, 3000);
  }

  componentWillUnmount() {
    clearInterval(this.checkAccountsInterval);
    clearInterval(this.checkNetworkInterval);
  }

  checkNetwork() {
    web3.version.getNode((error) => {
      const isConnected = !error;

      // Check if we are synced
      if (isConnected) {
        web3.eth.getBlock('latest', (e, res) => {
          if (typeof(res) === 'undefined') {
            console.debug('YIKES! getBlock returned undefined!');
          }
          if (res.number >= this.state.network.latestBlock) {
            const networkState = {...this.state.network};
            networkState['latestBlock'] = res.number;
            networkState['outOfSync'] = e != null || ((new Date().getTime() / 1000) - res.timestamp) > 600;
            this.setState({ network: networkState });
          } else {
            // XXX MetaMask frequently returns old blocks
            // https://github.com/MetaMask/metamask-plugin/issues/504
            console.debug('Skipping old block');
          }
        });
      }

      // Check which network are we connected to
      // https://github.com/ethereum/meteor-dapp-wallet/blob/90ad8148d042ef7c28610115e97acfa6449442e3/app/client/lib/ethereum/walletInterface.js#L32-L46
      if (this.state.network.isConnected !== isConnected) {
        if (isConnected === true) {
          web3.eth.getBlock(0, (e, res) => {
            let network = false;
            if (!e) {
              switch (res.hash) {
                case '0x41941023680923e0fe4d74a34bdac8141f2540e3ae90623718e47d66d1ca4a2d':
                  network = 'ropsten';
                  break;
                case '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3':
                  network = 'live';
                  break;
                default:
                  console.log('setting network to private');
                  console.log('res.hash:', res.hash);
                  network = 'private';
              }
            }
            if (this.state.network.network !== network) {
              this.initNetwork(network);
            }
          });
        } else {
          const networkState = {...this.state.network};
          networkState['isConnected'] = isConnected;
          networkState['network'] = false;
          networkState['latestBlock'] = 0;
          this.setState({ network: networkState });
        }
      }
    });
  }

  initNetwork(newNetwork) {
    //checkAccounts();
    const networkState = {...this.state.network};
    networkState['network'] = newNetwork;
    networkState['isConnected'] = true;
    networkState['latestBlock'] = 0;
    this.setState({ network: networkState });
  }

  checkAccounts() {
    web3.eth.getAccounts((error, accounts) => {
      if (!error) {
        const networkState = {...this.state.network};
        networkState['accounts'] = accounts;
        networkState['defaultAccount'] = accounts[0];
        this.setState({ network: networkState });
      }
    });
  }

  addMatch(week, year, local, visitor, time) {
    futbets.objects.futbets.addMatch(week, year, local, visitor, time, (e,r) => {
      console.log(r);
    });
  }

  setMatchResult(matchId) {
    futbets.objects.futbets.setMatchResult(matchId, (e,r) => {
      console.log(r);
    });
  }

  claimPayment(matchId, betId) {
    futbets.objects.futbets.claimPayment(matchId, betId, (e,r) => {
      console.log(r);
    });
  }

  renderContent() {
    return (
      (this.parseUrl() !== null)
            ? ''
            : <Matches matches={this.state.matches}
                      setUrl={this.setUrl}/>
    )
  }

  setUrl(hash) {
    this.setState({ url: hash });
  }

  parseUrl() {
    if(this.state.url !== '' && this.state.coins[this.state.url]) {
      return this.state.url;
    }
    else {
      return null;
    }
  }

  renderNoWeb3() {
    return (
      <NoEthereum />
    );
  }

  changeAccount(newAccount) {
    console.log('New account selected: ', newAccount);
    const networkState = {...this.state.network};
    networkState['defaultAccount'] = newAccount;
    this.setState({ network: networkState });
  }

  render() {
    return (
      <div className="App">
        <NavBar setUrl={this.setUrl} />
        <div className="container">
          <Accounts {...this.state.network} changeAccount={this.changeAccount} />
          {
            this.state.network.isConnected ? this.renderContent() : this.renderNoWeb3()
          }
        </div>
        <Footer />
      </div>
    );
  }
}

export default App;
